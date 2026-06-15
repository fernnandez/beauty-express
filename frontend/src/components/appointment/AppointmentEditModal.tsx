import {
  Button,
  Divider,
  Group,
  Modal,
  Select,
  Stack,
  TextInput,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import {
  IconCalendar,
  IconClock,
} from "@tabler/icons-react";
import { DateTime } from "luxon";
import { useEffect } from "react";
import { useUpdateAppointment } from "../../hooks/useAppointments";
import { useNotifications } from "../../hooks/useNotifications";
import type { Appointment, UpdateAppointmentDto } from "../../types";
import {
  TIME_OPTIONS,
  formatDateToString,
  validateTimeRange,
} from "../../utils/appointment.utils";
import {
  validateClientName,
  validateClientPhone,
} from "../../utils/phone.util";
import { ClientSelector } from "../client/ClientSelector";

interface AppointmentEditModalProps {
  opened: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}

export function AppointmentEditModal({
  opened,
  onClose,
  appointment,
}: AppointmentEditModalProps) {
  const updateMutation = useUpdateAppointment();
  const { showSuccess, showError } = useNotifications();
  const form = useForm({
    initialValues: {
      clientId: undefined as string | undefined,
      clientName: "",
      clientPhone: "",
      data: null as string | null,
      startTime: "",
      endTime: "",
      observacoes: "",
    },
    validate: {
      clientName: validateClientName,
      clientPhone: validateClientPhone,
      data: (value: string | null) => (!value ? "Data é obrigatória" : null),
      startTime: (value: string) =>
        !value ? "Horário de início é obrigatório" : null,
      endTime: (value: string) =>
        !value ? "Horário de término é obrigatório" : null,
    },
  });

  useEffect(() => {
    if (appointment && opened) {
      let appointmentDate: string | null = null;
      if (appointment.date) {
        const luxonDate = DateTime.fromISO(appointment.date, { zone: "local" });
        if (luxonDate.isValid) {
          appointmentDate = luxonDate.toFormat("yyyy-MM-dd");
        } else {
          const parsedDate = DateTime.fromFormat(
            appointment.date,
            "yyyy-MM-dd",
            { zone: "local" }
          );
          if (parsedDate.isValid) {
            appointmentDate = parsedDate.toFormat("yyyy-MM-dd");
          }
        }
      }

      form.setValues({
        clientId: appointment.clientId ?? undefined,
        clientName: appointment.clientName,
        clientPhone: appointment.clientPhone,
        data: appointmentDate,
        startTime: appointment.startTime || "",
        endTime: appointment.endTime || "",
        observacoes: appointment.observations || "",
      });
    } else {
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointment?.id, opened]);

  const handleSubmit = async () => {
    if (!appointment) return;

    try {
      // Validação de horário
      const timeValidation = validateTimeRange(
        form.values.startTime,
        form.values.endTime
      );
      if (!timeValidation.valid) {
        showError(timeValidation.error || "Erro de validação");
        return;
      }

      const dateString = formatDateToString(form.values.data);
      if (!dateString) {
        showError("Data é obrigatória");
        return;
      }

      const data: UpdateAppointmentDto = {
        clientName: form.values.clientName.trim(),
        clientPhone: form.values.clientPhone.trim(),
        clientId: form.values.clientId,
        date: dateString,
        startTime: form.values.startTime,
        endTime: form.values.endTime,
        observations: form.values.observacoes?.trim() || undefined,
      };

      await updateMutation.mutateAsync({
        id: appointment.id,
        data,
      });

      showSuccess("Agendamento atualizado com sucesso!");
      onClose();
    } catch (error: unknown) {
      showError(error, "Erro ao atualizar agendamento");
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!appointment) return null;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Editar Agendamento"
      size="xl"
      zIndex={300}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          {/* Cliente */}
          <Divider label="Cliente" labelPosition="center" />
          <ClientSelector
            values={{
              clientId: form.values.clientId,
              clientName: form.values.clientName,
              clientPhone: form.values.clientPhone,
            }}
            errors={{
              clientName: form.errors.clientName,
              clientPhone: form.errors.clientPhone,
            }}
            onChange={(values) => form.setValues(values)}
          />

          {/* Data e Hora */}
          <Divider label="Data e Hora" labelPosition="center" />
          <DatePickerInput
            label="Data do Agendamento"
            placeholder="Selecione a data"
            required
            leftSection={<IconCalendar size={16} />}
            valueFormat="DD/MM/YYYY"
            value={form.values.data}
            onChange={(value) => form.setFieldValue("data", value)}
            error={form.errors.data}
          />
          <Group grow>
            <Select
              label="Horário de Início"
              placeholder="Selecione o horário"
              required
              leftSection={<IconClock size={16} />}
              data={TIME_OPTIONS}
              searchable
              {...form.getInputProps("startTime")}
            />
            <Select
              label="Horário de Término"
              placeholder="Selecione o horário"
              required
              leftSection={<IconClock size={16} />}
              data={TIME_OPTIONS}
              searchable
              {...form.getInputProps("endTime")}
            />
          </Group>

          {/* Observações */}
          <TextInput
            label="Observações (Opcional)"
            placeholder="Observações sobre o agendamento"
            {...form.getInputProps("observacoes")}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={updateMutation.isPending}>
              Salvar Alterações
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
