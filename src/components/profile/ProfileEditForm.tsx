'use client';

import { useState } from 'react';
import { Pencil, X, Check } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { LAGOS_LGAS } from '@/constants';
import styles from './ProfileEditForm.module.css';

type Props = {
  initialName: string;
  initialAddress: string;
  initialLga: string;
};

export function ProfileEditForm({ initialName, initialAddress, initialLga }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [address, setAddress] = useState(initialAddress);
  const [lga, setLga] = useState(initialLga);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const lgaOptions = LAGOS_LGAS.map((l) => ({ value: l, label: l }));

  function handleCancel() {
    setName(initialName);
    setAddress(initialAddress);
    setLga(initialLga);
    setError('');
    setEditing(false);
  }

  async function handleSave() {
    setError('');
    if (!name.trim() || !address.trim() || !lga.trim()) {
      setError('All fields are required.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), address: address.trim(), lga: lga.trim() }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || 'Failed to save changes.');
        return;
      }
      setSuccess(true);
      setEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className={styles.viewRoot}>
        {success && (
          <div className={styles.successBanner}>
            <Check size={16} strokeWidth={2} />
            Profile updated successfully.
          </div>
        )}
        <div className={styles.row}>
          <span className={styles.label}>Name</span>
          <span className={styles.value}>{name || 'Not set'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>LGA</span>
          <span className={styles.value}>{lga || 'Not set'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Address</span>
          <span className={styles.value}>{address || 'Not set'}</span>
        </div>
        <button className={styles.editBtn} onClick={() => setEditing(true)} type="button">
          <Pencil size={15} strokeWidth={1.5} />
          Edit profile
        </button>
      </div>
    );
  }

  return (
    <div className={styles.editRoot}>
      <div className={styles.editHeader}>
        <span className={styles.editTitle}>Edit profile</span>
        <button className={styles.cancelIcon} onClick={handleCancel} type="button" aria-label="Cancel editing">
          <X size={18} strokeWidth={1.5} />
        </button>
      </div>

      <Input
        label="Full Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your full name"
        autoComplete="name"
      />
      <Select
        label="Local Government Area"
        options={lgaOptions}
        value={lga}
        onChange={(e) => setLga(e.target.value)}
        placeholder="Select your LGA"
      />
      <Input
        label="Street Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Your home or estate address"
        autoComplete="street-address"
      />

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.editActions}>
        <Button variant="ghost" size="md" onClick={handleCancel} type="button">Cancel</Button>
        <Button size="md" isLoading={saving} onClick={handleSave} type="button">Save changes</Button>
      </div>
    </div>
  );
}
