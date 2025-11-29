// Opções de área de atuação para colaboradores
export const COLLABORATOR_AREAS = [
  { value: "Hairdresser", label: "Cabeleleiro" },
  { value: "Nail Designer", label: "Nail Designer" },
  { value: "Esthetician", label: "Esteticista" },
  { value: "Makeup Artist", label: "Maquiador" },
  { value: "Massage Therapist", label: "Massagista" },
  { value: "Barber", label: "Barbeiro" },
  { value: "Other", label: "Outro" },
] as const;

// Validações para colaborador
export const validateCollaboratorName = (value: string): string | null => {
  if (!value || value.trim().length < 2) {
    return "Nome deve ter pelo menos 2 caracteres";
  }
  return null;
};

export const validateCollaboratorPhone = (value: string): string | null => {
  if (!value) {
    return "Telefone é obrigatório";
  }
  return null;
};

export const validateCollaboratorArea = (value: string): string | null => {
  if (!value) {
    return "Área de atuação é obrigatória";
  }
  return null;
};

export const validateCommissionPercentage = (
  value: number
): string | null => {
  if (value < 0 || value > 100) {
    return "Percentual deve estar entre 0 e 100";
  }
  return null;
};

