'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, AlertCircle, Plus } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { COMPLAINT_ISSUE_TYPES } from '@/constants';
import { validateDescription } from '@/lib/validators/validation';
import styles from './ReportFormModal.module.css';

type Props = {
  onClose: () => void;
};

export function ReportFormModal({ onClose }: Props) {
  const router = useRouter();
  const [issueType, setIssueType] = useState('');
  const [area, setArea] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [descTouched, setDescTouched] = useState(false);
  const [descError, setDescError] = useState('');

  const issueOptions = COMPLAINT_ISSUE_TYPES.map((t) => ({ value: t.value, label: t.label }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!issueType || !area || !address) {
      setError('Fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueType, area, address, description: description || undefined }),
      });
      const data = await res.json();

      if (!data.ok) {
        setError(data.error?.message || 'Failed to submit report.');
        return;
      }

      router.push(`/complaints/${data.data.id}`);
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>File a Report</h2>
          <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="Close">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

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
            <p className={styles.textareaHint}>Include any relevant details — time of issue, frequency, nearby landmarks.</p>
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

          <Button type="submit" size="lg" isLoading={loading}>
            File a report
          </Button>
        </form>
      </div>
    </div>
  );
}
