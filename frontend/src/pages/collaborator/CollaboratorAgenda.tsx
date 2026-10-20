import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import {
  IconCalendarOff,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconCoin,
} from "@tabler/icons-react";
import { DateTime } from "luxon";
import { useMemo, useState } from "react";
import {
  useAppointments,
  useCompleteAppointment,
} from "../../hooks/useAppointments";
import { useNotifications } from "../../hooks/useNotifications";
import { useAuth } from "../../contexts/AuthContext";
import { AppointmentStatus, type Appointment } from "../../types";
import { formatPrice, toMoney } from "../../utils/money.util";

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

/** Comissão estimada de um agendamento, só dos serviços do colaborador. */
function appointmentCommission(
  appointment: Appointment,
  collaboratorId?: string | null,
): number {
  return (appointment.scheduledServices ?? [])
    .filter((ss) => !collaboratorId || ss.collaboratorId === collaboratorId)
    .reduce((acc, ss) => {
      const pct = Number(ss.service?.commissionPercentage ?? 0);
      return acc + (toMoney(ss.price) * pct) / 100;
    }, 0);
}

export function CollaboratorAgenda() {
  const { user } = useAuth();
  const [date, setDate] = useState<string>(() =>
    DateTime.now().setZone(ZONE).toFormat("yyyy-MM-dd"),
  );
  const { data: appointments, isLoading } = useAppointments(date);
  const completeMutation = useCompleteAppointment();
  const { showSuccess, showError } = useNotifications();

  const today = DateTime.now().setZone(ZONE).toFormat("yyyy-MM-dd");
  const isToday = date === today;

  const label = useMemo(() => {
    const dt = DateTime.fromISO(date, { zone: ZONE }).setLocale("pt-BR");
    const prefix = date === today ? "Hoje, " : "";
    return prefix + dt.toFormat("cccc, dd 'de' LLLL");
  }, [date, today]);

  const shiftDay = (delta: number) => {
    setDate((d) =>
      DateTime.fromISO(d, { zone: ZONE })
        .plus({ days: delta })
        .toFormat("yyyy-MM-dd"),
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
      [...(appointments ?? [])]
        .filter((a) => a.status !== AppointmentStatus.CANCELLED)
        .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? "")),
    [appointments],
  );

  // Resumo do dia: nº de atendimentos, total a realizar e comissão estimada.
  const collaboratorId = user?.collaboratorId ?? undefined;
  const summary = useMemo(() => {
    const count = sorted.length;
    const total = sorted.reduce(
      (acc, a) =>
        acc +
        (a.scheduledServices ?? [])
          .filter(
            (ss) => !collaboratorId || ss.collaboratorId === collaboratorId,
          )
          .reduce((s, ss) => s + toMoney(ss.price), 0),
      0,
    );
    const commission = sorted.reduce(
      (acc, a) => acc + appointmentCommission(a, collaboratorId),
      0,
    );
    return { count, total, commission };
  }, [sorted, collaboratorId]);

  // Primeiro nome do colaborador (preferindo o nome real; fallback no e-mail).
  const firstName = useMemo(() => {
    const real = (user?.collaboratorName ?? "").trim().split(/\s+/)[0];
    if (real) return real;
    const local = (user?.email ?? "").split("@")[0]?.split(/[._-]/)[0] ?? "";
    if (!local) return "";
    return local.charAt(0).toUpperCase() + local.slice(1);
  }, [user?.collaboratorName, user?.email]);

  return (
    <Stack gap="md" pb={80}>
      {/* Saudação */}
      <div>
        <Text fz={22} fw={700} c="brand" lh={1.2}>
          {firstName ? `Olá, ${firstName} 👋` : "Olá 👋"}
        </Text>
        <Text size="sm" c="dimmed">
          {isToday
            ? "Aqui está a sua agenda de hoje."
            : "Veja a agenda do dia selecionado."}
        </Text>
      </div>

      {/* Navegação de dia */}
      <Card withBorder radius="md" padding="sm">
        <Group justify="space-between" wrap="nowrap">
          <ActionIcon
            variant="subtle"
            size="lg"
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
            size="lg"
            onClick={() => shiftDay(1)}
            aria-label="Próximo dia"
          >
            <IconChevronRight size={18} />
          </ActionIcon>
        </Group>
      </Card>

      {/* Resumo do dia */}
      {!isLoading && sorted.length > 0 && (
        <SimpleGrid cols={3} spacing="xs">
          <Paper withBorder radius="md" p="sm">
            <Text size="xs" c="dimmed">
              Atendimentos
            </Text>
            <Text fw={700} fz="lg">
              {summary.count}
            </Text>
          </Paper>
          <Paper withBorder radius="md" p="sm">
            <Text size="xs" c="dimmed">
              A realizar
            </Text>
            <Text fw={700} fz="lg">
              {formatPrice(summary.total)}
            </Text>
          </Paper>
          <Paper
            withBorder
            radius="md"
            p="sm"
            style={{
              background: "var(--mantine-color-brand-0)",
              borderColor: "var(--mantine-color-brand-2)",
            }}
          >
            <Text size="xs" c="dimmed">
              Sua comissão
            </Text>
            <Text fw={700} fz="lg" c="brand">
              {formatPrice(summary.commission)}
            </Text>
          </Paper>
        </SimpleGrid>
      )}

      {isLoading ? (
        <Group justify="center" py="xl">
          <Loader color="brand" />
        </Group>
      ) : sorted.length === 0 ? (
        <Stack align="center" py={48} gap="sm">
          <ThemeIcon size={64} radius="xl" variant="light" color="gray">
            <IconCalendarOff size={32} />
          </ThemeIcon>
          <Text fw={600}>Nenhum atendimento neste dia</Text>
          <Text size="sm" c="dimmed" ta="center" maw={260}>
            Quando houver agendamentos para você, eles aparecem aqui.
          </Text>
        </Stack>
      ) : (
        sorted.map((appointment) => {
          const canComplete =
            appointment.status === AppointmentStatus.SCHEDULED;
          const commission = appointmentCommission(appointment, collaboratorId);
          return (
            <Card key={appointment.id} withBorder radius="md" padding="md">
              <Stack gap="xs">
                <Group justify="space-between" wrap="nowrap">
                  <Group gap={8} wrap="nowrap">
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

                <Text fw={600}>{appointment.clientName || "Cliente"}</Text>

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

                {commission > 0 && (
                  <Group gap={6} wrap="nowrap">
                    <ThemeIcon
                      size={20}
                      radius="xl"
                      variant="light"
                      color="brand"
                    >
                      <IconCoin size={12} />
                    </ThemeIcon>
                    <Text size="sm" c="brand" fw={600}>
                      Sua comissão: {formatPrice(commission)}
                    </Text>
                  </Group>
                )}

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
