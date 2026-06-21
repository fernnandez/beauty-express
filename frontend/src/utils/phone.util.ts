/** E.164: até 15 dígitos incluindo código do país. */
const INTERNATIONAL_MIN_DIGITS = 8;
const INTERNATIONAL_MAX_DIGITS = 15;

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function isValidBrazilianPhone(phone: string): boolean {
  const digits = normalizePhone(phone);

  if (digits.length !== 10 && digits.length !== 11) {
    return false;
  }

  const ddd = Number.parseInt(digits.slice(0, 2), 10);
  if (ddd < 11 || ddd > 99) {
    return false;
  }

  if (digits.length === 11 && digits[2] !== "9") {
    return false;
  }

  return true;
}

export function isBrazilianPhoneWithCountryCode(phone: string): boolean {
  const digits = normalizePhone(phone);
  if (!digits.startsWith("55")) {
    return false;
  }

  const local = digits.slice(2);
  if (local.length !== 10 && local.length !== 11) {
    return false;
  }

  return isValidBrazilianPhone(local);
}

export function isValidInternationalPhone(phone: string): boolean {
  const digits = normalizePhone(phone);

  if (
    digits.length < INTERNATIONAL_MIN_DIGITS ||
    digits.length > INTERNATIONAL_MAX_DIGITS
  ) {
    return false;
  }

  if (digits.startsWith("0")) {
    return false;
  }

  return true;
}

export function isValidPhone(phone: string): boolean {
  if (isValidBrazilianPhone(phone)) {
    return true;
  }

  if (isBrazilianPhoneWithCountryCode(phone)) {
    return true;
  }

  return isValidInternationalPhone(phone);
}

export function formatBrazilianPhone(phone: string): string {
  const digits = normalizePhone(phone);

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return phone.trim();
}

export function validateClientPhone(value: string): string | null {
  if (!value) {
    return "Telefone é obrigatório";
  }

  if (!isValidPhone(value)) {
    return "Telefone inválido. Use DDD + número (BR) ou internacional com + (ex: +351912345678)";
  }

  return null;
}

export function validateClientName(value: string): string | null {
  if (!value || value.trim().length < 2) {
    return "Nome deve ter pelo menos 2 caracteres";
  }

  return null;
}

export function formatPhoneInput(value: string): string {
  const trimmed = value.trim();

  if (trimmed.startsWith("+") || trimmed.startsWith("00")) {
    const digits = normalizePhone(trimmed).slice(0, INTERNATIONAL_MAX_DIGITS);
    return digits ? `+${digits}` : "+";
  }

  const digits = normalizePhone(value);

  if (digits.length > 11) {
    return `+${digits.slice(0, INTERNATIONAL_MAX_DIGITS)}`;
  }

  if (digits.length <= 2) {
    return digits.length ? `(${digits}` : "";
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
