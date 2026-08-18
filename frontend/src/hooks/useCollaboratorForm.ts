import { useForm } from "@mantine/form";
import type {
  CollaboratorCommissionRateInput,
  CreateCollaboratorDto,
  UpdateCollaboratorDto,
} from "../types";
import {
  validateCollaboratorArea,
  validateCollaboratorName,
  validateCollaboratorPhone,
  validateCommissionPercentage,
  validateCommissionRateName,
} from "../utils/collaborator.utils";

export interface CollaboratorFormValues {
  name: string;
  phone: string;
  area: string;
  isActive?: boolean;
  commissionRates: CollaboratorCommissionRateInput[];
}

const emptyRate = (): CollaboratorCommissionRateInput => ({
  name: "",
  percentage: 0,
});

export const useCollaboratorForm = (
  initialValues?: Partial<CollaboratorFormValues>,
  options?: { commissionsEnabled?: boolean },
) => {
  const commissionsEnabled = options?.commissionsEnabled !== false;

  const form = useForm<CollaboratorFormValues>({
    initialValues: {
      name: "",
      phone: "",
      area: "",
      commissionRates: [emptyRate()],
      ...initialValues,
    },
    validate: {
      name: validateCollaboratorName,
      phone: validateCollaboratorPhone,
      area: validateCollaboratorArea,
      ...(commissionsEnabled
        ? {
            commissionRates: {
              name: validateCommissionRateName,
              percentage: validateCommissionPercentage,
            },
          }
        : {}),
    },
  });

  const addCommissionRate = () => {
    form.insertListItem("commissionRates", emptyRate());
  };

  const removeCommissionRate = (index: number) => {
    if (form.values.commissionRates.length <= 1) {
      return;
    }
    form.removeListItem("commissionRates", index);
  };

  const toDto = (
    values: CollaboratorFormValues,
  ): CreateCollaboratorDto | UpdateCollaboratorDto => ({
    name: values.name,
    phone: values.phone,
    area: values.area,
    isActive: values.isActive,
    commissionRates: commissionsEnabled
      ? values.commissionRates.map((rate) => ({
          ...(rate.id ? { id: rate.id } : {}),
          name: rate.name.trim() || values.area,
          percentage: rate.percentage,
        }))
      : [],
  });

  const resetForm = () => {
    form.reset();
  };

  return {
    form,
    resetForm,
    addCommissionRate,
    removeCommissionRate,
    toDto,
  };
};
