'use client';

import { useState } from 'react';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PasswordRulesChecklist } from '@/components/ui/PasswordRulesChecklist';
import { getPasswordErrors } from '@/lib/validators/validation';
import { useToast } from '@/context/ToastContext';
import styles from './PasswordSection.module.css';

type Props = {
  hasPassword: boolean;
  onSuccess?: () => void;
};

export function PasswordSection({ hasPassword: initialHasPassword, onSuccess }: Props) {
  const toast = useToast();
  const [hasPassword, setHasPassword] = useState(initialHasPassword);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPasswordState, setCurrentPasswordState] = useState<'error' | null>(null);
  const [inlineError, setInlineError] = useState('');
  const [loading, setLoading] = useState(false);

  // Real-time confirm field state: green if matches, red if non-empty and doesn't match
  const confirmFieldState =
    confirmPassword.length === 0
      ? null
      : confirmPassword === newPassword
        ? 'success' as const
        : 'error' as const;

  function reset() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setCurrentPasswordState(null);
    setInlineError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setInlineError('');

    const passwordErrors = getPasswordErrors(newPassword);
    if (passwordErrors.length > 0) {
      setInlineError(passwordErrors[0]);
      return;
    }
    if (newPassword !== confirmPassword) {
      setInlineError('Passwords do not match.');
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
        if (data.error?.code === 'wrong_password') {
          setCurrentPasswordState('error');
        } else {
          toast(data.error?.message || 'Something went wrong.', 'error');
        }
        return;
      }

      toast(
        hasPassword ? 'Password updated successfully.' : 'Password created successfully.',
        'success',
      );
      if (!hasPassword) setHasPassword(true);
      reset();
      onSuccess?.();
    } catch {
      toast('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
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
          onChange={(e) => {
            setCurrentPassword(e.target.value);
            setCurrentPasswordState(null);
          }}
          fieldState={currentPasswordState}
          autoComplete="current-password"
        />
      )}

      <div className={styles.passwordGroup}>
        <Input
          label="New Password"
          type="password"
          value={newPassword}
          onChange={(e) => { setNewPassword(e.target.value); setInlineError(''); }}
          autoComplete="new-password"
        />
        <PasswordRulesChecklist password={newPassword} />
      </div>

      <Input
        label="Confirm New Password"
        type="password"
        value={confirmPassword}
        onChange={(e) => { setConfirmPassword(e.target.value); setInlineError(''); }}
        fieldState={confirmFieldState}
        error={inlineError}
        autoComplete="new-password"
      />

      <Button
        type="submit"
        size="md"
        isLoading={loading}
        disabled={
          getPasswordErrors(newPassword).length > 0 ||
          confirmFieldState !== 'success' ||
          (hasPassword && !currentPassword.trim())
        }
      >
        {hasPassword ? 'Update Password' : 'Create Password'}
      </Button>
    </form>
  );
}
