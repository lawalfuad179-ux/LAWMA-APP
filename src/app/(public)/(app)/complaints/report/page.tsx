'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, X } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { COMPLAINT_ISSUE_TYPES } from '@/constants';
import { validateDescription } from '@/lib/validators/validation';
import styles from './page.module.css';

type Preview = { file: File; objectUrl: string };

export default function ReportComplaintPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [issueType, setIssueType] = useState('');
  const [area, setArea] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const [descTouched, setDescTouched] = useState(false);
  const [descError, setDescError] = useState('');

  const issueOptions = COMPLAINT_ISSUE_TYPES.map((t) => ({ value: t.value, label: t.label }));

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

    let lat: number | undefined;
    let lng: number | undefined;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
      );
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {
      // GPS unavailable — proceed without coordinates
    }

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
      <h1 className={styles.title}>Report an Issue</h1>

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

        <Input
          label="Address"
          placeholder="Street address or landmark"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <div className={styles.field}>
          <label className={styles.textareaLabel}>Description (optional)</label>
          <textarea
            className={`${styles.textarea} ${descError ? styles.textareaError : ''}`}
            placeholder="Describe the issue in more detail\u2026"
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

        <Button type="submit" size="lg" isLoading={loading}>
          Submit Report
        </Button>
      </form>
    </div>
  );
}
