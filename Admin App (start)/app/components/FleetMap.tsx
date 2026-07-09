'use client';

import { useEffect, useMemo, useState } from 'react';
import { GoogleMap, Marker, Polyline, Polygon, useJsApiLoader } from '@react-google-maps/api';

type LatLng = { lat: number; lng: number };

// Surulere LGA rough boundary
const SURULERE_BOUNDS: LatLng[] = [
  { lat: 6.5185, lng: 3.3402 },
  { lat: 6.5202, lng: 3.3510 },
  { lat: 6.5178, lng: 3.3612 },
  { lat: 6.5090, lng: 3.3695 },
  { lat: 6.4960, lng: 3.3712 },
  { lat: 6.4842, lng: 3.3650 },
  { lat: 6.4785, lng: 3.3520 },
  { lat: 6.4820, lng: 3.3402 },
  { lat: 6.4930, lng: 3.3350 },
  { lat: 6.5060, lng: 3.3355 },
];

// 5 routes — each ~7 points snapping along Surulere roads (Bode Thomas, Adelabu, Ogunlana, Aguda, Itire)
const ROUTES: { id: string; color: string; path: LatLng[] }[] = [
  { id: 'T-01', color: '#149954', path: [ // Route A — Bode Thomas
    { lat: 6.5010, lng: 3.3480 },
    { lat: 6.5030, lng: 3.3505 },
    { lat: 6.5062, lng: 3.3542 },
    { lat: 6.5088, lng: 3.3575 },
    { lat: 6.5104, lng: 3.3610 },
    { lat: 6.5088, lng: 3.3646 },
    { lat: 6.5052, lng: 3.3660 },
    { lat: 6.5010, lng: 3.3640 },
  ]},
  { id: 'T-02', color: '#1976D2', path: [ // Route B — Adelabu
    { lat: 6.4972, lng: 3.3540 },
    { lat: 6.4990, lng: 3.3562 },
    { lat: 6.5008, lng: 3.3590 },
    { lat: 6.5028, lng: 3.3615 },
    { lat: 6.5050, lng: 3.3645 },
    { lat: 6.5065, lng: 3.3670 },
    { lat: 6.5045, lng: 3.3690 },
  ]},
  { id: 'T-03', color: '#D57A00', path: [ // Route C — Ogunlana Drive
    { lat: 6.4930, lng: 3.3470 },
    { lat: 6.4950, lng: 3.3500 },
    { lat: 6.4980, lng: 3.3538 },
    { lat: 6.5006, lng: 3.3575 },
    { lat: 6.5030, lng: 3.3612 },
    { lat: 6.5010, lng: 3.3640 },
  ]},
  { id: 'T-04', color: '#149954', path: [ // Route D — Aguda
    { lat: 6.4885, lng: 3.3455 },
    { lat: 6.4910, lng: 3.3488 },
    { lat: 6.4938, lng: 3.3520 },
    { lat: 6.4962, lng: 3.3555 },
    { lat: 6.4980, lng: 3.3592 },
    { lat: 6.4970, lng: 3.3625 },
  ]},
  { id: 'T-05', color: '#8A8A8A', path: [ // Route E — Itire Road (returning)
    { lat: 6.4850, lng: 3.3540 },
    { lat: 6.4880, lng: 3.3565 },
    { lat: 6.4912, lng: 3.3600 },
    { lat: 6.4942, lng: 3.3628 },
    { lat: 6.4972, lng: 3.3620 },
    { lat: 6.4995, lng: 3.3605 },
  ]},
];

const CENTER: LatLng = { lat: 6.4960, lng: 3.3555 };

function interpolate(a: LatLng, b: LatLng, t: number): LatLng {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
}

function positionOnPath(path: LatLng[], progress: number): LatLng {
  // progress is 0..1 around the whole path (wrapping)
  const segs = path.length;
  const p = ((progress % 1) + 1) % 1;
  const scaled = p * segs;
  const idx = Math.floor(scaled) % segs;
  const nextIdx = (idx + 1) % segs;
  const t = scaled - Math.floor(scaled);
  return interpolate(path[idx], path[nextIdx], t);
}

// Google Maps light theme — minimal overrides, keep default road styling for clear streets
const MAP_STYLE: google.maps.MapTypeStyle[] = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
];

const LIBRARIES: 'places'[] = ['places'];

type Variant = 'mini' | 'full';

export function FleetMap({ variant = 'full' }: { variant?: Variant }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES,
  });

  // per-route offsets so they start at different points on their loop
  const offsets = useMemo(() => ROUTES.map((_, i) => i * 0.17), []);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick(t => t + 1), variant === 'mini' ? 800 : 500);
    return () => window.clearInterval(id);
  }, [variant]);

  const positions = useMemo(() => {
    // full loop period ~40 ticks
    return ROUTES.map((r, i) => positionOnPath(r.path, offsets[i] + tick / 40));
  }, [tick, offsets]);

  const truckIcon = (color: string) => ({
    path:
      'M -10 -6 L 6 -6 L 6 -3 L 10 -3 L 12 0 L 12 5 L 8 5 A 2 2 0 1 1 4 5 L -2 5 A 2 2 0 1 1 -6 5 L -10 5 Z',
    fillColor: color,
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale: variant === 'mini' ? 0.9 : 1.15,
    anchor: new google.maps.Point(0, 0),
  } as google.maps.Symbol);

  const containerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: variant === 'mini' ? 10 : 0,
  };

  if (!isLoaded) {
    return <div className="mapLoading" style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'var(--color-text-secondary)', fontSize: 13, background: 'var(--color-surface-container-low)', borderRadius: variant === 'mini' ? 10 : 0 }}>Loading map…</div>;
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={CENTER}
      zoom={variant === 'mini' ? 14 : 14.4}
      options={{
        styles: MAP_STYLE,
        disableDefaultUI: true,
        zoomControl: variant === 'full',
        gestureHandling: variant === 'mini' ? 'none' : 'greedy',
        clickableIcons: false,
      }}
    >
      {/* Surulere LGA overlay */}
      <Polygon
        paths={SURULERE_BOUNDS}
        options={{
          strokeColor: 'hsl(24, 98%, 50%)',
          strokeOpacity: 0.7,
          strokeWeight: 1.5,
          fillColor: 'hsl(24, 98%, 50%)',
          fillOpacity: 0.06,
          clickable: false,
        }}
      />

      {/* Route polylines */}
      {ROUTES.map(r => (
        <Polyline
          key={r.id}
          path={r.path}
          options={{
            strokeColor: r.color,
            strokeOpacity: variant === 'mini' ? 0.55 : 0.75,
            strokeWeight: variant === 'mini' ? 2.5 : 3.5,
            geodesic: true,
          }}
        />
      ))}

      {/* Truck markers */}
      {positions.map((pos, i) => (
        <Marker
          key={ROUTES[i].id}
          position={pos}
          icon={truckIcon(ROUTES[i].color)}
          label={variant === 'full' ? {
            text: ROUTES[i].id,
            color: '#1f2937',
            fontSize: '10px',
            fontWeight: '700',
            className: 'fleetMapLabel',
          } : undefined}
        />
      ))}
    </GoogleMap>
  );
}
