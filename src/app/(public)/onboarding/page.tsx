'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LAGOS_LGAS } from '@/constants';
import { completeOnboarding } from './actions';
import styles from './page.module.css';

export default function SetupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [lga, setLga] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const lgaOptions = LAGOS_LGAS.map((l) => ({ value: l, label: l }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError('');

    const clientErrors: Record<string, string> = {};
    if (name.trim().length < 2) clientErrors.name = 'Name must be at least 2 characters.';
    if (!lga) clientErrors.lga = 'Please select your LGA.';
    if (address.trim().length < 5) clientErrors.address = 'Address must be at least 5 characters.';
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      return;
    }
    setErrors({});

    const formData = new FormData();
    formData.set('name', name.trim());
    formData.set('lga', lga);
    formData.set('address', address.trim());

    setLoading(true);
    try {
      const result = await completeOnboarding(formData);
      if (!result.ok) {
        if (result.error.fieldErrors) {
          setErrors(result.error.fieldErrors);
        } else {
          setServerError(result.error.message);
        }
        return;
      }
      router.push('/dashboard');
    } catch {
      setServerError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Complete Your Profile</h1>
          <p className={styles.subtitle}>Set up your account for waste collection services</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Full Name"
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            autoFocus
            autoComplete="name"
          />

          <Select
            label="Local Government Area"
            options={lgaOptions}
            placeholder="Select your LGA"
            value={lga}
            onChange={(e) => setLga(e.target.value)}
            error={errors.lga}
          />

          <Input
            label="Street Address"
            placeholder="Your home or estate address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            error={errors.address}
            autoComplete="street-address"
          />

          {serverError ? <p className={styles.serverError}>{serverError}</p> : null}

          <Button type="submit" size="lg" isLoading={loading}>
            Complete Setup
          </Button>
        </form>
      </div>
    </div>
  );
}
