import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Menu,
  Paper,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconDots,
  IconEdit,
  IconScissors,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import { useMemo } from "react";
import type { Appointment } from "../../types";
import { AppointmentStatus } from "../../types";

interface AppointmentScheduleViewProps {
  appointments: Appointment[];
  onComplete: (appointment: Appointment) => void;
  onCancel: (appointment: Appointment) => void;
  onEdit: (appointment: Appointment) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
  currentDate?: string; // Data no formato YYYY-MM-DD
  onDateChange?: (date: string) => void;
}

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 8; hour <= 21; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      slots.push(time);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

const calculateAppointmentPosition = (
  inicio: string,
  fim: string
): { top: number; height: number } => {
  try {
    // Parse time strings (HH:MM)
    const [inicioHour, inicioMin] = inicio.split(":").map(Number);
    const [fimHour, fimMin] = fim.split(":").map(Number);

    if (
      isNaN(inicioHour) ||
      isNaN(inicioMin) ||
      isNaN(fimHour) ||
      isNaN(fimMin)
    ) {
      return { top: 0, height: 60 };
    }

    const startMinutes = inicioHour * 60 + inicioMin;
    const endMinutes = fimHour * 60 + fimMin;
    const duration = Math.max(endMinutes - startMinutes, 30);

    const slotHeight = 60;
    const startTimeString = `${inicioHour
      .toString()
      .padStart(2, "0")}:${inicioMin.toString().padStart(2, "0")}`;

    let startSlotIndex = TIME_SLOTS.findIndex(
      (slot) => slot >= startTimeString
    );

    if (startSlotIndex === -1) {
      startSlotIndex = 0;
    }

    const top = startSlotIndex * slotHeight;
    const height = Math.max((duration / 30) * slotHeight, 30);

    return { top, height };
  } catch {
    return { top: 0, height: 60 };
  }
};

const appointmentsOverlap = (apt1: Appointment, apt2: Appointment): boolean => {
  const [start1Hour, start1Min] = apt1.startTime.split(":").map(Number);
  const [end1Hour, end1Min] = apt1.endTime.split(":").map(Number);
  const [start2Hour, start2Min] = apt2.startTime.split(":").map(Number);
  const [end2Hour, end2Min] = apt2.endTime.split(":").map(Number);

  const start1 = start1Hour * 60 + start1Min;
  const end1 = end1Hour * 60 + end1Min;
  const start2 = start2Hour * 60 + start2Min;
  const end2 = end2Hour * 60 + end2Min;

  return start1 < end2 && start2 < end1;
};

const calculateOverlappingPositions = (
  appointments: Appointment[]
): Map<
  string,
  { left: number; width: number; index: number; total: number }
> => {
  const positions = new Map<
    string,
    { left: number; width: number; index: number; total: number }
  >();
  const processed = new Set<string>();

  const groups: Appointment[][] = [];

  appointments.forEach((appointment) => {
    if (processed.has(appointment.id)) return;

    const group: Appointment[] = [appointment];
    processed.add(appointment.id);

    let foundNew = true;
    while (foundNew) {
      foundNew = false;
      appointments.forEach((other) => {
        if (processed.has(other.id)) return;

        const overlapsWithGroup = group.some((groupAppointment) =>
          appointmentsOverlap(groupAppointment, other)
        );

        if (overlapsWithGroup) {
          group.push(other);
          processed.add(other.id);
          foundNew = true;
        }
      });
    }

    if (group.length > 1) {
      group.sort((a, b) => {
        const [aHour, aMin] = a.startTime.split(":").map(Number);
        const [bHour, bMin] = b.startTime.split(":").map(Number);
        const aMinutes = aHour * 60 + aMin;
        const bMinutes = bHour * 60 + bMin;
        return aMinutes - bMinutes;
      });
      groups.push(group);
    }
  });

  groups.forEach((group) => {
    const gap = 4;
    const totalGaps = (group.length - 1) * gap;
    const availableWidth = 100 - totalGaps;
    const cardWidth = availableWidth / group.length;

    group.forEach((appointment, index) => {
      const left = index * (cardWidth + gap);
      positions.set(appointment.id, {
        left,
        width: cardWidth,
        index,
        total: group.length,
      });
    });
  });

  return positions;
};

