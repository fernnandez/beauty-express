import { Button, Container, Group, Tabs, Text, Title } from "@mantine/core";
import { useNotifications } from "../hooks/useNotifications";

import { IconCalendar, IconPlus, IconTable } from "@tabler/icons-react";
import { useState } from "react";
import { ConfirmModal } from "../components/ConfirmModal";
import { AppointmentCreateModal } from "../components/appointment/AppointmentCreateModal";
import { AppointmentDetailModal } from "../components/appointment/AppointmentDetailModal";
import { AppointmentEditModal } from "../components/appointment/AppointmentEditModal";
import { AppointmentListView } from "../components/appointment/AppointmentListView";
import { AppointmentScheduleView } from "../components/appointment/AppointmentScheduleView";
import {
  useAppointments,
  useCancelAppointment,
  useCompleteAppointment,
} from "../hooks/useAppointments";
import { appointmentService } from "../services/appointment.service";
import type { Appointment } from "../types";

export function Appointments() {
  const { showSuccess, showError } = useNotifications();
  const [activeTab, setActiveTab] = useState<string>("schedule");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const { data: appointments, isLoading } = useAppointments(selectedDate);
  const completeMutation = useCompleteAppointment();
  const cancelMutation = useCancelAppointment();

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

    // Busca os dados atualizados do agendamento antes de validar
    const updatedAppointment = await appointmentService.findById(
      selectedAppointment.id
    );

    if (!updatedAppointment) {
      showError("Agendamento não encontrado");
      setCompleteModalOpened(false);
      setDetailModalOpened(true);
      return;
    }

    // Atualiza o selectedAppointment com os dados atualizados
    setSelectedAppointment(updatedAppointment);

    // Validação: verificar se todos os serviços não cancelados têm colaborador
    const nonCancelledServices =
      updatedAppointment.scheduledServices?.filter(
        (s) => s.status !== "cancelado"
      ) || [];

    if (nonCancelledServices.length === 0) {
      showError("O agendamento deve ter pelo menos um serviço não cancelado");
      setCompleteModalOpened(false);
      // Reabre o modal de detalhes mesmo em caso de erro
      setDetailModalOpened(true);
      return;
    }

    const servicesWithoutCollaborator = nonCancelledServices.filter(
      (s) => !s.collaboratorId
    );

    if (servicesWithoutCollaborator.length > 0) {
      showError(
        `Os seguintes serviços não têm colaborador associado: ${servicesWithoutCollaborator
          .map((s) => s.service?.name || "Serviço")
          .join(", ")}`
      );
      setCompleteModalOpened(false);
      // Reabre o modal de detalhes mesmo em caso de erro
      setDetailModalOpened(true);
      return;
    }

    try {
      await completeMutation.mutateAsync(selectedAppointment.id);
      showSuccess("Agendamento concluído com sucesso!");
      setCompleteModalOpened(false);
      // Reabre o modal de detalhes após a conclusão
      setDetailModalOpened(true);
    } catch {
      showError("Erro ao concluir agendamento");
      // Reabre o modal de detalhes mesmo em caso de erro
      setDetailModalOpened(true);
    }
  };

  const confirmCancel = async () => {
    if (!selectedAppointment) return;

    try {
      await cancelMutation.mutateAsync(selectedAppointment.id);
      showSuccess("Agendamento cancelado com sucesso!");
      setCancelModalOpened(false);
      // Reabre o modal de detalhes após o cancelamento
      setDetailModalOpened(true);
    } catch {
      showError("Erro ao cancelar agendamento");
      // Reabre o modal de detalhes mesmo em caso de erro
      setDetailModalOpened(true);
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
              onDateChange={(date) => {
                setSelectedDate(date);
              }}
              onAppointmentClick={(appointment) => {
                setSelectedAppointment(appointment);
                setDetailModalOpened(true);
              }}
            />
          </Tabs.Panel>

          <Tabs.Panel value="table" pt="md">
            <AppointmentListView
              appointments={appointments || []}
              onComplete={handleComplete}
              onCancel={handleCancel}
              onEdit={handleEdit}
              currentDate={selectedDate}
              onDateChange={(date) => {
                setSelectedDate(date);
              }}
              onAppointmentClick={(appointment) => {
                setSelectedAppointment(appointment);
                setDetailModalOpened(true);
              }}
              getTotalPrice={getTotalPrice}
            />
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
          // Fecha o modal de detalhes e abre o modal de confirmação
          setDetailModalOpened(false);
          if (selectedAppointment) handleComplete(selectedAppointment);
        }}
        onCancel={() => {
          // Fecha o modal de detalhes e abre o modal de confirmação
          setDetailModalOpened(false);
          if (selectedAppointment) handleCancel(selectedAppointment);
        }}
        onEdit={() => {
          // Não fecha o modal de detalhes, apenas abre o modal de edição
          if (selectedAppointment) handleEdit(selectedAppointment);
        }}
      />

      <AppointmentEditModal
        opened={editModalOpened}
        onClose={() => {
          setEditModalOpened(false);
          // Não reseta o selectedAppointment para manter o modal de detalhes aberto
          // O appointment será atualizado automaticamente via query invalidation
        }}
        appointment={selectedAppointment}
      />

      <ConfirmModal
        opened={completeModalOpened}
        onClose={() => {
          setCompleteModalOpened(false);
          // Reabre o modal de detalhes ao cancelar a confirmação
          if (selectedAppointment) {
            setDetailModalOpened(true);
          }
        }}
        onConfirm={confirmComplete}
        title="Concluir Agendamento"
        message={`Tem certeza que deseja concluir este agendamento? Todos os serviços pendentes serão concluídos automaticamente.`}
        confirmLabel="Concluir"
        confirmColor="green"
        loading={completeMutation.isPending}
      />

      <ConfirmModal
        opened={cancelModalOpened}
        onClose={() => {
          setCancelModalOpened(false);
          // Reabre o modal de detalhes ao cancelar a confirmação
          if (selectedAppointment) {
            setDetailModalOpened(true);
          }
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
