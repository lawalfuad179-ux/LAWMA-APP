'use client';

import { useEffect, useRef, useState } from 'react';
import { LocateFixed, Loader2 } from 'lucide-react';
import { Input } from './Input';
import { useGoogleMapsLoader, LAGOS_CENTER } from '@/lib/mapsLoader';
import styles from './AddressInput.module.css';

type Coords = { lat: number; lng: number };

type AddressInputProps = {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onLocationSelect?: (coords: Coords) => void;
  error?: string;
  helpText?: string;
  id?: string;
  icon?: React.ReactNode;
  autoComplete?: string;
  disabled?: boolean;
};

type Suggestion = { placeId: string; description: string };

export function AddressInput({
  label,
  placeholder,
  value,
  onChange,
  onLocationSelect,
  error,
  helpText,
  id,
  icon,
  autoComplete = 'off',
  disabled = false,
}: AddressInputProps) {
  const { isLoaded } = useGoogleMapsLoader();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoder = useRef<google.maps.Geocoder | null>(null);
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  useEffect(() => {
    if (isLoaded && window.google) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
      geocoder.current = new google.maps.Geocoder();
      sessionToken.current = new google.maps.places.AutocompleteSessionToken();
    }
  }, [isLoaded]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setSuggestions([]);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleInputChange(text: string) {
    onChange(text);
    if (!autocompleteService.current || !text.trim()) {
      setSuggestions([]);
      return;
    }
    autocompleteService.current.getPlacePredictions(
      {
        input: text,
        componentRestrictions: { country: 'ng' },
        locationBias: new google.maps.Circle({ center: LAGOS_CENTER, radius: 50000 }),
        sessionToken: sessionToken.current ?? undefined,
      },
      (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(
            predictions.map((p) => ({ placeId: p.place_id, description: p.description }))
          );
        } else {
          setSuggestions([]);
        }
      }
    );
  }

  function handleSelect(suggestion: Suggestion) {
    onChange(suggestion.description);
    setSuggestions([]);
    if (geocoder.current) {
      geocoder.current.geocode({ placeId: suggestion.placeId }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const loc = results[0].geometry.location;
          onLocationSelect?.({ lat: loc.lat(), lng: loc.lng() });
        }
      });
    }
    sessionToken.current = new google.maps.places.AutocompleteSessionToken();
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setLocateError('Location not supported on this device.');
      return;
    }
    setLocating(true);
    setLocateError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (!geocoder.current) {
          onChange(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
          onLocationSelect?.({ lat: latitude, lng: longitude });
          setLocating(false);
          return;
        }
        geocoder.current.geocode(
          { location: { lat: latitude, lng: longitude } },
          (results, status) => {
            if (status === 'OK' && results?.[0]) {
              onChange(results[0].formatted_address);
            } else {
              onChange(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
            }
            onLocationSelect?.({ lat: latitude, lng: longitude });
            setLocating(false);
          }
        );
      },
      () => {
        setLocateError('Location permission denied.');
        setLocating(false);
      },
      { timeout: 8000 }
    );
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <div className={styles.inputRow}>
        <div className={styles.inputGrow}>
          <Input
            id={id}
            label={label}
            placeholder={placeholder}
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            error={error}
            helpText={helpText}
            icon={icon}
            autoComplete={autoComplete}
            disabled={disabled}
          />
        </div>
        <button
          type="button"
          className={styles.locateBtn}
          onClick={handleUseCurrentLocation}
          disabled={!isLoaded || locating || disabled}
          aria-label="Use current location"
          title="Use current location"
        >
          {locating ? (
            <Loader2 size={18} strokeWidth={2} className={styles.spin} />
          ) : (
            <LocateFixed size={18} strokeWidth={2} />
          )}
        </button>
      </div>
      {locateError && <p className={styles.locateError}>{locateError}</p>}
      {suggestions.length > 0 && (
        <ul className={styles.suggestions}>
          {suggestions.map((s) => (
            <li key={s.placeId}>
              <button
                type="button"
                onClick={() => handleSelect(s)}
                className={styles.suggestionItem}
              >
                {s.description}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
