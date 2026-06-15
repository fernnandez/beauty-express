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

  if (!isValidBrazilianPhone(value)) {
    return "Telefone inválido. Use DDD + número (10 ou 11 dígitos)";
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
  const digits = normalizePhone(value).slice(0, 11);

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
