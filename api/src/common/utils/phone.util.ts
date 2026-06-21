/** E.164: até 15 dígitos incluindo código do país. */
const INTERNATIONAL_MIN_DIGITS = 8;
const INTERNATIONAL_MAX_DIGITS = 15;

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
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

  if (digits.length === 11 && digits[2] !== '9') {
    return false;
  }

  return true;
}

export function isBrazilianPhoneWithCountryCode(phone: string): boolean {
  const digits = normalizePhone(phone);
  if (!digits.startsWith('55')) {
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

  if (digits.startsWith('0')) {
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

export function formatInternationalPhone(phone: string): string {
  const digits = normalizePhone(phone);
  return `+${digits}`;
}

export function preparePhoneForStorage(phone: string): {
  phone: string;
  phoneNormalized: string;
} {
  const digits = normalizePhone(phone);

  if (isValidBrazilianPhone(phone)) {
    return {
      phone: formatBrazilianPhone(digits),
      phoneNormalized: digits,
    };
  }

  if (isBrazilianPhoneWithCountryCode(phone)) {
    const local = digits.slice(2);
    return {
      phone: `+55 ${formatBrazilianPhone(local)}`,
      phoneNormalized: digits,
    };
  }

  return {
    phone: formatInternationalPhone(phone),
    phoneNormalized: digits,
  };
}