export function AppointmentScheduleView({
  appointments,
  onComplete,
  onCancel,
  onEdit,
  onAppointmentClick,
  currentDate: externalDate,
  onDateChange,
}: AppointmentScheduleViewProps) {
  const currentDate = useMemo(() => {
    if (externalDate) {
      return new Date(externalDate + "T00:00:00");
    }
    return new Date();
  }, [externalDate]);

  const updateDate = (newDate: Date) => {
    const dateString = newDate.toISOString().split("T")[0];
    onDateChange?.(dateString);
  };

  const dayAppointments = useMemo(() => {
    return appointments.filter((apt) => apt.startTime && apt.endTime);
  }, [appointments]);

  const navigateDay = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === "next" ? 1 : -1));
    updateDate(newDate);
  };

  const goToToday = () => {
    updateDate(new Date());
  };

  const overlappingPositions = calculateOverlappingPositions(dayAppointments);

  const statusColors: Record<AppointmentStatus, string> = {
    agendado: "blue",
    concluido: "green",
    cancelado: "red",
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Group>
          <Button
            variant="subtle"
            leftSection={<IconChevronLeft size={16} />}
            onClick={() => navigateDay("prev")}
          >
            Ontem
          </Button>
          <Button variant="subtle" onClick={goToToday}>
            Hoje
          </Button>
          <Button
            variant="subtle"
            rightSection={<IconChevronRight size={16} />}
            onClick={() => navigateDay("next")}
          >
            Amanhã
          </Button>
        </Group>
        <Stack mr="sm">
          <Text size="xs" fw={500} ta="center" c="dimmed">
            {currentDate.toLocaleDateString("pt-BR", { weekday: "long" })}
          </Text>
          <Text size="lg" fw={700} ta="center">
            {currentDate.toLocaleDateString("pt-BR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
        </Stack>
      </Group>

      <ScrollArea h={650} style={{ maxHeight: "650px" }}>
        <Paper withBorder p="md">
          <div
            style={{ position: "relative", minHeight: TIME_SLOTS.length * 60 }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "100px 1fr",
                gap: "8px",
              }}
            >
              <div>
                {TIME_SLOTS.map((time) => (
                  <div
                    key={time}
                    style={{
                      height: "60px",
                      borderTop: "1px solid var(--mantine-color-gray-3)",
                      paddingTop: "4px",
                    }}
                  >
                    <Text size="xs" c="dimmed">
                      {time}
                    </Text>
                  </div>
                ))}
              </div>
              <div
                style={{
                  position: "relative",
                  minHeight: TIME_SLOTS.length * 60,
                }}
              >
                {TIME_SLOTS.map((time) => (
                  <div
                    key={time}
                    style={{
                      height: "60px",
                      borderTop: "1px solid var(--mantine-color-gray-2)",
                    }}
                  />
                ))}
                {dayAppointments.length === 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      textAlign: "center",
                      color: "var(--mantine-color-dimmed)",
                      zIndex: 100,
                    }}
                  >
                    <Text size="sm" c="dimmed">
                      Nenhum agendamento para este dia
                    </Text>
                    <Text size="xs" c="dimmed" mt="xs">
                      Total de agendamentos: {appointments.length}
                    </Text>
                  </div>
                )}
                {dayAppointments.map((appointment) => {
                  if (!appointment.startTime || !appointment.endTime) {
                    return null;
                  }

                  const { top, height } = calculateAppointmentPosition(
                    appointment.startTime,
                    appointment.endTime
                  );

                  const position = overlappingPositions.get(appointment.id);
                  let width = "calc(100% - 8px)";
                  let left = "0px";

                  if (position && position.total > 1) {
                    const gap = 4;
                    const totalGaps = (position.total - 1) * gap;
                    const availableWidth = 100 - totalGaps;
                    const cardWidth = availableWidth / position.total;
                    width = `${cardWidth}%`;
                    left = `${position.index * (cardWidth + gap)}%`;
                  }

                  const appointmentStatus = appointment.status;

                  return (
                    <Card
                      key={appointment.id}
                      p="sm"
                      withBorder
                      shadow="sm"
                      onClick={() => onAppointmentClick?.(appointment)}
                      style={{
                        position: "absolute",
                        top: `${top}px`,
                        height: `${height}px`,
                        width: width,
                        left: left,
                        backgroundColor:
                          appointmentStatus === AppointmentStatus.COMPLETED
                            ? "var(--mantine-color-green-0)"
                            : appointmentStatus === AppointmentStatus.CANCELLED
                            ? "var(--mantine-color-red-0)"
                            : "var(--mantine-color-blue-0)",
                        borderLeft: `4px solid var(--mantine-color-${statusColors[appointmentStatus]}-6)`,
                        cursor: "pointer",
                        overflow: "hidden",
                        transition: "transform 0.2s, box-shadow 0.2s",
                        zIndex: 1,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.02)";
                        e.currentTarget.style.boxShadow =
                          "var(--mantine-shadow-md)";
                        e.currentTarget.style.zIndex = "10";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow =
                          "var(--mantine-shadow-sm)";
                        e.currentTarget.style.zIndex = "1";
                      }}
                    >
                      <Stack gap="xs" h="100%">
                        <Group justify="space-between" gap="xs">
                          <Group gap={4}>
                            <IconScissors size={12} />
                            <Text size="sm" fw={600} lineClamp={1}>
                              {`${appointment.clientName || "-"} | ${appointment.scheduledServices?.[0]?.service?.name || "-"}`}
                            </Text>
                          </Group>
                          <Badge
                            size="xs"
                            color={statusColors[appointmentStatus]}
                          >
                            {appointmentStatus}
                          </Badge>
                        </Group>

                        {appointment.scheduledServices?.[0]?.collaborator && (
                          <Group gap={4}>
                            <IconUser size={10} />
                            <Text size="xs" c="dimmed" lineClamp={1}>
                              {
                                appointment.scheduledServices[0].collaborator
                                  .name
                              }
                            </Text>
                          </Group>
                        )}
                        {appointmentStatus === AppointmentStatus.SCHEDULED && (
                          <Menu>
                            <Menu.Target>
                              <ActionIcon
                                size="xs"
                                variant="subtle"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <IconDots size={12} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown onClick={(e) => e.stopPropagation()}>
                              <Menu.Item
                                leftSection={<IconEdit size={14} />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEdit(appointment);
                                }}
                              >
                                Editar
                              </Menu.Item>
                              <Menu.Item
                                leftSection={<IconCheck size={14} />}
                                color="green"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onComplete(appointment);
                                }}
                              >
                                Concluir
                              </Menu.Item>
                              <Menu.Item
                                leftSection={<IconX size={14} />}
                                color="red"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCancel(appointment);
                                }}
                              >
                                Cancelar
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        )}
                      </Stack>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </Paper>
      </ScrollArea>
    </Stack>
  );
}
