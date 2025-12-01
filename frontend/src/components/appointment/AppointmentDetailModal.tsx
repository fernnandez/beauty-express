import {
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconCalendar,
  IconCheck,
  IconCurrencyDollar,
  IconEdit,
  IconNotes,
  IconPhone,
  IconScissors,
  IconUser,
  IconUserCircle,
  IconX,
} from "@tabler/icons-react";
import { DateTime } from "luxon";
import { useAppointment } from "../../hooks/useAppointments";
import {
  useCancelScheduledService,
  useCompleteScheduledService,
} from "../../hooks/useScheduledServices";
import { formatPrice } from "../../utils/appointment.utils";
import type { Appointment, ScheduledService } from "../../types";
import { AppointmentStatus, ScheduledServiceStatus } from "../../types";

interface AppointmentDetailModalProps {
  opened: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onComplete?: () => void;
  onCancel?: () => void;
  onEdit?: () => void;
}

const statusColors: Record<AppointmentStatus, string> = {
  agendado: "blue",
  concluido: "green",
  cancelado: "red",
};

const statusLabels: Record<AppointmentStatus, string> = {
  agendado: "Agendado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

const serviceStatusColors: Record<ScheduledServiceStatus, string> = {
  pendente: "gray",
  iniciado: "yellow",
  concluido: "green",
  cancelado: "red",
};

const serviceStatusLabels: Record<ScheduledServiceStatus, string> = {
  pendente: "Pendente",
  iniciado: "Iniciado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export function AppointmentDetailModal({
  opened,
  onClose,
  appointment: appointmentProp,
  onComplete,
  onCancel,
  onEdit,
}: AppointmentDetailModalProps) {
  const completeServiceMutation = useCompleteScheduledService();
  const cancelServiceMutation = useCancelScheduledService();

  // Busca os dados atualizados do agendamento quando o modal está aberto
  const { data: appointmentData } = useAppointment(
    appointmentProp?.id || "",
    opened && !!appointmentProp?.id
  );

  // Usa os dados atualizados se disponíveis, senão usa a prop
  const appointment = appointmentData || appointmentProp;

  if (!appointment) return null;

  const handleCompleteService = async (serviceId: string) => {
    try {
      await completeServiceMutation.mutateAsync(serviceId);
      notifications.show({
        title: "Sucesso",
        message: "Serviço concluído com sucesso!",
        color: "green",
      });
    } catch {
      notifications.show({
        title: "Erro",
        message: "Erro ao concluir serviço",
        color: "red",
      });
    }
  };

  const handleCancelService = async (serviceId: string) => {
    try {
      await cancelServiceMutation.mutateAsync(serviceId);
      notifications.show({
        title: "Sucesso",
        message: "Serviço cancelado com sucesso!",
        color: "green",
      });
    } catch {
      notifications.show({
        title: "Erro",
        message: "Erro ao cancelar serviço",
        color: "red",
      });
    }
  };

  const totalPrice =
    appointment.scheduledServices?.reduce(
      (total, service) => total + service.price,
      0
    ) || 0;

  const allServicesCompleted =
    appointment.scheduledServices?.every(
      (s) =>
        s.status === ScheduledServiceStatus.COMPLETED ||
        s.status === ScheduledServiceStatus.CANCELLED
    ) || false;

  return (
    <Modal
      centered
      opened={opened}
      onClose={onClose}
      title="Detalhes do Agendamento"
      size="lg"
    >
      <Stack gap="md">
        <Group justify="space-between">
          <Badge color={statusColors[appointment.status]} size="lg">
            {statusLabels[appointment.status]}
          </Badge>
        </Group>

        <Divider />

        {/* Dados do Cliente */}
        <Group gap="xs">
          <IconUserCircle size={18} />
          <div>
            <Text size="xs" c="dimmed">
              Cliente
            </Text>
            <Text size="sm" fw={500}>
              {appointment.clientName || "-"}
            </Text>
          </div>
        </Group>

        <Group gap="xs">
          <IconPhone size={18} />
          <div>
            <Text size="xs" c="dimmed">
              Telefone
            </Text>
            <Text size="sm" fw={500}>
              {appointment.clientPhone || "-"}
            </Text>
          </div>
        </Group>

        {/* Data e Hora */}
        <Group gap="xs">
          <IconCalendar size={18} />
          <div>
            <Text size="xs" c="dimmed">
              Data e Hora
            </Text>
            <Text size="sm" fw={500}>
              {(() => {
                // Formata a data usando Luxon no timezone America/Sao_Paulo
                const luxonDate = DateTime.fromISO(appointment.date, {
                  zone: "America/Sao_Paulo",
                });
                // Formata em português brasileiro: "Segunda-feira, 28 de dezembro de 2024"
                return luxonDate.setLocale("pt-BR").toFormat("cccc, d 'de' MMMM 'de' yyyy");
              })()}
            </Text>
            {appointment.startTime && appointment.endTime && (
              <Text size="sm" fw={500} c="pink" mt={4}>
                {appointment.startTime} - {appointment.endTime}
              </Text>
            )}
          </div>
        </Group>

        {/* Observações */}
        {appointment.observations && (
          <Group gap="xs" align="flex-start">
            <IconNotes size={18} style={{ marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <Text size="xs" c="dimmed">
                Observações
              </Text>
              <Text size="sm" fw={500} style={{ whiteSpace: "pre-wrap" }}>
                {appointment.observations}
              </Text>
            </div>
          </Group>
        )}

        <Divider label="Serviços Agendados" labelPosition="center" />

        {/* Lista de Serviços Agendados */}
        <Stack gap="sm">
          {appointment.scheduledServices?.map((service: ScheduledService) => (
            <Card key={service.id} withBorder padding="md" radius="md">
              <Stack gap="sm">
                <Group justify="space-between">
                  <Group gap="xs">
                    <IconScissors size={18} />
                    <div>
                      <Text size="sm" fw={500}>
                        {service.service?.name || "-"}
                      </Text>
                      {service.service?.description && (
                        <Text size="xs" c="dimmed">
                          {service.service.description}
                        </Text>
                      )}
                    </div>
                  </Group>
                  <Badge color={serviceStatusColors[service.status]} size="sm">
                    {serviceStatusLabels[service.status]}
                  </Badge>
                </Group>

                <Group gap="md">
                  <Group gap={4}>
                    <IconCurrencyDollar size={14} />
                    <Text size="xs" fw={500}>
                      {formatPrice(service.price)}
                    </Text>
                  </Group>
                </Group>

                {service.collaborator && (
                  <Group gap="xs">
                    <IconUser size={14} />
                    <Text size="xs" c="dimmed">
                      Colaborador: {service.collaborator.name}
                    </Text>
                  </Group>
                )}

                {/* Ações do Serviço */}

                <Group gap="xs" mt="xs">
                  {service.status === ScheduledServiceStatus.PENDING && (
                    <>
                      {!service.collaboratorId ? (
                        <Tooltip
                          label="Para concluir um serviço, é preciso indicar um colaborador"
                          withArrow
                        >
                          <div>
                            <Button
                              disabled
                              size="xs"
                              variant="light"
                              color="green"
                              leftSection={<IconCheck size={14} />}
                            >
                              Concluir
                            </Button>
                          </div>
                        </Tooltip>
                      ) : (
                        <Button
                          disabled={!service.collaboratorId}
                          size="xs"
                          variant="light"
                          color="green"
                          leftSection={<IconCheck size={14} />}
                          onClick={() => handleCompleteService(service.id)}
                          loading={completeServiceMutation.isPending}
                        >
                          Concluir
                        </Button>
                      )}
                    </>
                  )}
                  {service.status !== ScheduledServiceStatus.COMPLETED &&
                    service.status !== ScheduledServiceStatus.CANCELLED && (
                      <Button
                        size="xs"
                        variant="light"
                        color="red"
                        leftSection={<IconX size={14} />}
                        onClick={() => handleCancelService(service.id)}
                        loading={cancelServiceMutation.isPending}
                      >
                        Cancelar
                      </Button>
                    )}
                </Group>
              </Stack>
            </Card>
          ))}
        </Stack>

        {/* Preço Total */}
        {appointment.scheduledServices &&
          appointment.scheduledServices.length > 0 && (
            <Paper withBorder p="md" radius="md" bg="gray.0">
              <Group justify="space-between">
                <Text size="sm" fw={500}>
                  Preço Total:
                </Text>
                <Badge color="blue" size="lg">
                  {formatPrice(totalPrice)}
                </Badge>
              </Group>
            </Paper>
          )}

        {/* Ações do Agendamento */}
        {appointment.status === AppointmentStatus.SCHEDULED && (
          <>
            <Divider />
            <Group>
              {onEdit && (
                <Button
                  variant="light"
                  color="blue"
                  leftSection={<IconEdit size={16} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  Editar
                </Button>
              )}
              {onComplete &&
                (allServicesCompleted ? (
                  <Button
                    variant="light"
                    color="green"
                    leftSection={<IconCheck size={16} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onComplete();
                    }}
                  >
                    Concluir Agendamento
                  </Button>
                ) : (
                  <Tooltip
                    label="Todos os serviços devem estar concluídos para finalizar o agendamento"
                    withArrow
                  >
                    <Button
                      variant="light"
                      color="green"
                      disabled
                      leftSection={<IconCheck size={16} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Não chama onComplete se desabilitado
                      }}
                    >
                      Concluir Agendamento
                    </Button>
                  </Tooltip>
                ))}
              {onCancel && (
                <Button
                  variant="light"
                  color="red"
                  leftSection={<IconX size={16} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancel();
                  }}
                >
                  Cancelar Agendamento
                </Button>
              )}
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  );
}
