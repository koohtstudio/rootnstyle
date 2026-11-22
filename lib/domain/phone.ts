/** Keep digits only. A leading country code 1 is dropped when there are 11 digits. */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
}

/** A valid North American number: 10 digits, area code and exchange start with 2 to 9. */
export function isValidPhone(input: string): boolean {
  const d = normalizePhone(input);
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(d);
}

/** "9057943373" -> "(905) 794-3373". Falls back to the input if it is not 10 digits. */
export function formatPhone(input: string): string {
  const d = normalizePhone(input);
  if (d.length !== 10) return input;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/** tel: href for a display number. */
export const telHref = (input: string): string => `tel:+1${normalizePhone(input)}`;
