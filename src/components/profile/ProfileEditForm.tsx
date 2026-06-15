'use client';

import { useState, useEffect } from 'react';
import { Pencil, X, Check } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { OtpInput } from '@/components/ui/OtpInput';
import { LAGOS_LGAS } from '@/constants';
import {
  validateName,
  validateAddress,
  validateEmail,
  validatePhone,
  maskIdentifier,
} from '@/lib/validators/validation';
import styles from './ProfileEditForm.module.css';

type Props = {
  initialName: string;
  initialAddress: string;
  initialLga: string;
  initialEmail: string;
  initialPhone: string;
};

type OtpModal = {
  type: 'email' | 'phone';
  value: string;
  sending: boolean;
  verifying: boolean;
  error: string;
};

export function ProfileEditForm({
  initialName,
  initialAddress,
  initialLga,
  initialEmail,
  initialPhone,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [address, setAddress] = useState(initialAddress);
  const [lga, setLga] = useState(initialLga);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [nameTouched, setNameTouched] = useState(false);
  const [addressTouched, setAddressTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);

  const [nameError, setNameError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const [otpModal, setOtpModal] = useState<OtpModal | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);

  const lgaOptions = LAGOS_LGAS.map((l) => ({ value: l, label: l }));

  useEffect(() => {
    if (otpCountdown <= 0) return;
    const t = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCountdown]);

  function resetForm() {
    setName(initialName);
    setAddress(initialAddress);
    setLga(initialLga);
    setEmail(initialEmail);
    setPhone(initialPhone);
    setError('');
    setNameError(''); setAddressError(''); setEmailError(''); setPhoneError('');
    setNameTouched(false); setAddressTouched(false);
    setEmailTouched(false); setPhoneTouched(false);
  }

  function handleCancel() {
    resetForm();
    setEditing(false);
  }

  async function sendOtp(type: 'email' | 'phone', value: string) {
    setOtpCode('');
    setOtpModal({ type, value, sending: true, verifying: false, error: '' });

    const body = type === 'email' ? { email: value } : { phoneNumber: value };
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) {
        setOtpModal(null);
        setError(data.error?.message || 'Failed to send verification code.');
        return;
      }
      setOtpModal((m) => m ? { ...m, sending: false } : null);
      setOtpCountdown(60);
    } catch {
      setOtpModal(null);
      setError('Network error. Please try again.');
    }
  }

  async function saveProfile() {
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

  async function handleVerifyOtp(code: string) {
    if (!otpModal || code.length !== 6 || otpModal.verifying) return;

    setOtpModal((m) => m ? { ...m, verifying: true, error: '' } : null);

    try {
      const res = await fetch('/api/profile/verify-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: otpModal.type, value: otpModal.value, code }),
      });
      const data = await res.json();

      if (!data.ok) {
        setOtpModal((m) => m ? { ...m, verifying: false, error: data.error || 'Incorrect code.' } : null);
        return;
      }

      setOtpModal(null);
      await saveProfile();
    } catch {
      setOtpModal((m) => m ? { ...m, verifying: false, error: 'Network error. Try again.' } : null);
    }
  }

  async function handleSave() {
    setError('');

    const nErr = validateName(name) || '';
    const aErr = validateAddress(address) || '';
    const eErr = email.trim() ? (validateEmail(email) || '') : '';
    const pErr = !phone.trim()
      ? 'Phone number is required.'
      : (validatePhone(phone) || '');

    setNameError(nErr);
    setAddressError(aErr);
    setEmailError(eErr);
    setPhoneError(pErr);

    if (!name.trim() || !address.trim() || !lga.trim()) {
      setError('Name, LGA, and address are required.');
      return;
    }
    if (nErr || aErr || eErr || pErr) return;

    const emailChanged = email.trim() !== initialEmail;
    const phoneChanged = phone.trim() !== initialPhone;

    if (emailChanged && phoneChanged) {
      setError('Please update your email and phone number one at a time.');
      return;
    }

    if (emailChanged) { await sendOtp('email', email.trim()); return; }
    if (phoneChanged) { await sendOtp('phone', phone.trim()); return; }

    await saveProfile();
  }

  // ── View mode ──
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
        <div className={styles.row}>
          <span className={styles.label}>Email</span>
          <span className={styles.value}>{email || 'Not set'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Phone</span>
          <span className={styles.value}>{phone || 'Not set'}</span>
        </div>
        <button className={styles.editBtn} onClick={() => setEditing(true)} type="button">
          <Pencil size={15} strokeWidth={1.5} />
          Edit profile
        </button>
      </div>
    );
  }

  // ── Edit mode ──
  return (
    <>
      <div className={styles.editRoot}>
        <div className={styles.editHeader}>
          <span className={styles.editTitle}>Edit profile</span>
          <button
            className={styles.cancelIcon}
            onClick={handleCancel}
            type="button"
            aria-label="Cancel editing"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <Input
          label="Full Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (nameTouched) setNameError(validateName(e.target.value) || '');
          }}
          onBlur={() => { setNameTouched(true); setNameError(validateName(name) || ''); }}
          error={nameError}
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
          onChange={(e) => {
            setAddress(e.target.value);
            if (addressTouched) setAddressError(validateAddress(e.target.value) || '');
          }}
          onBlur={() => { setAddressTouched(true); setAddressError(validateAddress(address) || ''); }}
          error={addressError}
          placeholder="Your home or estate address"
          autoComplete="street-address"
        />

        <div className={styles.divider} />

        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailTouched) setEmailError(validateEmail(e.target.value) || '');
          }}
          onBlur={() => { setEmailTouched(true); setEmailError(validateEmail(email) || ''); }}
          error={emailError}
          placeholder="your@email.com"
          autoComplete="email"
          helpText={initialEmail ? 'A verification code will be sent to confirm your new email.' : undefined}
        />
        <Input
          label="Phone number"
          type="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            if (phoneTouched) setPhoneError(validatePhone(e.target.value) || '');
          }}
          onBlur={() => { setPhoneTouched(true); setPhoneError(validatePhone(phone) || ''); }}
          error={phoneError}
          placeholder="08012345678"
          autoComplete="tel"
          helpText="A verification code will be sent to confirm your new number."
        />

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.editActions}>
          <Button variant="ghost" size="md" onClick={handleCancel} type="button">Cancel</Button>
          <Button size="md" isLoading={saving} onClick={handleSave} type="button">Save changes</Button>
        </div>
      </div>

      {/* OTP verification bottom sheet */}
      {otpModal && (
        <div
          className={styles.otpOverlay}
          role="dialog"
          aria-modal="true"
          aria-label={`Verify your ${otpModal.type === 'email' ? 'email' : 'phone number'}`}
        >
          <div className={styles.otpSheet}>
            <div className={styles.otpHeader}>
              <span className={styles.otpTitle}>
                Verify your {otpModal.type === 'email' ? 'email' : 'phone number'}
              </span>
              <button
                className={styles.cancelIcon}
                type="button"
                aria-label="Close"
                onClick={() => { setOtpModal(null); setOtpCode(''); }}
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            {otpModal.sending ? (
              <p className={styles.otpSub}>Sending verification code…</p>
            ) : (
              <>
                <p className={styles.otpSub}>
                  We sent a 6-digit code to{' '}
                  <strong>{maskIdentifier(otpModal.value)}</strong>.
                  Enter it below to confirm the change.
                </p>

                <OtpInput
                  value={otpCode}
                  onChange={(code) => {
                    setOtpCode(code);
                    if (code.length === 6) handleVerifyOtp(code);
                  }}
                  error={otpModal.error}
                  autoFocus
                />

                <Button
                  size="md"
                  isLoading={otpModal.verifying}
                  onClick={() => handleVerifyOtp(otpCode)}
                  type="button"
                  disabled={otpCode.length < 6 || otpModal.verifying}
                >
                  Verify
                </Button>

                <div className={styles.otpResend}>
                  {otpCountdown > 0 ? (
                    <span className={styles.otpCountdown}>
                      Resend code in {otpCountdown}s
                    </span>
                  ) : (
                    <button
                      className={styles.otpResendBtn}
                      type="button"
                      onClick={() => sendOtp(otpModal.type, otpModal.value)}
                    >
                      Resend code
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
