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

export function preparePhoneForStorage(phone: string): {
  phone: string;
  phoneNormalized: string;
} {
  const phoneNormalized = normalizePhone(phone);
  return {
    phone: formatBrazilianPhone(phoneNormalized),
    phoneNormalized,
  };
}
