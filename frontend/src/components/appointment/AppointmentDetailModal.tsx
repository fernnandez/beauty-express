import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Modal,
  NumberInput,
  Paper,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconCalendar,
  IconCheck,
  IconCurrencyDollar,
  IconEdit,
  IconNotes,
  IconPhone,
  IconPlus,
  IconScissors,
  IconTrash,
  IconUser,
  IconUserCircle,
  IconX,
} from "@tabler/icons-react";
import { DateTime } from "luxon";
import { useState } from "react";
import { useAppointment } from "../../hooks/useAppointments";
import {
  useCancelScheduledService,
  useCreateScheduledService,
  useUpdateScheduledService,
} from "../../hooks/useScheduledServices";
import { useServices } from "../../hooks/useServices";
import { useCollaborators } from "../../hooks/useCollaborators";
import type {
  Appointment,
  CreateScheduledServiceDto,
  ScheduledService,
} from "../../types";
import { AppointmentStatus, ScheduledServiceStatus } from "../../types";
import {
  formatPrice,
  formatServiceOption,
} from "../../utils/appointment.utils";

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
  const [addServiceModalOpened, setAddServiceModalOpened] = useState(false);
  const [editServiceModalOpened, setEditServiceModalOpened] = useState(false);
  const [editingService, setEditingService] = useState<ScheduledService | null>(
    null
  );
  const [newService, setNewService] = useState<{
    serviceId: string;
    collaboratorId?: string;
    price?: number;
  }>({
    serviceId: "",
    collaboratorId: undefined,
    price: undefined,
  });
  const [editServiceData, setEditServiceData] = useState<{
    collaboratorId?: string;
    price?: number;
  }>({
    collaboratorId: undefined,
    price: undefined,
  });

  const { data: services } = useServices();
  const { data: collaborators } = useCollaborators();
  const activeCollaborators = collaborators?.filter((c) => c.isActive) || [];
  const createServiceMutation = useCreateScheduledService();
  const updateServiceMutation = useUpdateScheduledService();
  const cancelServiceMutation = useCancelScheduledService();

  // Busca os dados atualizados do agendamento quando o modal está aberto
  const { data: appointmentData } = useAppointment(
    appointmentProp?.id || "",
    opened && !!appointmentProp?.id
  );

  // Usa os dados atualizados se disponíveis, senão usa a prop
  const appointment = appointmentData || appointmentProp;

  if (!appointment) return null;

  const nonCancelledServices =
    appointment.scheduledServices?.filter(
      (s) => s.status !== "cancelado"
    ) || [];

  const canRemoveService = nonCancelledServices.length > 1;

  const handleAddService = async () => {
    if (!appointment || !newService.serviceId) return;

    try {
      const selectedService = services?.find(
        (s) => s.id === newService.serviceId
      );
      if (!selectedService) {
        notifications.show({
          title: "Erro",
          message: "Serviço não encontrado",
          color: "red",
        });
        return;
      }

      const data: CreateScheduledServiceDto = {
        serviceId: newService.serviceId,
        collaboratorId: newService.collaboratorId,
        price: newService.price ?? selectedService.defaultPrice,
      };

      await createServiceMutation.mutateAsync({
        appointmentId: appointment.id,
        data,
      });

      notifications.show({
        title: "Sucesso",
        message: "Serviço adicionado com sucesso!",
        color: "green",
      });

      setNewService({
        serviceId: "",
        collaboratorId: undefined,
        price: undefined,
      });
      setAddServiceModalOpened(false);
    } catch (error: unknown) {
      notifications.show({
        title: "Erro",
        message:
          error instanceof Error ? error.message : "Erro ao adicionar serviço",
        color: "red",
      });
    }
  };

  const handleEditService = (service: ScheduledService) => {
    setEditingService(service);
    setEditServiceData({
      collaboratorId: service.collaboratorId || undefined,
      price: service.price,
    });
    setEditServiceModalOpened(true);
  };

  const handleUpdateService = async () => {
    if (!editingService) return;

    try {
      await updateServiceMutation.mutateAsync({
        id: editingService.id,
        data: {
          collaboratorId: editServiceData.collaboratorId,
          price: editServiceData.price,
        },
      });

      notifications.show({
        title: "Sucesso",
        message: "Serviço atualizado com sucesso!",
        color: "green",
      });

      setEditServiceModalOpened(false);
      setEditingService(null);
      setEditServiceData({
        collaboratorId: undefined,
        price: undefined,
      });
    } catch (error: unknown) {
      notifications.show({
        title: "Erro",
        message:
          error instanceof Error ? error.message : "Erro ao atualizar serviço",
        color: "red",
      });
    }
  };

  const handleRemoveService = async (serviceId: string) => {
    if (!canRemoveService) {
      notifications.show({
        title: "Erro",
        message:
          "Não é possível remover o último serviço. O agendamento deve ter pelo menos um serviço.",
        color: "red",
      });
      return;
    }

    try {
      await cancelServiceMutation.mutateAsync(serviceId);
      notifications.show({
        title: "Sucesso",
        message: "Serviço removido com sucesso!",
        color: "green",
      });
    } catch (error: unknown) {
      notifications.show({
        title: "Erro",
        message:
          error instanceof Error ? error.message : "Erro ao remover serviço",
        color: "red",
      });
    }
  };

  const totalPrice =
    appointment.scheduledServices
      ?.filter((service) => service.status !== "cancelado")
      .reduce((total, service) => total + service.price, 0) || 0;

  return (
    <Modal
      centered
      opened={opened}
      onClose={onClose}
      title="Detalhes do Agendamento"
      size="lg"
      zIndex={200}
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
                return luxonDate
                  .setLocale("pt-BR")
                  .toFormat("cccc, d 'de' MMMM 'de' yyyy");
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
                  <Group gap="xs">
                    <Badge
                      color={serviceStatusColors[service.status]}
                      size="sm"
                    >
                      {serviceStatusLabels[service.status]}
                    </Badge>
                    {appointment.status === AppointmentStatus.SCHEDULED &&
                      service.status === ScheduledServiceStatus.PENDING && (
                        <>
                          <ActionIcon
                            color="blue"
                            variant="light"
                            size="sm"
                            onClick={() => handleEditService(service)}
                            title="Editar serviço"
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                          <ActionIcon
                            color="red"
                            variant="light"
                            size="sm"
                            onClick={() => handleRemoveService(service.id)}
                            disabled={!canRemoveService}
                            title={
                              canRemoveService
                                ? "Remover serviço"
                                : "Não é possível remover o último serviço"
                            }
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </>
                      )}
                  </Group>
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
              </Stack>
            </Card>
          ))}

          {appointment.status === AppointmentStatus.SCHEDULED && (
            <Button
              variant="light"
              leftSection={<IconPlus size={16} />}
              onClick={() => setAddServiceModalOpened(true)}
              fullWidth
            >
              Adicionar Serviço
            </Button>
          )}
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
              {onComplete && (
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
              )}
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

      {/* Modal para Adicionar Serviço */}
      <Modal
        opened={addServiceModalOpened}
        onClose={() => {
          setAddServiceModalOpened(false);
          setNewService({
            serviceId: "",
            collaboratorId: undefined,
            price: undefined,
          });
        }}
        title="Adicionar Serviço"
        size="md"
        zIndex={500}
      >
        <Stack gap="md">
          <Select
            label="Serviço"
            placeholder="Selecione o serviço"
            required
            leftSection={<IconScissors size={16} />}
            data={services?.map(formatServiceOption) || []}
            searchable
            comboboxProps={{ zIndex: 600 }}
            value={newService.serviceId}
            onChange={(value) =>
              setNewService({ ...newService, serviceId: value || "" })
            }
          />

          {newService.serviceId && (
            <>
              <Select
                label="Colaborador (Opcional)"
                placeholder="Selecione o colaborador"
                leftSection={<IconUser size={16} />}
                data={activeCollaborators.map((collaborator) => ({
                  value: collaborator.id,
                  label: collaborator.name,
                }))}
                searchable
                clearable
                comboboxProps={{ zIndex: 600 }}
                value={newService.collaboratorId || null}
                onChange={(value) =>
                  setNewService({
                    ...newService,
                    collaboratorId: value || undefined,
                  })
                }
              />
              <NumberInput
                label="Preço (Opcional)"
                placeholder={`Padrão: ${formatPrice(
                  services?.find((s) => s.id === newService.serviceId)
                    ?.defaultPrice || 0
                )}`}
                leftSection={<IconCurrencyDollar size={16} />}
                min={0.01}
                decimalScale={2}
                fixedDecimalScale
                value={
                  newService.price ??
                  services?.find((s) => s.id === newService.serviceId)
                    ?.defaultPrice
                }
                onChange={(value) =>
                  setNewService({
                    ...newService,
                    price: Number(value) || undefined,
                  })
                }
              />
            </>
          )}

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={() => {
                setAddServiceModalOpened(false);
                setNewService({
                  serviceId: "",
                  collaboratorId: undefined,
                  price: undefined,
                });
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddService}
              loading={createServiceMutation.isPending}
              disabled={!newService.serviceId}
            >
              Adicionar
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal para Editar Serviço */}
      <Modal
        opened={editServiceModalOpened}
        onClose={() => {
          setEditServiceModalOpened(false);
          setEditingService(null);
          setEditServiceData({
            collaboratorId: undefined,
            price: undefined,
          });
        }}
        title="Editar Serviço"
        size="md"
        zIndex={500}
      >
        {editingService && (
          <Stack gap="md">
            <Text size="sm" fw={500}>
              {editingService.service?.name || "-"}
            </Text>

            <Select
              label="Colaborador (Opcional)"
              placeholder="Selecione o colaborador"
              leftSection={<IconUser size={16} />}
              data={activeCollaborators.map((collaborator) => ({
                value: collaborator.id,
                label: collaborator.name,
              }))}
              searchable
              clearable
              comboboxProps={{ zIndex: 600 }}
              value={editServiceData.collaboratorId || null}
              onChange={(value) =>
                setEditServiceData({
                  ...editServiceData,
                  collaboratorId: value || undefined,
                })
              }
            />

            <NumberInput
              label="Preço"
              leftSection={<IconCurrencyDollar size={16} />}
              min={0.01}
              decimalScale={2}
              fixedDecimalScale
              value={editServiceData.price ?? editingService.price}
              onChange={(value) =>
                setEditServiceData({
                  ...editServiceData,
                  price: Number(value) || editingService.price,
                })
              }
            />

            <Group justify="flex-end" mt="md">
              <Button
                variant="subtle"
                onClick={() => {
                  setEditServiceModalOpened(false);
                  setEditingService(null);
                  setEditServiceData({
                    collaboratorId: undefined,
                    price: undefined,
                  });
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateService}
                loading={updateServiceMutation.isPending}
              >
                Salvar
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Modal>
  );
}
