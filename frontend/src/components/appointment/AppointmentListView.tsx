import {
  Badge,
  Button,
  Group,
  ScrollArea,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { IconCalendar, IconCheck, IconEdit, IconX } from "@tabler/icons-react";
import { DateTime } from "luxon";
import { useMediaQuery } from "@mantine/hooks";
import type { Appointment } from "../../types";
import { AppointmentStatus } from "../../types";
import { formatDate, formatPrice } from "../../utils/appointment.utils";

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
            {appointments.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={7} style={{ textAlign: "center" }}>
                  <Text c="dimmed" py="md">
                    Nenhum agendamento encontrado
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              appointments.map((appointment) => (
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
                  <Table.Td>{formatPrice(getTotalPrice(appointment))}</Table.Td>
                  <Table.Td>
                    <Badge color={statusColors[appointment.status]}>
                      {statusLabels[appointment.status]}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" onClick={(e) => e.stopPropagation()}>
                      {appointment.status === AppointmentStatus.SCHEDULED && (
                        <>
                          <Button
                            variant="light"
                            color="blue"
                            size="xs"
                            leftSection={<IconEdit size={14} />}
                            onClick={() => onEdit(appointment)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="light"
                            color="green"
                            size="xs"
                            leftSection={<IconCheck size={14} />}
                            onClick={() => onComplete(appointment)}
                          >
                            Concluir
                          </Button>
                          <Button
                            variant="light"
                            color="red"
                            size="xs"
                            leftSection={<IconX size={14} />}
                            onClick={() => onCancel(appointment)}
                          >
                            Cancelar
                          </Button>
                        </>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Stack>
  );
}
