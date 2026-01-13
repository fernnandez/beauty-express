import {
  Badge,
  Button,
  Divider,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import {
  IconCalendar,
  IconClock,
  IconPhone,
  IconPlus,
  IconUserCircle,
} from "@tabler/icons-react";
import { useAppointmentForm } from "../../hooks/useAppointmentForm";
import { useCreateAppointment } from "../../hooks/useAppointments";
import { useNotifications } from "../../hooks/useNotifications";
import { TIME_OPTIONS, formatPrice } from "../../utils/appointment.utils";
import { ServiceFormItem } from "./ServiceFormItem";

interface AppointmentCreateModalProps {
  opened: boolean;
  onClose: () => void;
}

export function AppointmentCreateModal({
  opened,
  onClose,
}: AppointmentCreateModalProps) {
  const createMutation = useCreateAppointment();
  const { showSuccess, showError } = useNotifications();
  const {
    form,
    services,
    activeCollaborators,
    addService,
    removeService,
    validateForm,
    convertToCreateDto,
    totalPrice,
  } = useAppointmentForm();

  const handleSubmit = async () => {
    try {
      const validation = validateForm();
      if (!validation.valid) {
        showError(validation.error || "Erro de validação");
        return;
      }

      const data = convertToCreateDto();
      await createMutation.mutateAsync(data);

      showSuccess("Agendamento criado com sucesso!");
      form.reset();
      onClose();
    } catch (error: unknown) {
      showError(error, "Erro ao criar agendamento");
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Novo Agendamento"
      size="xl"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          {/* Seção: Cliente */}
          <Divider label="Cliente" labelPosition="center" />
          <Group grow>
            <TextInput
              label="Nome do Cliente"
              placeholder="Nome completo do cliente"
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

          {/* Seção: Data e Hora */}
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

          {/* Seção: Serviços */}
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
            <Paper withBorder p="md" radius="md" bg="gray.0">
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
            </Paper>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending}
              disabled={form.values.servicos.length === 0}
            >
              Criar Agendamento
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
