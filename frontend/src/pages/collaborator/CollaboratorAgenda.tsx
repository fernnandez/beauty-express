import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Loader,
  Stack,
  Text,
} from "@mantine/core";
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { DateTime } from "luxon";
import { useMemo, useState } from "react";
import {
  useAppointments,
  useCompleteAppointment,
} from "../../hooks/useAppointments";
import { useNotifications } from "../../hooks/useNotifications";
import { AppointmentStatus, type Appointment } from "../../types";
import { formatPrice } from "../../utils/money.util";

const ZONE = "America/Sao_Paulo";

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

export function CollaboratorAgenda() {
  const [date, setDate] = useState<string>(() =>
    DateTime.now().setZone(ZONE).toFormat("yyyy-MM-dd"),
  );
  const { data: appointments, isLoading } = useAppointments(date);
  const completeMutation = useCompleteAppointment();
  const { showSuccess, showError } = useNotifications();

  const label = useMemo(() => {
    const dt = DateTime.fromISO(date, { zone: ZONE }).setLocale("pt-BR");
    const today = DateTime.now().setZone(ZONE).toFormat("yyyy-MM-dd");
    const prefix =
      date === today
        ? "Hoje, "
        : "";
    return prefix + dt.toFormat("cccc, dd 'de' LLLL");
  }, [date]);

  const shiftDay = (delta: number) => {
    setDate((d) =>
      DateTime.fromISO(d, { zone: ZONE }).plus({ days: delta }).toFormat(
        "yyyy-MM-dd",
      ),
    );
  };

  const handleComplete = async (appointment: Appointment) => {
    try {
      await completeMutation.mutateAsync(appointment.id);
      showSuccess("Atendimento concluído!");
    } catch (error) {
      showError(error, "Erro ao concluir atendimento");
    }
  };

  const sorted = useMemo(
    () =>
      [...(appointments ?? [])].sort((a, b) =>
        (a.startTime ?? "").localeCompare(b.startTime ?? ""),
      ),
    [appointments],
  );

  return (
    <Stack gap="md" pb={80}>
      <Card withBorder radius="md" padding="sm">
        <Group justify="space-between" wrap="nowrap">
          <ActionIcon
            variant="subtle"
            onClick={() => shiftDay(-1)}
            aria-label="Dia anterior"
          >
            <IconChevronLeft size={18} />
          </ActionIcon>
          <Text fw={600} tt="capitalize" ta="center" size="sm">
            {label}
          </Text>
          <ActionIcon
            variant="subtle"
            onClick={() => shiftDay(1)}
            aria-label="Próximo dia"
          >
            <IconChevronRight size={18} />
          </ActionIcon>
        </Group>
      </Card>

      {isLoading ? (
        <Group justify="center" py="xl">
          <Loader color="brand" />
        </Group>
      ) : sorted.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          Nenhum atendimento para este dia.
        </Text>
      ) : (
        sorted.map((appointment) => {
          const canComplete =
            appointment.status === AppointmentStatus.SCHEDULED;
          return (
            <Card key={appointment.id} withBorder radius="md" padding="md">
              <Stack gap="xs">
                <Group justify="space-between" wrap="nowrap">
                  <Group gap={6} wrap="nowrap">
                    {appointment.startTime && (
                      <Text fw={700} size="lg">
                        {appointment.startTime}
                      </Text>
                    )}
                    <Badge color={statusColors[appointment.status]}>
                      {statusLabels[appointment.status]}
                    </Badge>
                  </Group>
                </Group>

                <Text fw={500}>{appointment.clientName || "Cliente"}</Text>

                <Stack gap={2}>
                  {appointment.scheduledServices?.map((ss) => (
                    <Group key={ss.id} justify="space-between" gap="xs">
                      <Text size="sm" c="dimmed">
                        {ss.service?.name ?? "Serviço"}
                      </Text>
                      <Text size="sm">{formatPrice(ss.price)}</Text>
                    </Group>
                  ))}
                </Stack>

                {canComplete && (
                  <Button
                    mt="xs"
                    color="green"
                    variant="light"
                    leftSection={<IconCheck size={16} />}
                    loading={completeMutation.isPending}
                    onClick={() => handleComplete(appointment)}
                    fullWidth
                  >
                    Concluir atendimento
                  </Button>
                )}
              </Stack>
            </Card>
          );
        })
      )}
    </Stack>
  );
}
