import {
  Badge,
  Button,
  Container,
  Group,
  ScrollArea,
  Stack,
  Table,
  Tabs,
  Text,
  Title,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useMediaQuery } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconCalendar,
  IconCheck,
  IconEdit,
  IconPlus,
  IconTable,
  IconX,
} from "@tabler/icons-react";
import { DateTime } from "luxon";
import { useMemo, useState } from "react";
import { ConfirmModal } from "../components/ConfirmModal";
import { AppointmentCreateModal } from "../components/appointment/AppointmentCreateModal";
import { AppointmentDetailModal } from "../components/appointment/AppointmentDetailModal";
import { AppointmentEditModal } from "../components/appointment/AppointmentEditModal";
import { AppointmentScheduleView } from "../components/appointment/AppointmentScheduleView";
import {
  useAppointments,
  useCancelAppointment,
  useCompleteAppointment,
} from "../hooks/useAppointments";
import type { Appointment } from "../types";
import { AppointmentStatus } from "../types";
import { formatDate, formatPrice } from "../utils/appointment.utils";

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

export function Appointments() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [activeTab, setActiveTab] = useState<string>("schedule");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Busca todos os agendamentos, não apenas do dia selecionado
  // O filtro por data é feito no componente AppointmentScheduleView
  const { data: appointments, isLoading } = useAppointments();
  const completeMutation = useCompleteAppointment();
  const cancelMutation = useCancelAppointment();

  // Filtra agendamentos pela data selecionada na aba de lista
  const filteredAppointments = useMemo(() => {
    if (!appointments || !selectedDate) return appointments || [];

    return appointments.filter((appointment) => {
      // Normaliza a data do agendamento usando Luxon no timezone America/Sao_Paulo
      const aptDate = DateTime.fromISO(appointment.date, {
        zone: "America/Sao_Paulo",
      });
      const aptDateString = aptDate.toFormat("yyyy-MM-dd");

      // Compara com a data selecionada
      return aptDateString === selectedDate;
    });
  }, [appointments, selectedDate]);

  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [completeModalOpened, setCompleteModalOpened] = useState(false);
  const [cancelModalOpened, setCancelModalOpened] = useState(false);
  const [detailModalOpened, setDetailModalOpened] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  const handleComplete = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setCompleteModalOpened(true);
  };

  const handleCancel = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setCancelModalOpened(true);
  };

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setEditModalOpened(true);
  };

  const confirmComplete = async () => {
    if (!selectedAppointment) return;

    try {
      await completeMutation.mutateAsync(selectedAppointment.id);
      notifications.show({
        title: "Sucesso",
        message: "Agendamento concluído com sucesso!",
        color: "green",
      });
      setCompleteModalOpened(false);
      setSelectedAppointment(null);
    } catch (error: unknown) {
      notifications.show({
        title: "Erro",
        message:
          error instanceof Error
            ? error.message
            : "Erro ao concluir agendamento",
        color: "red",
      });
    }
  };

  const confirmCancel = async () => {
    if (!selectedAppointment) return;

    try {
      await cancelMutation.mutateAsync(selectedAppointment.id);
      notifications.show({
        title: "Sucesso",
        message: "Agendamento cancelado com sucesso!",
        color: "green",
      });
    } catch {
      notifications.show({
        title: "Erro",
        message: "Erro ao cancelar agendamento",
        color: "red",
      });
    }
  };

  // Calcula o preço total de um agendamento
  const getTotalPrice = (appointment: Appointment): number => {
    return (
      appointment.scheduledServices?.reduce(
        (total, service) => total + service.price,
        0
      ) || 0
    );
  };

  return (
    <Container style={{ maxWidth: "95%" }} px={{ base: "xs", sm: "md" }}>
      <Group justify="space-between" mb="xl">
        <Group gap="md">
          <Title order={1} c="pink">
            Agendamentos
          </Title>
        </Group>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setCreateModalOpened(true)}
          color="pink"
        >
          Novo Agendamento
        </Button>
      </Group>

      {isLoading ? (
        <Text>Carregando...</Text>
      ) : (
        <Tabs
          value={activeTab}
          onChange={(value) => setActiveTab(value || "schedule")}
        >
          <Tabs.List>
            <Tabs.Tab value="schedule" leftSection={<IconCalendar size={16} />}>
              Agenda
            </Tabs.Tab>
            <Tabs.Tab value="table" leftSection={<IconTable size={16} />}>
              Lista
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="schedule" pt="md">
            <AppointmentScheduleView
              appointments={appointments || []}
              onComplete={handleComplete}
              onCancel={handleCancel}
              onEdit={handleEdit}
              currentDate={selectedDate}
              onDateChange={(date) => setSelectedDate(date)}
              onAppointmentClick={(appointment) => {
                setSelectedAppointment(appointment);
                setDetailModalOpened(true);
              }}
            />
          </Tabs.Panel>

          <Tabs.Panel value="table" pt="md">
            <Group mb="md">
              <DatePickerInput
                label="Filtrar por data"
                placeholder="Selecione uma data"
                value={
                  selectedDate
                    ? DateTime.fromISO(selectedDate, {
                        zone: "America/Sao_Paulo",
                      }).toJSDate()
                    : null
                }
                onChange={(value) => {
                  if (value) {
                    // Quando valueFormat está definido, o valor pode ser string ou Date
                    // Converte para string usando Luxon
                    let dateString: string;
                    if (typeof value === "string") {
                      // Se for string, converte de ISO para yyyy-MM-dd
                      dateString = DateTime.fromISO(value, {
                        zone: "America/Sao_Paulo",
                      }).toFormat("yyyy-MM-dd");
                    } else {
                      // Se for Date, converte para string
                      dateString = DateTime.fromJSDate(value, {
                        zone: "America/Sao_Paulo",
                      }).toFormat("yyyy-MM-dd");
                    }
                    setSelectedDate(dateString);
                  } else {
                    // Se limpar, volta para hoje
                    const today = DateTime.now()
                      .setZone("America/Sao_Paulo")
                      .toFormat("yyyy-MM-dd");
                    setSelectedDate(today);
                  }
                }}
                leftSection={<IconCalendar size={16} />}
                valueFormat="DD/MM/YYYY"
                clearable
                style={{ flex: 1, maxWidth: isMobile ? "100%" : 300 }}
              />
            </Group>
            <ScrollArea>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Data/Hora</Table.Th>
                    <Table.Th>Cliente</Table.Th>
                    <Table.Th>Telefone</Table.Th>
                    <Table.Th>Serviços</Table.Th>
                    <Table.Th>Preço Total</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Ações</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredAppointments?.map((appointment) => (
                    <Table.Tr key={appointment.id}>
                      <Table.Td>
                        <Stack gap={2}>
                          <Text size="sm" fw={500}>
                            {formatDate(appointment.date)}
                          </Text>
                          {appointment.startTime && appointment.endTime && (
                            <Text size="xs" c="pink" fw={500}>
                              {appointment.startTime} - {appointment.endTime}
                            </Text>
                          )}
                        </Stack>
                      </Table.Td>
                      <Table.Td>{appointment.clientName || "-"}</Table.Td>
                      <Table.Td>{appointment.clientPhone || "-"}</Table.Td>
                      <Table.Td>
                        {appointment.scheduledServices &&
                        appointment.scheduledServices.length > 0
                          ? `${appointment.scheduledServices.length} serviço(s)`
                          : "-"}
                      </Table.Td>
                      <Table.Td>
                        {formatPrice(getTotalPrice(appointment))}
                      </Table.Td>
                      <Table.Td>
                        <Badge color={statusColors[appointment.status]}>
                          {statusLabels[appointment.status]}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          {appointment.status ===
                            AppointmentStatus.SCHEDULED && (
                            <>
                              <Button
                                variant="light"
                                color="blue"
                                size="xs"
                                leftSection={<IconEdit size={14} />}
                                onClick={() => handleEdit(appointment)}
                              >
                                Editar
                              </Button>
                              <Button
                                variant="light"
                                color="green"
                                size="xs"
                                leftSection={<IconCheck size={14} />}
                                onClick={() => handleComplete(appointment)}
                              >
                                Concluir
                              </Button>
                              <Button
                                variant="light"
                                color="red"
                                size="xs"
                                leftSection={<IconX size={14} />}
                                onClick={() => handleCancel(appointment)}
                              >
                                Cancelar
                              </Button>
                            </>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Tabs.Panel>
        </Tabs>
      )}

      <AppointmentCreateModal
        opened={createModalOpened}
        onClose={() => setCreateModalOpened(false)}
      />

      <AppointmentDetailModal
        opened={detailModalOpened}
        onClose={() => {
          setDetailModalOpened(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onComplete={() => {
          setDetailModalOpened(false);
          if (selectedAppointment) handleComplete(selectedAppointment);
        }}
        onCancel={() => {
          setDetailModalOpened(false);
          if (selectedAppointment) handleCancel(selectedAppointment);
        }}
        onEdit={() => {
          setDetailModalOpened(false);
          if (selectedAppointment) handleEdit(selectedAppointment);
        }}
      />

      <AppointmentEditModal
        opened={editModalOpened}
        onClose={() => {
          setEditModalOpened(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
      />

      <ConfirmModal
        opened={completeModalOpened}
        onClose={() => {
          setCompleteModalOpened(false);
          setSelectedAppointment(null);
        }}
        onConfirm={confirmComplete}
        title="Concluir Agendamento"
        message={`Tem certeza que deseja concluir este agendamento? Todos os serviços devem estar concluídos.`}
        confirmLabel="Concluir"
        confirmColor="green"
        loading={completeMutation.isPending}
      />

      <ConfirmModal
        opened={cancelModalOpened}
        onClose={() => {
          setCancelModalOpened(false);
          setSelectedAppointment(null);
        }}
        onConfirm={confirmCancel}
        title="Cancelar Agendamento"
        message={`Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.`}
        confirmLabel="Cancelar"
        confirmColor="red"
        loading={cancelMutation.isPending}
      />
    </Container>
  );
}
