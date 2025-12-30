import { useForm } from "@mantine/form";
import { useMemo } from "react";
import type { CreateAppointmentDto, UpdateAppointmentDto } from "../types";
import {
  calculateTotalPrice,
  convertServicesToDto,
  formatDateToString,
  validateTimeRange,
} from "../utils/appointment.utils";
import { useCollaborators } from "./useCollaborators";
import { useServices } from "./useServices";

export interface ServiceFormItem {
  serviceId: string;
  collaboratorId?: string;
  price?: number;
}

export interface AppointmentFormValues {
  clientName: string;
  clientPhone: string;
  data: Date | string | null; // DatePickerInput pode retornar string quando valueFormat está definido
  startTime: string;
  endTime: string;
  observacoes?: string;
  servicos: ServiceFormItem[];
}

export const useAppointmentForm = (
  initialValues?: Partial<AppointmentFormValues>
) => {
  const { data: services } = useServices();
  const { data: collaborators } = useCollaborators();

  const form = useForm<AppointmentFormValues>({
    initialValues: {
      clientName: "",
      clientPhone: "",
      data: null,
      startTime: "",
      endTime: "",
      observacoes: "",
      servicos: [],
      ...initialValues,
    },
    validate: {
      clientName: (value) =>
        !value || value.trim().length < 2
          ? "Nome do cliente é obrigatório"
          : null,
      clientPhone: (value) =>
        !value ? "Telefone do cliente é obrigatório" : null,
      data: (value) => (!value ? "Data é obrigatória" : null),
      startTime: (value) => (!value ? "Horário de início é obrigatório" : null),
      endTime: (value) => (!value ? "Horário de término é obrigatório" : null),
      servicos: {
        serviceId: (value) => (!value ? "Serviço é obrigatório" : null),
      },
    },
  });

  const addService = () => {
    form.insertListItem("servicos", {
      serviceId: "",
      collaboratorId: undefined,
      price: undefined,
    });
  };

  const removeService = (index: number) => {
    form.removeListItem("servicos", index);
  };

  const validateForm = (): { valid: boolean; error?: string } => {
    if (form.values.servicos.length === 0) {
      return {
        valid: false,
        error: "Adicione pelo menos um serviço",
      };
    }

    const timeValidation = validateTimeRange(
      form.values.startTime,
      form.values.endTime
    );
    if (!timeValidation.valid) {
      return timeValidation;
    }

    return { valid: true };
  };

  const convertToCreateDto = (): CreateAppointmentDto => {
    console.log(form.values.data);
    const dateString = formatDateToString(form.values.data);
    if (!dateString) {
      throw new Error("Data é obrigatória");
    }
    console.log(dateString);

    const servicos = convertServicesToDto(form.values.servicos, services);

    const dto: CreateAppointmentDto = {
      clientName: form.values.clientName.trim(),
      clientPhone: form.values.clientPhone.trim(),
      date: dateString,
      startTime: form.values.startTime,
      endTime: form.values.endTime,
      servicos,
    };

    // Inclui observacoes se houver valor (não vazio após trim)
    // Se o campo existir e não for vazio, inclui no DTO
    const observacoesTrimmed = form.values.observacoes?.trim();
    if (observacoesTrimmed && observacoesTrimmed.length > 0) {
      dto.observations = observacoesTrimmed;
    }

    return dto;
  };

  const convertToUpdateDto = (): UpdateAppointmentDto => {
    const dateString = formatDateToString(form.values.data);
    console.log(dateString);
    console.log(form.values.data);

    const servicos = convertServicesToDto(form.values.servicos, services);

    const dto: UpdateAppointmentDto = {
      clientName: form.values.clientName.trim(),
      clientPhone: form.values.clientPhone.trim(),
      date: dateString,
      startTime: form.values.startTime,
      endTime: form.values.endTime,
      services: servicos,
      observations: form.values.observacoes?.trim() || undefined,
    };

    return dto;
  };

  const totalPrice = useMemo(() => {
    return calculateTotalPrice(form.values.servicos, services);
  }, [form.values.servicos, services]);

  const activeCollaborators = useMemo(() => {
    return collaborators?.filter((c) => c.isActive) || [];
  }, [collaborators]);

  return {
    form,
    services,
    activeCollaborators,
    addService,
    removeService,
    validateForm,
    convertToCreateDto,
    convertToUpdateDto,
    totalPrice,
  };
};
