export type FieldErrors = Record<string, string>;

export function validateEmail(value: string): string | null {
  if (!value) return null;
  if (!value.includes('@') || !value.includes('.')) return 'Enter a valid email address.';
  return null;
}

export function validatePhone(value: string): string | null {
  if (!value) return null;
  const cleaned = value.replace(/\D/g, '');
  if (!/^(\+?234|0)?[0-9]{10}$/.test(value) && !/^0[0-9]{10}$/.test(value) && !/^\+234[0-9]{10}$/.test(value)) {
    return 'Enter a valid Nigerian phone number (e.g. 080 1234 5678).';
  }
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
