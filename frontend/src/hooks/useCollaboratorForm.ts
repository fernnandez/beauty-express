import { useForm } from "@mantine/form";
import type { CreateCollaboratorDto, UpdateCollaboratorDto } from "../types";
import {
  validateCollaboratorArea,
  validateCollaboratorName,
  validateCollaboratorPhone,
} from "../utils/collaborator.utils";

export const useCollaboratorForm = (
  initialValues?: Partial<CreateCollaboratorDto | UpdateCollaboratorDto>,
) => {
  const form = useForm<CreateCollaboratorDto | UpdateCollaboratorDto>({
    initialValues: {
      name: "",
      phone: "",
      area: "",
      ...initialValues,
    },
    validate: {
      name: validateCollaboratorName,
      phone: validateCollaboratorPhone,
      area: validateCollaboratorArea,
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
