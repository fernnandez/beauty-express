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
import { notifications } from "@mantine/notifications";
import {
  IconCalendar,
  IconClock,
  IconPhone,
  IconUserCircle,
} from "@tabler/icons-react";
import { DateTime } from "luxon";
import { useEffect } from "react";
import { useForm } from "@mantine/form";
import { useUpdateAppointment } from "../../hooks/useAppointments";
import type { Appointment, UpdateAppointmentDto } from "../../types";
import { TIME_OPTIONS, formatDateToString, validateTimeRange } from "../../utils/appointment.utils";

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

  const form = useForm({
    initialValues: {
      clientName: "",
      clientPhone: "",
      data: null as Date | string | null,
      startTime: "",
      endTime: "",
      observacoes: "",
    },
    validate: {
      clientName: (value: string) =>
        !value || value.trim().length < 2
          ? "Nome do cliente é obrigatório"
          : null,
      clientPhone: (value: string) =>
        !value ? "Telefone do cliente é obrigatório" : null,
      data: (value: Date | string | null) => (!value ? "Data é obrigatória" : null),
      startTime: (value: string) => (!value ? "Horário de início é obrigatório" : null),
      endTime: (value: string) => (!value ? "Horário de término é obrigatório" : null),
    },
  });

  useEffect(() => {
    if (appointment && opened) {
      // Converte a string ISO da data para Date usando Luxon
      let appointmentDate: Date | string | null = null;
      if (appointment.date) {
        const luxonDate = DateTime.fromISO(appointment.date, { zone: "local" });
        if (luxonDate.isValid) {
          appointmentDate = luxonDate.toJSDate();
        } else {
          const parsedDate = DateTime.fromFormat(
            appointment.date,
            "yyyy-MM-dd",
            { zone: "local" }
          );
          if (parsedDate.isValid) {
            appointmentDate = parsedDate.toJSDate();
          }
        }
      }

      form.setValues({
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
        notifications.show({
          title: "Erro",
          message: timeValidation.error || "Erro de validação",
          color: "red",
        });
        return;
      }

      const dateString = formatDateToString(form.values.data);
      if (!dateString) {
        notifications.show({
          title: "Erro",
          message: "Data é obrigatória",
          color: "red",
        });
        return;
      }

      const data: UpdateAppointmentDto = {
        clientName: form.values.clientName.trim(),
        clientPhone: form.values.clientPhone.trim(),
        date: dateString,
        startTime: form.values.startTime,
        endTime: form.values.endTime,
        observations: form.values.observacoes?.trim() || undefined,
      };

      await updateMutation.mutateAsync({
        id: appointment.id,
        data,
      });

      notifications.show({
        title: "Sucesso",
        message: "Agendamento atualizado com sucesso!",
        color: "green",
      });
      onClose();
    } catch (error: unknown) {
      notifications.show({
        title: "Erro",
        message:
          error instanceof Error
            ? error.message
            : "Erro ao atualizar agendamento",
        color: "red",
      });
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
          <Group grow>
            <TextInput
              label="Nome do Cliente"
              placeholder="Nome completo"
              required
              leftSection={<IconUserCircle size={16} />}
              {...form.getInputProps("clientName")}
            />
            <TextInput
              label="Telefone do Cliente"
              placeholder="(11) 99999-9999"
              required
              leftSection={<IconPhone size={16} />}
              {...form.getInputProps("clientPhone")}
            />
          </Group>

          {/* Data e Hora */}
          <Divider label="Data e Hora" labelPosition="center" />
          <DatePickerInput
            label="Data do Agendamento"
            placeholder="Selecione a data"
            required
            leftSection={<IconCalendar size={16} />}
            valueFormat="DD/MM/YYYY"
            {...form.getInputProps("data")}
            minDate={new Date()}
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
            <Button
              type="submit"
              loading={updateMutation.isPending}
            >
              Salvar Alterações
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
