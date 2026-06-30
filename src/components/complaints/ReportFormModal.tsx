'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { X, ImagePlus } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { COMPLAINT_ISSUE_TYPES } from '@/constants';
import { validateDescription } from '@/lib/validators/validation';
import styles from './ReportFormModal.module.css';

const MAX_IMAGES = 3;

type Props = {
  onClose: () => void;
};

export function ReportFormModal({ onClose }: Props) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [issueType, setIssueType] = useState('');
  const [area, setArea] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [descTouched, setDescTouched] = useState(false);
  const [descError, setDescError] = useState('');

  const issueOptions = COMPLAINT_ISSUE_TYPES.map((t) => ({ value: t.value, label: t.label }));

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const remaining = MAX_IMAGES - images.length;
    const toAdd = files.slice(0, remaining).filter((f) => f.size <= 10 * 1024 * 1024);
    const newEntries = toAdd.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setImages((prev) => [...prev, ...newEntries]);
    e.target.value = '';
  }

  function removeImage(index: number) {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!issueType || !area || !address) {
      setError('Fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      // Upload images first (in parallel)
      const imageUrls: string[] = [];
      if (images.length > 0) {
        const uploads = images.map(({ file }) => {
          const fd = new FormData();
          fd.append('image', file);
          return fetch('/api/complaints/upload', { method: 'POST', body: fd })
            .then((r) => r.json())
            .then((json) => {
              if (json.ok) return json.data.url as string;
              throw new Error(json.error?.message || 'Upload failed');
            });
        });
        const results = await Promise.all(uploads);
        imageUrls.push(...results);
      }

      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueType,
          area,
          address,
          description: description || undefined,
          imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        }),
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
    <motion.div
      className={styles.overlay}
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: reduced ? 1 : 0.96, y: reduced ? 0 : 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: reduced ? 1 : 0.97, y: reduced ? 0 : 6 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      >
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

          {/* Image upload */}
          <div className={styles.field}>
            <label className={styles.textareaLabel}>Supporting Photos (optional)</label>
            <p className={styles.textareaHint}>Up to {MAX_IMAGES} photos · Max 10 MB each · JPG, PNG, or WebP</p>
            <div className={styles.imageRow}>
              {images.map((img, i) => (
                <div key={img.preview} className={styles.imgThumb}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.preview} alt={`Photo ${i + 1}`} className={styles.thumbImg} />
                  <button
                    type="button"
                    className={styles.removeImg}
                    onClick={() => removeImage(i)}
                    aria-label="Remove photo"
                  >
                    <X size={12} strokeWidth={2} />
                  </button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <button
                  type="button"
                  className={styles.addImgBtn}
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Add photo"
                >
                  <ImagePlus size={20} strokeWidth={1.5} />
                  <span>Add photo</span>
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

          {error && <p className={styles.error}>{error}</p>}

          <Button type="submit" size="lg" isLoading={loading} disabled={!issueType || !area || !address}>
            {loading && images.length > 0 ? 'Uploading & submitting…' : 'File a report'}
          </Button>
        </form>
      </motion.div>
    </motion.div>
  );
}
