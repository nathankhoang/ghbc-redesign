// Shared client/server validation for auth + signup forms.

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

/** Strip a US phone number down to its 10 digits (tolerates +1 prefix). */
export function usPhoneDigits(input: string): string {
  const digits = input.replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
}

export function isValidUSPhone(input: string): boolean {
  return usPhoneDigits(input).length === 10;
}

/** Live-format a US phone number as (XXX) XXX-XXXX while typing. */
export function formatUSPhone(input: string): string {
  const d = usPhoneDigits(input).slice(0, 10);
  if (d.length === 0) return "";
  if (d.length < 4) return `(${d}`;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
