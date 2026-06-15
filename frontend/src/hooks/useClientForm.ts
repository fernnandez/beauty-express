import { useForm } from "@mantine/form";
import type { CreateClientDto, UpdateClientDto } from "../types";
import { validateClientName, validateClientPhone } from "../utils/phone.util";

export const useClientForm = (
  initialValues?: Partial<CreateClientDto | UpdateClientDto>
) => {
  const form = useForm<CreateClientDto | UpdateClientDto>({
    initialValues: {
      name: "",
      phone: "",
      ...initialValues,
    },
    validate: {
      name: validateClientName,
      phone: validateClientPhone,
    },
  });

  return {
    form,
    resetForm: () => form.reset(),
  };
};
