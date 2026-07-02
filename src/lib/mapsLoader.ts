'use client';

import { useJsApiLoader } from '@react-google-maps/api';

const GOOGLE_MAPS_LIBRARIES: 'places'[] = ['places'];

export function useGoogleMapsLoader() {
  return useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
  });
}

export const LAGOS_CENTER = { lat: 6.5244, lng: 3.3792 };
