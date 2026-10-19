import { useState } from "react";
import {
  Badge,
  Button,
  Center,
  Group,
  Loader,
  Modal,
  Paper,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import { IconCalendarEvent, IconBrandWhatsapp } from "@tabler/icons-react";
import { useAppointments } from "../../hooks/useAppointments";
import { useConfirmAppointment } from "../../hooks/useWhatsapp";
import { useNotifications } from "../../hooks/useNotifications";
import type { Appointment, Conversation } from "../../types";

interface TodayAppointmentsModalProps {
  opened: boolean;
  onClose: () => void;
  /** Chamado ao preparar a confirmação: abre o chat com o texto no rascunho. */
  onPrepared: (conversation: Conversation, text: string) => void;
}

function serviceNames(appointment: Appointment): string {
  const names = (appointment.scheduledServices ?? [])
    .map((s) => s.service?.name)
    .filter((n): n is string => !!n);
  return names.join(", ");
}

/** Modal com os agendamentos de hoje para preparar a confirmação por WhatsApp. */
export function TodayAppointmentsModal({
  opened,
  onClose,
  onPrepared,
}: TodayAppointmentsModalProps) {
  const { data: appointments = [], isLoading } = useAppointments();
  const confirm = useConfirmAppointment();
  const notify = useNotifications();
  const [sendingId, setSendingId] = useState<string | null>(null);

  const scheduled = appointments.filter((a) => a.status === "agendado");

  const handlePrepare = (appointment: Appointment) => {
    setSendingId(appointment.id);
    confirm.mutate(appointment.id, {
      onSuccess: ({ conversation, text }) => {
        onPrepared(conversation, text);
      },
      onError: (err) => notify.showError(err),
      onSettled: () => setSendingId(null),
    });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Agendamentos de hoje"
      radius="lg"
      size="lg"
      centered
    >
      {isLoading && (
        <Center p="xl">
          <Loader />
        </Center>
      )}

      {!isLoading && scheduled.length === 0 && (
        <Center p="xl">
          <Stack align="center" gap="xs">
            <IconCalendarEvent size={36} color="var(--mantine-color-gray-5)" />
            <Text c="dimmed">Nenhum agendamento para hoje.</Text>
          </Stack>
        </Center>
      )}

      <ScrollArea.Autosize mah={460}>
        <Stack gap="xs">
          {scheduled.map((appointment) => {
            const services = serviceNames(appointment);
            return (
              <Paper key={appointment.id} withBorder radius="md" p="sm">
                <Group justify="space-between" wrap="nowrap" align="flex-start">
                  <div style={{ minWidth: 0 }}>
                    <Group gap={6} wrap="nowrap">
                      <Badge variant="light" color="gray">
                        {appointment.startTime}
                      </Badge>
                      <Text fw={600} truncate>
                        {appointment.clientName}
                      </Text>
                    </Group>
                    {services && (
                      <Text size="sm" c="dimmed" truncate>
                        {services}
                      </Text>
                    )}
                  </div>
                  <Button
                    size="compact-sm"
                    radius="md"
                    color="teal"
                    variant="filled"
                    leftSection={<IconBrandWhatsapp size={16} />}
                    loading={sendingId === appointment.id}
                    onClick={() => handlePrepare(appointment)}
                  >
                    Confirmar
                  </Button>
                </Group>
              </Paper>
            );
          })}
        </Stack>
      </ScrollArea.Autosize>
    </Modal>
  );
}
