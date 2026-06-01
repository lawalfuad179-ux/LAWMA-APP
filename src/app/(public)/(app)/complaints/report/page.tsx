'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { COMPLAINT_ISSUE_TYPES } from '@/constants';
import styles from './page.module.css';

export default function ReportComplaintPage() {
  const router = useRouter();
  const [issueType, setIssueType] = useState('');
  const [area, setArea] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState('');

  const issueOptions = COMPLAINT_ISSUE_TYPES.map((t) => ({ value: t.value, label: t.label }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setDuplicateWarning('');

    if (!issueType || !area || !address) {
      setError('Please fill in all required fields.');
      return;
    }

    let lat: number | undefined;
    let lng: number | undefined;

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
      );
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {
      // GPS failed — proceed without coordinates
    }

    setLoading(true);
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueType, area, address, description: description || undefined, latitude: lat, longitude: lng }),
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
            className={styles.textarea}
            placeholder="Describe the issue..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        {duplicateWarning ? (
          <p className={styles.duplicateWarning}>{duplicateWarning}</p>
        ) : null}

        {error ? <p className={styles.error}>{error}</p> : null}

        <Button type="submit" size="lg" isLoading={loading}>
          Submit Report
        </Button>
      </form>
    </div>
  );
}
