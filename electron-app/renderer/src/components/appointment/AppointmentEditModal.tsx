import {
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import {
  IconCalendar,
  IconClock,
  IconPhone,
  IconPlus,
  IconUserCircle,
} from "@tabler/icons-react";
import { DateTime } from "luxon";
import { useEffect } from "react";
import { useAppointmentForm } from "../../hooks/useAppointmentForm";
import { useUpdateAppointment } from "../../hooks/useAppointments";
import type { Appointment } from "../../types";
import { ServiceFormItem } from "./ServiceFormItem";
import { TIME_OPTIONS, formatPrice } from "../../utils/appointment.utils";

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
  const {
    form,
    services,
    activeCollaborators,
    addService,
    removeService,
    validateForm,
    convertToUpdateDto,
    totalPrice,
  } = useAppointmentForm();

  useEffect(() => {
    if (appointment && opened) {
      const servicos =
        appointment.scheduledServices?.map((service) => ({
          serviceId: service.serviceId,
          collaboratorId: service.collaboratorId,
          price:
            service.price !== undefined && service.price !== null
              ? service.price
              : undefined,
        })) || [];

      // Converte a data para Date usando Luxon
      // Isso evita problemas de fuso horário
      // Quando vem do IPC, objetos Date são serializados como strings ISO
      let appointmentDate: Date | null = null;
      if (appointment.date) {
        try {
          // O IPC sempre serializa Date como string ISO, então appointment.date é sempre string
          const dateString = typeof appointment.date === 'string' 
            ? appointment.date 
            : String(appointment.date);
          
          // Garante que dateString é uma string válida antes de passar para Luxon
          if (dateString && dateString.length > 0) {
            // Tenta parsear como ISO primeiro (formato padrão do IPC)
            const luxonDate = DateTime.fromISO(dateString, { zone: 'local' });
            if (luxonDate.isValid) {
              appointmentDate = luxonDate.toJSDate();
            } else {
              // Fallback: tenta parsear como yyyy-MM-dd
              const parsedDate = DateTime.fromFormat(dateString, "yyyy-MM-dd", { zone: 'local' });
              if (parsedDate.isValid) {
                appointmentDate = parsedDate.toJSDate();
              } else {
                // Último fallback: tenta criar Date diretamente
                const directDate = new Date(dateString);
                if (!isNaN(directDate.getTime())) {
                  appointmentDate = directDate;
                }
              }
            }
          }
        } catch (error) {
          console.error('Erro ao converter data:', error, appointment.date, typeof appointment.date);
          // Fallback final: tenta criar Date diretamente
          try {
            const directDate = new Date(appointment.date);
            if (!isNaN(directDate.getTime())) {
              appointmentDate = directDate;
            }
          } catch (e) {
            console.error('Erro ao criar Date:', e);
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
        servicos,
      });
    } else {
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointment?.id, opened]);

  const handleSubmit = async () => {
    if (!appointment) return;

    try {
      const validation = validateForm();
      if (!validation.valid) {
        notifications.show({
          title: "Erro",
          message: validation.error || "Erro de validação",
          color: "red",
        });
        return;
      }

      const data = convertToUpdateDto();
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

          {/* Serviços */}
          <Divider
            label={`Serviços (${form.values.servicos.length})`}
            labelPosition="center"
          />
          <Stack gap="md">
            {form.values.servicos.map((servico, index) => (
              <ServiceFormItem
                key={index}
                index={index}
                serviceId={servico.serviceId}
                collaboratorId={servico.collaboratorId}
                price={servico.price}
                services={services}
                collaborators={activeCollaborators}
                canRemove={form.values.servicos.length > 1}
                onServiceChange={(idx, serviceId) =>
                  form.setFieldValue(`servicos.${idx}.serviceId`, serviceId)
                }
                onCollaboratorChange={(idx, collaboratorId) =>
                  form.setFieldValue(
                    `servicos.${idx}.collaboratorId`,
                    collaboratorId
                  )
                }
                onPriceChange={(idx, price) =>
                  form.setFieldValue(`servicos.${idx}.price`, price)
                }
                onRemove={removeService}
              />
            ))}

            <Button
              variant="light"
              leftSection={<IconPlus size={16} />}
              onClick={addService}
            >
              Adicionar Serviço
            </Button>
          </Stack>

          {/* Observações */}
          <TextInput
            label="Observações (Opcional)"
            placeholder="Observações sobre o agendamento"
            {...form.getInputProps("observacoes")}
          />

          {/* Resumo */}
          {form.values.servicos.length > 0 && (
            <Card withBorder padding="md" radius="md" bg="gray.0">
              <Stack gap="xs">
                <Text fw={500} size="sm">
                  Resumo
                </Text>
                <Group justify="space-between">
                  <Text size="sm">Total de Serviços:</Text>
                  <Badge>{form.values.servicos.length}</Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" fw={500}>
                    Preço Total:
                  </Text>
                  <Badge color="blue" size="lg">
                    {formatPrice(totalPrice)}
                  </Badge>
                </Group>
              </Stack>
            </Card>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={updateMutation.isPending}
              disabled={form.values.servicos.length === 0}
            >
              Salvar Alterações
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
