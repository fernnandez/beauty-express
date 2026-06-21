import { useForm } from "@mantine/form";
import type { CreateCollaboratorDto, UpdateCollaboratorDto } from "../types";
import {
  validateCollaboratorArea,
  validateCollaboratorName,
  validateCollaboratorPhone,
  validateCommissionPercentage,
} from "../utils/collaborator.utils";

export const useCollaboratorForm = (
  initialValues?: Partial<CreateCollaboratorDto | UpdateCollaboratorDto>,
  options?: { commissionsEnabled?: boolean },
) => {
  const commissionsEnabled = options?.commissionsEnabled !== false;

  const form = useForm<CreateCollaboratorDto | UpdateCollaboratorDto>({
    initialValues: {
      name: "",
      phone: "",
      area: "",
      commissionPercentage: 0,
      ...initialValues,
    },
    validate: {
      name: validateCollaboratorName,
      phone: validateCollaboratorPhone,
      area: validateCollaboratorArea,
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

