'use client';

import { useEffect, useRef, useState } from 'react';
import { GoogleMap, Marker, Polyline } from '@react-google-maps/api';
import { Truck, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useGoogleMapsLoader, LAGOS_CENTER } from '@/lib/mapsLoader';
import styles from './TrackPickupMap.module.css';

type Props = {
  pspName: string;
  windowStart: string;
  windowEnd: string;
  children?: React.ReactNode;
};

// Demo route: a short, plausible-looking path near the resident's area.
// Not real GPS — there is no driver-side location source to plug into yet
// (see roadmap note in the UI). Straight-line interpolation is enough to
// communicate the concept for a live walkthrough.
const ROUTE_ORIGIN = { lat: LAGOS_CENTER.lat + 0.014, lng: LAGOS_CENTER.lng - 0.01 };
const ROUTE_DESTINATION = { lat: LAGOS_CENTER.lat - 0.006, lng: LAGOS_CENTER.lng + 0.012 };
const CYCLE_MS = 24_000; // full simulated trip length

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function TrackPickupMap({ pspName, windowStart, windowEnd, children }: Props) {
  const { isLoaded, loadError } = useGoogleMapsLoader();
  const [expanded, setExpanded] = useState(false);
  // Tracks whether the panel has ever been opened, so the map only mounts
  // (and Google Maps only loads) the first time it's needed — the grid-rows
  // collapse below keeps the wrapper in the DOM at all times for the
  // animation, independent of this.
  const [hasOpened, setHasOpened] = useState(false);
  const [progress, setProgress] = useState(0);
  const startRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!expanded) {
      startRef.current = null;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      return;
    }

    function tick(timestamp: number) {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = (timestamp - startRef.current) % CYCLE_MS;
      setProgress(elapsed / CYCLE_MS);
      frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [expanded]);

  const truckPosition = {
    lat: lerp(ROUTE_ORIGIN.lat, ROUTE_DESTINATION.lat, progress),
    lng: lerp(ROUTE_ORIGIN.lng, ROUTE_DESTINATION.lng, progress),
  };
  const etaMinutes = Math.max(1, Math.round((1 - progress) * 18));

  return (
    <div className={styles.wrap}>
      <div className={styles.headerRow}>
        {children}
        <button
          type="button"
          className={styles.toggle}
          onClick={() =>
            setExpanded((v) => {
              const next = !v;
              if (next) setHasOpened(true);
              return next;
            })
          }
          aria-expanded={expanded}
        >
          <Truck size={15} strokeWidth={1.5} />
          <span>Track my pickup</span>
          {expanded ? <ChevronUp size={15} strokeWidth={1.5} /> : <ChevronDown size={15} strokeWidth={1.5} />}
        </button>
      </div>

      {/* Grid-rows collapse: animating height:auto isn't possible in CSS, so
          the wrapper stays mounted and transitions grid-template-rows between
          0fr (collapsed) and 1fr (expanded) instead — smooth open AND close
          with no JS height measurement. */}
      <div className={`${styles.collapse} ${expanded ? styles.collapseOpen : ''}`}>
        <div className={styles.collapseInner}>
          <div className={styles.panel}>
            {hasOpened &&
              (loadError ? (
                <div className={styles.fallback}>Map preview unavailable right now.</div>
              ) : !isLoaded ? (
                <div className={styles.fallback}>Loading map…</div>
              ) : (
                <>
                  <div className={styles.mapWrap}>
                    <GoogleMap
                      mapContainerStyle={{ width: '100%', height: '100%' }}
                      center={truckPosition}
                      zoom={14}
                      options={{ disableDefaultUI: true, gestureHandling: 'greedy' }}
                    >
                      <Polyline
                        path={[ROUTE_ORIGIN, ROUTE_DESTINATION]}
                        options={{ strokeColor: '#F97316', strokeOpacity: 0.4, strokeWeight: 3 }}
                      />
                      <Marker position={truckPosition} label={{ text: '🚛', fontSize: '18px' }} />
                      <Marker
                        position={ROUTE_DESTINATION}
                        label={{ text: '📍', fontSize: '16px' }}
                      />
                    </GoogleMap>
                  </div>
                  <div className={styles.metaRow}>
                    <span className={styles.eta}>~{etaMinutes} min away</span>
                    <span className={styles.window}>{windowStart} – {windowEnd} · {pspName}</span>
                  </div>
                  <div className={styles.disclaimer}>
                    <Info size={13} strokeWidth={1.5} />
                    <span>
                      Simulated preview — live truck tracking rolls out once PSP drivers share GPS location (Phase 3).
                    </span>
                  </div>
                </>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
