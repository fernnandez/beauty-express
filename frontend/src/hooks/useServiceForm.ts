import { useForm } from "@mantine/form";
import type { CreateServiceDto, UpdateServiceDto } from "../types";
import { validateCommissionPercentage } from "../utils/collaborator.utils";

export const useServiceForm = (
  initialValues?: Partial<CreateServiceDto | UpdateServiceDto>,
  options?: { commissionsEnabled?: boolean },
) => {
  const commissionsEnabled = options?.commissionsEnabled !== false;

  const form = useForm<CreateServiceDto | UpdateServiceDto>({
    initialValues: {
      name: "",
      defaultPrice: 0,
      commissionPercentage: 0,
      description: "",
      ...initialValues,
    },
    validate: {
      name: (value: string | undefined) =>
        value && value.trim().length < 2
          ? "Nome deve ter pelo menos 2 caracteres"
          : null,
      defaultPrice: (value: number | undefined) =>
        value !== undefined && value <= 0
          ? "Preço deve ser maior que zero"
          : null,
      ...(commissionsEnabled
        ? { commissionPercentage: validateCommissionPercentage }
        : {}),
    },
  });

  const resetForm = () => {
    form.reset();
  };

  return {
    form,
    resetForm,
  };
};
