export type FieldErrors = Record<string, string>;

export function validateEmail(value: string): string | null {
  if (!value) return null;
  if (!value.includes('@')) return 'Email address must include \'@\'';
  if (!value.includes('.')) return 'Please enter a valid email address (e.g. name@example.com)';
  return null;
}

export function validatePhone(value: string): string | null {
  if (!value) return null;
  const cleaned = value.replace(/\D/g, '');
  if (/[a-zA-Z]/.test(value)) return 'Phone number can only contain digits';
  if (cleaned.length < 10) return 'Please enter a valid Nigerian phone number';
  if (!/^0/.test(cleaned) && !/^234/.test(cleaned)) return 'Phone number should start with 0 or +234';
  return null;
}

export function validateEmailOrPhone(value: string): string | null {
  if (!value) return null;
  if (value.includes('@')) return validateEmail(value);
  const digitCount = (value.match(/\d/g) || []).length;
  const alphaCount = (value.match(/[a-zA-Z]/g) || []).length;
  if (alphaCount >= digitCount && alphaCount > 0) {
    return 'Enter a valid email address (e.g. example@mail.com).';
  }
  return validatePhone(value);
}

export type PasswordRule = { key: string; label: string; test: (v: string) => boolean };

export const passwordRules: PasswordRule[] = [
  { key: 'min', label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { key: 'upper', label: 'At least one uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { key: 'lower', label: 'At least one lowercase letter', test: (v) => /[a-z]/.test(v) },
  { key: 'number', label: 'At least one number', test: (v) => /[0-9]/.test(v) },
  { key: 'special', label: 'At least one special character', test: (v) => /[^a-zA-Z0-9]/.test(v) },
];

export function getPasswordErrors(value: string): string[] {
  return passwordRules.filter((r) => !r.test(value)).map((r) => r.label);
}

export function validateRequired(value: string, label: string): string | null {
  if (!value.trim()) return `${label} is required.`;
  return null;
}

export function validateName(value: string): string | null {
  if (!value.trim()) return null;
  if (/\d/.test(value)) return 'Name cannot contain numbers';
  if (!/^[a-zA-Z\s'\-]+$/.test(value)) return 'Name can only contain letters, hyphens, and apostrophes';
  if (value.trim().length < 2) return 'Please enter your full name';
  return null;
}

export function validateAddress(value: string): string | null {
  if (!value.trim()) return null;
  if (/^\d+$/.test(value.trim())) return 'Address seems incomplete \u2014 please include a street name';
  if (value.trim().length < 10) return 'Please enter your full street address';
  return null;
}

export function validateOtpCode(value: string): string | null {
  if (!value) return null;
  if (value.length < 6) return 'Code must be 6 digits';
  return null;
}

export function validateDescription(value: string): string | null {
  if (!value.trim()) return null;
  if (value.trim().length < 20) return 'Please describe the issue in a bit more detail';
  return null;
}

export function maskIdentifier(value: string): string {
  if (!value) return '';
  if (value.includes('@')) {
    const [local, domain] = value.split('@');
    if (local.length <= 2) return `${local}***@${domain}`;
    return `${local.slice(0, 2)}***@${domain}`;
  }
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length >= 10) {
    const last4 = cleaned.slice(-4);
    if (value.startsWith('+234')) {
      return `+234 *** *** ${last4}`;
    }
    if (value.startsWith('0')) {
      return `0*** *** ${last4}`;
    }
    return `*** *** ${last4}`;
  }
  return value;
}
