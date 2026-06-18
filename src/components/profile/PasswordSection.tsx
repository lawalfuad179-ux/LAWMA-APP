'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PasswordRulesChecklist } from '@/components/ui/PasswordRulesChecklist';
import { getPasswordErrors } from '@/lib/validators/validation';
import styles from './PasswordSection.module.css';

type Props = {
  hasPassword: boolean;
};

export function PasswordSection({ hasPassword: initialHasPassword }: Props) {
  const [hasPassword, setHasPassword] = useState(initialHasPassword);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  function reset() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const passwordErrors = getPasswordErrors(newPassword);
    if (passwordErrors.length > 0) {
      setError(passwordErrors[0]);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = hasPassword ? '/api/profile/change-password' : '/api/profile/set-password';
      const body = hasPassword
        ? { currentPassword, newPassword }
        : { password: newPassword };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!data.ok) {
        setError(data.error?.message || 'Something went wrong.');
        return;
      }

      setSuccess(hasPassword ? 'Password updated successfully.' : 'Password created successfully.');
      if (!hasPassword) setHasPassword(true);
      reset();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.heading}>
        <Lock size={15} strokeWidth={1.5} />
        <span>{hasPassword ? 'Change Password' : 'Create a Password'}</span>
      </div>
      <p className={styles.description}>
        {hasPassword
          ? 'Update your password to keep your account secure.'
          : 'Add a password to sign in without waiting for a verification code.'}
      </p>

      {hasPassword && (
        <Input
          label="Current Password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
        />
      )}

      <div className={styles.passwordGroup}>
        <Input
          label="New Password"
          type="password"
          value={newPassword}
          onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
          autoComplete="new-password"
        />
        <PasswordRulesChecklist password={newPassword} />
      </div>

      <Input
        label="Confirm New Password"
        type="password"
        value={confirmPassword}
        onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
        autoComplete="new-password"
      />

      {error && <p className={styles.error} role="alert">{error}</p>}
      {success && <p className={styles.success} role="status">{success}</p>}

      <Button type="submit" size="md" isLoading={loading}>
        {hasPassword ? 'Update Password' : 'Create Password'}
      </Button>
    </form>
  );
}
