'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { COMPLAINT_ISSUE_TYPES } from '@/constants';
import { validateDescription } from '@/lib/validators/validation';
import styles from './EditComplaintForm.module.css';

type Props = {
  complaintId: string;
  initialIssueType: string;
  initialArea: string;
  initialAddress: string;
  initialDescription: string;
};

export function EditComplaintForm({
  complaintId,
  initialIssueType,
  initialArea,
  initialAddress,
  initialDescription,
}: Props) {
  const router = useRouter();

  const [issueType, setIssueType] = useState(initialIssueType);
  const [area, setArea] = useState(initialArea);
  const [address, setAddress] = useState(initialAddress);
  const [description, setDescription] = useState(initialDescription);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [descTouched, setDescTouched] = useState(false);
  const [descError, setDescError] = useState('');

  const issueOptions = COMPLAINT_ISSUE_TYPES.map((t) => ({ value: t.value, label: t.label }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!issueType || !area || !address) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueType,
          area,
          address,
          description: description || undefined,
        }),
      });
      const data = await res.json();

      if (!data.ok) {
        setError(data.error?.message || 'Failed to update report.');
        return;
      }

      router.push(`/complaints/${complaintId}`);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
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

      {error && <p className={styles.error}>{error}</p>}

      <Button type="submit" size="lg" isLoading={loading} disabled={!issueType || !area || !address}>
        Update Report
      </Button>
    </form>
  );
}
