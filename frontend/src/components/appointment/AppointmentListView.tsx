import {
  Badge,
  Card,
  Group,
  ScrollArea,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { IconCalendar } from "@tabler/icons-react";
import { DateTime } from "luxon";
import { useMediaQuery } from "@mantine/hooks";
import type { Appointment } from "../../types";
import { AppointmentStatus } from "../../types";
import { formatDate, formatPrice } from "../../utils/appointment.utils";
import { formatPhoneDisplay } from "../../utils/phone.util";
import { countLabel } from "../../utils/plural.util";
import { RowActions } from "../RowActions";

interface AppointmentListViewProps {
  appointments: Appointment[];
  onComplete: (appointment: Appointment) => void;
  onCancel: (appointment: Appointment) => void;
  onEdit: (appointment: Appointment) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
  currentDate?: string; // Data no formato YYYY-MM-DD
  onDateChange?: (date: string) => void;
  getTotalPrice: (appointment: Appointment) => number;
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

export function AppointmentListView({
  appointments,
  onComplete,
  onCancel,
  onEdit,
  onAppointmentClick,
  currentDate,
  onDateChange,
  getTotalPrice,
}: AppointmentListViewProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Ordena por horário de início (HH:MM, ordenação lexicográfica funciona).
  const sortedAppointments = [...appointments].sort((a, b) =>
    (a.startTime ?? "").localeCompare(b.startTime ?? ""),
  );

  return (
    <Stack gap="md">
      {onDateChange && (
        <Group mb="md">
          <DatePickerInput
            label="Filtrar por data"
            placeholder="Selecione uma data"
            value={
              currentDate
                ? DateTime.fromISO(currentDate, {
                    zone: "America/Sao_Paulo",
                  }).toJSDate()
                : null
            }
            onChange={(value) => {
              if (value) {
                let dateString: string;
                if (typeof value === "string") {
                  dateString = DateTime.fromISO(value, {
                    zone: "America/Sao_Paulo",
                  }).toFormat("yyyy-MM-dd");
                } else {
                  dateString = DateTime.fromJSDate(value, {
                    zone: "America/Sao_Paulo",
                  }).toFormat("yyyy-MM-dd");
                }
                onDateChange(dateString);
              } else {
                const today = DateTime.now()
                  .setZone("America/Sao_Paulo")
                  .toFormat("yyyy-MM-dd");
                onDateChange(today);
              }
            }}
            leftSection={<IconCalendar size={16} />}
            valueFormat="DD/MM/YYYY"
            clearable
            style={{ flex: 1, maxWidth: isMobile ? "100%" : 300 }}
          />
        </Group>
      )}
      {sortedAppointments.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          Nenhum agendamento encontrado
        </Text>
      ) : isMobile ? (
        <Stack gap="sm">
          {sortedAppointments.map((appointment) => (
            <Card
              key={appointment.id}
              withBorder
              radius="md"
              padding="md"
              onClick={() => onAppointmentClick?.(appointment)}
              style={{
                cursor: onAppointmentClick ? "pointer" : "default",
                borderLeft: `4px solid var(--mantine-color-${statusColors[appointment.status]}-6)`,
              }}
            >
              <Stack gap={8}>
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
                  <Text fw={600}>{formatPrice(getTotalPrice(appointment))}</Text>
                </Group>

                <Text fw={500}>{appointment.clientName || "-"}</Text>
                {appointment.clientPhone && (
                  <Text size="sm" c="dimmed">
                    {formatPhoneDisplay(appointment.clientPhone)}
                  </Text>
                )}
                <Text size="sm" c="dimmed">
                  {appointment.scheduledServices &&
                  appointment.scheduledServices.length > 0
                    ? countLabel(
                        appointment.scheduledServices.length,
                        "serviço",
                        "serviços",
                      )
                    : "Sem serviços"}
                </Text>

                {appointment.status === AppointmentStatus.SCHEDULED && (
                  <Group
                    justify="flex-end"
                    mt={4}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <RowActions
                      onEdit={() => onEdit(appointment)}
                      onComplete={() => onComplete(appointment)}
                      onCancel={() => onCancel(appointment)}
                    />
                  </Group>
                )}
              </Stack>
            </Card>
          ))}
        </Stack>
      ) : (
        <ScrollArea>
          <Table striped highlightOnHover miw={720}>
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
              {sortedAppointments.map((appointment) => (
                <Table.Tr
                  key={appointment.id}
                  style={{
                    cursor: onAppointmentClick ? "pointer" : "default",
                  }}
                  onClick={() => onAppointmentClick?.(appointment)}
                >
                  <Table.Td>
                    <Stack gap={2}>
                      <Text size="sm" fw={500}>
                        {formatDate(appointment.date)}
                      </Text>
                      {appointment.startTime && appointment.endTime && (
                        <Text size="xs" c="brand" fw={500}>
                          {appointment.startTime} - {appointment.endTime}
                        </Text>
                      )}
                    </Stack>
                  </Table.Td>
                  <Table.Td>{appointment.clientName || "-"}</Table.Td>
                  <Table.Td>{formatPhoneDisplay(appointment.clientPhone) || "-"}</Table.Td>
                  <Table.Td>
                    {appointment.scheduledServices &&
                    appointment.scheduledServices.length > 0
                      ? countLabel(
                          appointment.scheduledServices.length,
                          "serviço",
                          "serviços",
                        )
                      : "-"}
                  </Table.Td>
                  <Table.Td>{formatPrice(getTotalPrice(appointment))}</Table.Td>
                  <Table.Td>
                    <Badge color={statusColors[appointment.status]}>
                      {statusLabels[appointment.status]}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" onClick={(e) => e.stopPropagation()}>
                      {appointment.status === AppointmentStatus.SCHEDULED && (
                        <RowActions
                          onEdit={() => onEdit(appointment)}
                          onComplete={() => onComplete(appointment)}
                          onCancel={() => onCancel(appointment)}
                        />
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      )}
    </Stack>
  );
}
