'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ImagePlus, X, MapPinOff, ArrowLeft } from 'lucide-react';
import { GoogleMap, Marker } from '@react-google-maps/api';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AddressInput } from '@/components/ui/AddressInput';
import { Select } from '@/components/ui/Select';
import { COMPLAINT_ISSUE_TYPES } from '@/constants';
import { validateDescription } from '@/lib/validators/validation';
import { useGoogleMapsLoader, LAGOS_CENTER } from '@/lib/mapsLoader';
import styles from './page.module.css';

type Preview = { file: File; objectUrl: string };
type Coords = { lat: number; lng: number };

export default function ReportComplaintPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isLoaded: mapsLoaded, loadError: mapsLoadError } = useGoogleMapsLoader();
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const [issueType, setIssueType] = useState('');
  const [area, setArea] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<Coords | null>(null);
  const [description, setDescription] = useState('');
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const [descTouched, setDescTouched] = useState(false);
  const [descError, setDescError] = useState('');

  const issueOptions = COMPLAINT_ISSUE_TYPES.map((t) => ({ value: t.value, label: t.label }));

  useEffect(() => {
    if (mapsLoaded && window.google) {
      geocoderRef.current = new google.maps.Geocoder();
    }
  }, [mapsLoaded]);

  // Happy path: silently prefill the map with the resident's current location on load.
  // Edge case: permission denied/unavailable — map just falls back to the Lagos center pin
  // below, and the resident can still search or drag the pin manually.
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        // silent — resident can still set location via search or by dragging the pin
      },
      { timeout: 8000 }
    );
  }, []);

  const reverseGeocode = useCallback((next: Coords) => {
    setCoords(next);
    if (!geocoderRef.current) return;
    geocoderRef.current.geocode({ location: next }, (results, status) => {
      // Edge case: geocoder returns no results (e.g. pin dropped over water/empty land) —
      // keep the existing typed address rather than overwriting it with nothing useful.
      if (status === 'OK' && results?.[0]) {
        setAddress(results[0].formatted_address);
      }
    });
  }, []);

  function handleMarkerDragEnd(e: google.maps.MapMouseEvent) {
    if (!e.latLng) return;
    reverseGeocode({ lat: e.latLng.lat(), lng: e.latLng.lng() });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = 3 - previews.length;
    const toAdd = files.slice(0, remaining).map((file) => ({
      file,
      objectUrl: URL.createObjectURL(file),
    }));
    setPreviews((p) => [...p, ...toAdd]);
    e.target.value = '';
  }

  function removePhoto(index: number) {
    setPreviews((p) => {
      URL.revokeObjectURL(p[index].objectUrl);
      return p.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setDuplicateWarning('');

    if (!issueType || !area || !address) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);

    // Edge case: resident never granted location and never touched the map/search —
    // coords stays null and the report still submits fine, matching prior behavior
    // where coordinates were always optional.
    const lat = coords?.lat;
    const lng = coords?.lng;

    // Upload photos first
    const imageUrls: string[] = [];
    for (const preview of previews) {
      const fd = new FormData();
      fd.append('file', preview.file);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.ok) imageUrls.push(data.url);
      } catch {
        // Photo upload failed — continue without this photo
      }
    }

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueType,
          area,
          address,
          description: description || undefined,
          latitude: lat,
          longitude: lng,
          imageUrls: imageUrls.length ? imageUrls : undefined,
        }),
      });
      const data = await res.json();

      if (!data.ok) {
        if (data.error?.code === 'duplicate') {
          setDuplicateWarning(data.error.message);
          return;
        }
        setError(data.error?.message || 'Failed to submit report.');
        return;
      }

      // Clean up object URLs before navigating
      previews.forEach((p) => URL.revokeObjectURL(p.objectUrl));
      router.push('/complaints');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <Link href="/complaints" className={styles.backBtn}>
          <ArrowLeft size={18} strokeWidth={1.5} />
          <span>Back</span>
        </Link>
        <h1 className={styles.title}>Report an Issue</h1>
        <p className={styles.subtitle}>Describe the problem and we&apos;ll get it sorted.</p>
      </div>

      <div className={styles.formCard}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <Select
          label="Issue Type"
          options={issueOptions}
          placeholder="Select issue type"
          value={issueType}
          onChange={(e) => setIssueType(e.target.value)}
        />

        <Input
          label="Area / Neighbourhood"
          placeholder="e.g. Surulere"
          value={area}
          onChange={(e) => setArea(e.target.value)}
        />

        <AddressInput
          label="Address"
          placeholder="Street address or landmark"
          value={address}
          onChange={setAddress}
          onLocationSelect={setCoords}
        />

        <div className={styles.mapField}>
          {mapsLoadError ? (
            <div className={styles.mapFallback}>
              <MapPinOff size={18} strokeWidth={1.5} />
              &nbsp;Map preview unavailable — you can still type your address above.
            </div>
          ) : mapsLoaded ? (
            <>
              <div className={styles.mapWrap}>
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={coords ?? LAGOS_CENTER}
                  zoom={coords ? 16 : 11}
                  options={{
                    disableDefaultUI: true,
                    zoomControl: true,
                    gestureHandling: 'greedy',
                  }}
                >
                  <Marker
                    position={coords ?? LAGOS_CENTER}
                    draggable
                    onDragEnd={handleMarkerDragEnd}
                  />
                </GoogleMap>
              </div>
              <p className={styles.mapHint}>
                {coords
                  ? 'Drag the pin if this isn’t quite right.'
                  : 'Search an address above or drag the pin to set your location.'}
              </p>
            </>
          ) : (
            <div className={styles.mapFallback}>Loading map…</div>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.textareaLabel}>Description (optional)</label>
          <textarea
            className={`${styles.textarea} ${descError ? styles.textareaError : ''}`}
            placeholder="Describe the issue in more detail…"
            value={description}
            onChange={(e) => {
              const val = e.target.value.slice(0, 500);
              setDescription(val);
              if (descTouched) setDescError(validateDescription(val) || '');
            }}
            onBlur={() => {
              setDescTouched(true);
              setDescError(validateDescription(description) || '');
            }}
            rows={3}
          />
          <div className={styles.textareaBottom}>
            {descError && <span className={styles.descError}>{descError}</span>}
            <span className={styles.charCounter}>{description.length} / 500</span>
          </div>
        </div>

        {/* ─── Photo Upload ─── */}
        <div className={styles.field}>
          <label className={styles.textareaLabel}>
            Photos <span className={styles.photoHint}>— up to 3, optional</span>
          </label>
          <div className={styles.photoGrid}>
            {previews.map((p, i) => (
              <div key={p.objectUrl} className={styles.photoPreview}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.objectUrl} alt={`Photo ${i + 1}`} className={styles.photoImg} />
                <button
                  className={styles.removePhoto}
                  onClick={() => removePhoto(i)}
                  type="button"
                  aria-label="Remove photo"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            ))}
            {previews.length < 3 && (
              <button
                className={styles.addPhoto}
                onClick={() => fileInputRef.current?.click()}
                type="button"
                aria-label="Add photo"
              >
                <ImagePlus size={24} strokeWidth={1.5} />
                <span className={styles.addPhotoLabel}>Add photo</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            multiple
            className={styles.hiddenInput}
            onChange={handleFileChange}
          />
        </div>

        {duplicateWarning && (
          <p className={styles.duplicateWarning}>{duplicateWarning}</p>
        )}
        {error && <p className={styles.error}>{error}</p>}

        <Button type="submit" size="lg" isLoading={loading} disabled={!issueType || !area || !address}>
          Submit Report
        </Button>
      </form>
      </div>
    </div>
  );
}
