import {
  ActionIcon,
  Badge,
  Button,
  Checkbox,
  Container,
  Group,
  Paper,
  ScrollArea,
  Select,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import {
  IconCalendar,
  IconCheck,
  IconCurrencyDollar,
  IconFilter,
  IconFilterOff,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import { DateTime } from "luxon";
import { useMemo, useState } from "react";
import { ConfirmModal } from "../components/ConfirmModal";
import { useCollaborators } from "../hooks/useCollaborators";
import {
  useCommissions,
  useMarkCommissionsAsPaid,
  useMarkCommissionsAsUnpaid,
} from "../hooks/useCommissions";
import { formatDate, formatPrice } from "../utils/appointment.utils";

export function Commissions() {
  const [activeTab, setActiveTab] = useState<string>("pending");
  const [selectedCommissions, setSelectedCommissions] = useState<Set<string>>(
    new Set()
  );
  const [collaboratorFilter, setCollaboratorFilter] = useState<string | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(
    undefined
  );
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [markAsPaidModalOpened, setMarkAsPaidModalOpened] = useState(false);
  const [markAsUnpaidModalOpened, setMarkAsUnpaidModalOpened] = useState(false);

  // Prepara os filtros para enviar ao backend
  const filters = useMemo(() => {
    const filterObj: {
      paid?: boolean;
      startDate?: string;
      endDate?: string;
      collaboratorId?: string;
    } = {};

    // Se estiver na aba "pending", força paid=false
    if (activeTab === "pending") {
      filterObj.paid = false;
    } else if (statusFilter !== undefined) {
      filterObj.paid = statusFilter;
    }

    if (startDate) {
      // Converte para string yyyy-mm-dd usando Luxon
      let dateString: string;
      if (startDate instanceof Date) {
        dateString = DateTime.fromJSDate(startDate, {
          zone: "America/Sao_Paulo",
        }).toFormat("yyyy-MM-dd");
      } else {
        dateString = DateTime.fromISO(startDate, {
          zone: "America/Sao_Paulo",
        }).toFormat("yyyy-MM-dd");
      }
      filterObj.startDate = dateString;
    }
    if (endDate) {
      // Converte para string yyyy-mm-dd usando Luxon
      let dateString: string;
      if (endDate instanceof Date) {
        dateString = DateTime.fromJSDate(endDate, {
          zone: "America/Sao_Paulo",
        }).toFormat("yyyy-MM-dd");
      } else {
        dateString = DateTime.fromISO(endDate, {
          zone: "America/Sao_Paulo",
        }).toFormat("yyyy-MM-dd");
      }
      filterObj.endDate = dateString;
    }
    if (collaboratorFilter) {
      filterObj.collaboratorId = collaboratorFilter;
    }

    return Object.keys(filterObj).length > 0 ? filterObj : undefined;
  }, [activeTab, statusFilter, startDate, endDate, collaboratorFilter]);

  // Usa os filtros do backend - a aba "pending" já força paid=false nos filtros
  const { data: commissions, isLoading } = useCommissions(filters);
  const { data: collaborators } = useCollaborators();
  const markAsPaidMutation = useMarkCommissionsAsPaid();
  const markAsUnpaidMutation = useMarkCommissionsAsUnpaid();

  // Os filtros de status, data e colaborador já vêm do backend
  // Apenas filtra por termo de busca localmente
  const commissionsToShow = useMemo(() => {
    const commissionsList = commissions || [];

    // Filtrar apenas por termo de busca (nome do serviço ou cliente) - filtro local
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return commissionsList.filter((c) => {
        const serviceName =
          c.scheduledService?.service?.name?.toLowerCase() || "";
        const clientName =
          c.scheduledService?.appointment?.clientName?.toLowerCase() || "";
        const collaboratorName = c.collaborator?.name?.toLowerCase() || "";
        return (
          serviceName.includes(term) ||
          clientName.includes(term) ||
          collaboratorName.includes(term)
        );
      });
    }

    return commissionsList;
  }, [commissions, searchTerm]);

  // Calcular totais
  const totals = useMemo(() => {
    const total = commissionsToShow.reduce((sum, c) => sum + c.amount, 0);
    const pending = commissionsToShow
      .filter((c) => !c.paid)
      .reduce((sum, c) => sum + c.amount, 0);
    const paid = commissionsToShow
      .filter((c) => c.paid)
      .reduce((sum, c) => sum + c.amount, 0);
    return { total, pending, paid };
  }, [commissionsToShow]);

  // Seleção
  const allSelected =
    commissionsToShow.length > 0 &&
    commissionsToShow.every((c) => selectedCommissions.has(c.id));
  const someSelected =
    commissionsToShow.some((c) => selectedCommissions.has(c.id)) &&
    !allSelected;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedCommissions(new Set());
    } else {
      setSelectedCommissions(new Set(commissionsToShow.map((c) => c.id)));
    }
  };

  const handleSelectCommission = (id: string) => {
    const newSelected = new Set(selectedCommissions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCommissions(newSelected);
  };

  const handleMarkAsPaid = async () => {
    if (selectedCommissions.size === 0) return;

    try {
      await markAsPaidMutation.mutateAsync(Array.from(selectedCommissions));
      notifications.show({
        title: "Sucesso",
        message: `${selectedCommissions.size} comissão(ões) marcada(s) como paga(s)!`,
        color: "green",
      });
      setSelectedCommissions(new Set());
      setMarkAsPaidModalOpened(false);
    } catch {
      notifications.show({
        title: "Erro",
        message: "Erro ao marcar comissões como pagas",
        color: "red",
      });
    }
  };

  const handleMarkAsUnpaid = async () => {
    if (selectedCommissions.size === 0) return;

    try {
      await markAsUnpaidMutation.mutateAsync(Array.from(selectedCommissions));
      notifications.show({
        title: "Sucesso",
        message: `${selectedCommissions.size} comissão(ões) marcada(s) como não paga(s)!`,
        color: "green",
      });
      setSelectedCommissions(new Set());
      setMarkAsUnpaidModalOpened(false);
    } catch {
      notifications.show({
        title: "Erro",
        message: "Erro ao marcar comissões como não pagas",
        color: "red",
      });
    }
  };

  return (
    <Container style={{ maxWidth: "95%" }} px={{ base: "xs", sm: "md" }}>
      <Group gap="md" mb="xl">
        <Title order={1} c="pink">
          Comissões
        </Title>
      </Group>

      <Tabs
        value={activeTab}
        onChange={(value) => {
          setActiveTab(value || "pending");
          setSelectedCommissions(new Set());
          // Limpa filtro de status ao trocar de aba
          if (value === "pending") {
            setStatusFilter(undefined);
          }
        }}
      >
        <Tabs.List>
          <Tabs.Tab value="pending">Pendentes</Tabs.Tab>
          <Tabs.Tab value="all">Todas</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value={activeTab} pt="md">
          {/* Filtros e Ações */}
          <Stack gap="md" mb="md">
            <Group>
              <Select
                placeholder="Filtrar por colaborador"
                data={
                  collaborators?.map((c) => ({
                    value: c.id,
                    label: c.name,
                  })) || []
                }
                value={collaboratorFilter}
                onChange={setCollaboratorFilter}
                clearable
                leftSection={<IconUser size={16} />}
                style={{ flex: 1, maxWidth: 250 }}
              />
              {activeTab === "all" && (
                <Select
                  placeholder="Status"
                  data={[
                    { value: "all", label: "Todas" },
                    { value: "paid", label: "Pagas" },
                    { value: "pending", label: "Pendentes" },
                  ]}
                  value={
                    statusFilter === undefined
                      ? "all"
                      : statusFilter
                      ? "paid"
                      : "pending"
                  }
                  onChange={(value) => {
                    if (value === "all") {
                      setStatusFilter(undefined);
                    } else {
                      setStatusFilter(value === "paid");
                    }
                  }}
                  leftSection={<IconFilter size={16} />}
                  style={{ maxWidth: 150 }}
                />
              )}
              <DatePickerInput
                placeholder="Data inicial"
                value={startDate}
                onChange={(value) => {
                  // DatePickerInput com valueFormat retorna Date | null no onChange
                  // Converte para unknown primeiro para permitir verificação de tipo
                  const dateValue = value as unknown;
                  if (dateValue === null) {
                    setStartDate(null);
                  } else if (dateValue instanceof Date) {
                    setStartDate(dateValue);
                  } else if (typeof dateValue === 'string') {
                    // Se for string, tenta converter para Date
                    const date = new Date(dateValue);
                    setStartDate(isNaN(date.getTime()) ? null : date);
                  } else {
                    setStartDate(null);
                  }
                }}
                leftSection={<IconCalendar size={16} />}
                valueFormat="DD/MM/YYYY"
                clearable
                style={{ maxWidth: 180 }}
              />
              <DatePickerInput
                placeholder="Data final"
                value={endDate}
                onChange={(value) => {
                  // DatePickerInput com valueFormat retorna Date | null no onChange
                  // Converte para unknown primeiro para permitir verificação de tipo
                  const dateValue = value as unknown;
                  if (dateValue === null) {
                    setEndDate(null);
                  } else if (dateValue instanceof Date) {
                    setEndDate(dateValue);
                  } else if (typeof dateValue === 'string') {
                    // Se for string, tenta converter para Date
                    const date = new Date(dateValue);
                    setEndDate(isNaN(date.getTime()) ? null : date);
                  } else {
                    setEndDate(null);
                  }
                }}
                leftSection={<IconCalendar size={16} />}
                valueFormat="DD/MM/YYYY"
                clearable
                style={{ maxWidth: 180 }}
              />
              {(statusFilter !== undefined ||
                startDate ||
                endDate ||
                collaboratorFilter) && (
                <ActionIcon
                  variant="light"
                  color="gray"
                  onClick={() => {
                    setStatusFilter(undefined);
                    setStartDate(null);
                    setEndDate(null);
                    setCollaboratorFilter(null);
                  }}
                  title="Limpar filtros"
                >
                  <IconFilterOff size={18} />
                </ActionIcon>
              )}
              <TextInput
                placeholder="Buscar por serviço, cliente ou colaborador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.currentTarget.value)}
                style={{ flex: 1, maxWidth: 300 }}
              />
            </Group>

            {/* Totais */}
            <Group>
              <Paper withBorder p="sm" radius="md">
                <Text size="xs" c="dimmed">
                  Total
                </Text>
                <Text size="lg" fw={500}>
                  {formatPrice(totals.total)}
                </Text>
              </Paper>
              <Paper withBorder p="sm" radius="md" c="yellow">
                <Text size="xs" c="dimmed">
                  Pendentes
                </Text>
                <Text size="lg" fw={500} c="yellow">
                  {formatPrice(totals.pending)}
                </Text>
              </Paper>
              <Paper withBorder p="sm" radius="md" c="green">
                <Text size="xs" c="dimmed">
                  Pagas
                </Text>
                <Text size="lg" fw={500} c="green">
                  {formatPrice(totals.paid)}
                </Text>
              </Paper>
            </Group>

            {/* Ações em lote */}
            {selectedCommissions.size > 0 && (
              <Group>
                <Text size="sm" c="dimmed">
                  {selectedCommissions.size} comissão(ões) selecionada(s)
                </Text>
                <Button
                  size="sm"
                  color="green"
                  leftSection={<IconCheck size={16} />}
                  onClick={() => setMarkAsPaidModalOpened(true)}
                  disabled={markAsPaidMutation.isPending}
                >
                  Marcar como Pago
                </Button>
                {activeTab === "all" && (
                  <Button
                    size="sm"
                    color="red"
                    variant="light"
                    leftSection={<IconX size={16} />}
                    onClick={() => setMarkAsUnpaidModalOpened(true)}
                    disabled={markAsUnpaidMutation.isPending}
                  >
                    Marcar como Não Pago
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="subtle"
                  onClick={() => setSelectedCommissions(new Set())}
                >
                  Limpar Seleção
                </Button>
              </Group>
            )}
          </Stack>

          {/* Tabela */}
          {isLoading ? (
            <Text>Carregando...</Text>
          ) : commissionsToShow.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              Nenhuma comissão encontrada
            </Text>
          ) : (
            <ScrollArea>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ width: 50 }}>
                      <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected}
                        onChange={handleSelectAll}
                      />
                    </Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Colaborador</Table.Th>
                    <Table.Th>Serviço</Table.Th>
                    <Table.Th>Agendamento</Table.Th>
                    <Table.Th>Percentual</Table.Th>
                    <Table.Th>Valor</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {commissionsToShow.map((commission) => (
                    <Table.Tr
                      key={commission.id}
                      style={{
                        opacity: commission.paid ? 0.7 : 1,
                      }}
                    >
                      <Table.Td>
                        <Checkbox
                          checked={selectedCommissions.has(commission.id)}
                          onChange={() => handleSelectCommission(commission.id)}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={commission.paid ? "green" : "yellow"}
                          variant="light"
                        >
                          {commission.paid ? "Pago" : "Pendente"}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <IconUser size={14} />
                          <Text size="sm">
                            {commission.collaborator?.name || "-"}
                          </Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {commission.scheduledService?.service?.name || "-"}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        {commission.scheduledService?.appointment ? (
                          <Group gap="xs">
                            <IconCalendar size={14} />
                            <div>
                              <Text size="sm">
                                {formatDate(
                                  commission.scheduledService.appointment
                                    ?.date || ""
                                )}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {commission.scheduledService.appointment
                                  ?.clientName
                                  ? commission.scheduledService.appointment
                                      .clientName
                                  : "-"}
                              </Text>
                            </div>
                          </Group>
                        ) : (
                          "-"
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{commission.percentage}%</Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <IconCurrencyDollar size={14} />
                          <Text size="sm" fw={500}>
                            {formatPrice(commission.amount)}
                          </Text>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          )}
        </Tabs.Panel>
      </Tabs>

      {/* Modais de Confirmação */}
      <ConfirmModal
        opened={markAsPaidModalOpened}
        onClose={() => setMarkAsPaidModalOpened(false)}
        onConfirm={handleMarkAsPaid}
        title="Marcar como Pago"
        message={`Tem certeza que deseja marcar ${selectedCommissions.size} comissão(ões) como paga(s)?`}
        confirmLabel="Marcar como Pago"
        confirmColor="green"
        loading={markAsPaidMutation.isPending}
      />

      <ConfirmModal
        opened={markAsUnpaidModalOpened}
        onClose={() => setMarkAsUnpaidModalOpened(false)}
        onConfirm={handleMarkAsUnpaid}
        title="Marcar como Não Pago"
        message={`Tem certeza que deseja marcar ${selectedCommissions.size} comissão(ões) como não paga(s)?`}
        confirmLabel="Marcar como Não Pago"
        confirmColor="red"
        loading={markAsUnpaidMutation.isPending}
      />
    </Container>
  );
}
