import {
  ActionIcon,
  Badge,
  Button,
  Checkbox,
  Container,
  Group,
  MultiSelect,
  Pagination,
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
import { useDebouncedValue } from "@mantine/hooks";
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
import { useMemo, useState, useEffect } from "react";
import { ConfirmModal } from "../components/ConfirmModal";
import { useCollaborators } from "../hooks/useCollaborators";
import { useNavigate } from "react-router-dom";
import {
  useCommissions,
  useMarkCommissionsAsPaid,
  useMarkCommissionsAsUnpaid,
  COMMISSIONS_PAGE_SIZE,
} from "../hooks/useCommissions";
import { useOperationalBranding } from "../hooks/useOperationalBranding";
import { useNotifications } from "../hooks/useNotifications";
import { formatDate } from "../utils/appointment.utils";
import { formatPrice, toMoney } from "../utils/money.util";

export function Commissions() {
  const navigate = useNavigate();
  const { commissionsEnabled } = useOperationalBranding();

  useEffect(() => {
    if (!commissionsEnabled) {
      navigate("/", { replace: true });
    }
  }, [commissionsEnabled, navigate]);

  const [activeTab, setActiveTab] = useState<string>("pending");
  const [selectedCommissions, setSelectedCommissions] = useState<Set<string>>(
    new Set()
  );
  const [collaboratorFilter, setCollaboratorFilter] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 500);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(
    undefined
  );
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [markAsPaidModalOpened, setMarkAsPaidModalOpened] = useState(false);
  const [markAsUnpaidModalOpened, setMarkAsUnpaidModalOpened] = useState(false);

  useEffect(() => {
    setPage(1);
    setSelectedCommissions(new Set());
  }, [
    activeTab,
    statusFilter,
    startDate,
    endDate,
    collaboratorFilter,
    debouncedSearchTerm,
  ]);

  // Prepara os filtros para enviar ao backend
  const filters = useMemo(() => {
    const filterObj: {
      paid?: boolean;
      startDate?: string;
      endDate?: string;
      collaboratorIds?: string[];
      search?: string;
      page: number;
      limit: number;
    } = {
      page,
      limit: COMMISSIONS_PAGE_SIZE,
    };

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
    if (collaboratorFilter.length > 0) {
      filterObj.collaboratorIds = collaboratorFilter;
    }
    if (debouncedSearchTerm.trim()) {
      filterObj.search = debouncedSearchTerm.trim();
    }

    return filterObj;
  }, [
    activeTab,
    statusFilter,
    startDate,
    endDate,
    collaboratorFilter,
    debouncedSearchTerm,
    page,
  ]);

  const { data: commissionsData, isLoading, isFetching } = useCommissions(
    filters,
    commissionsEnabled,
  );
  const { data: collaborators } = useCollaborators();
  const markAsPaidMutation = useMarkCommissionsAsPaid();
  const markAsUnpaidMutation = useMarkCommissionsAsUnpaid();
  const { showSuccess, showError } = useNotifications();

  const commissionsToShow = commissionsData?.items ?? [];
  const totals = commissionsData?.summary ?? {
    totalAmount: 0,
    pendingAmount: 0,
    paidAmount: 0,
  };
  const totalPages = Math.max(
    1,
    Math.ceil((commissionsData?.total ?? 0) / COMMISSIONS_PAGE_SIZE),
  );

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
      showSuccess(
        `${selectedCommissions.size} comissão(ões) marcada(s) como paga(s)!`
      );
      setSelectedCommissions(new Set());
      setMarkAsPaidModalOpened(false);
    } catch {
      showError("Erro ao marcar comissões como pagas");
    }
  };

  const handleMarkAsUnpaid = async () => {
    if (selectedCommissions.size === 0) return;

    try {
      await markAsUnpaidMutation.mutateAsync(Array.from(selectedCommissions));
      showSuccess(
        `${selectedCommissions.size} comissão(ões) marcada(s) como não paga(s)!`
      );
      setSelectedCommissions(new Set());
      setMarkAsUnpaidModalOpened(false);
    } catch {
      showError("Erro ao marcar comissões como não pagas");
    }
  };

  if (!commissionsEnabled) {
    return null;
  }

  return (
    <Container
      style={{ maxWidth: "95%" }}
      px={{ base: "xs", sm: "md" }}
      pb="xl"
    >
      <Group gap="md" mb="xl">
        <Title order={1} c="brand">
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
              <MultiSelect
                placeholder="Filtrar por colaborador(es)"
                data={
                  collaborators?.map((c) => ({
                    value: c.id,
                    label: c.name,
                  })) || []
                }
                value={collaboratorFilter}
                onChange={setCollaboratorFilter}
                clearable
                searchable
                leftSection={<IconUser size={16} />}
                style={{ flex: 1, maxWidth: 320 }}
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
                onChange={(value) => setStartDate(value as Date | null)}
                leftSection={<IconCalendar size={16} />}
                valueFormat="DD/MM/YYYY"
                clearable
                style={{ maxWidth: 180 }}
              />
              <DatePickerInput
                placeholder="Data final"
                value={endDate}
                onChange={(value) => setEndDate(value as Date | null)}
                leftSection={<IconCalendar size={16} />}
                valueFormat="DD/MM/YYYY"
                clearable
                style={{ maxWidth: 180 }}
              />
              {(statusFilter !== undefined ||
                startDate ||
                endDate ||
                collaboratorFilter.length > 0) && (
                <ActionIcon
                  variant="light"
                  color="gray"
                  onClick={() => {
                    setStatusFilter(undefined);
                    setStartDate(null);
                    setEndDate(null);
                    setCollaboratorFilter([]);
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
                  {formatPrice(totals.totalAmount)}
                </Text>
              </Paper>
              <Paper withBorder p="sm" radius="md" c="yellow">
                <Text size="xs" c="dimmed">
                  Pendentes
                </Text>
                <Text size="lg" fw={500} c="yellow">
                  {formatPrice(totals.pendingAmount)}
                </Text>
              </Paper>
              <Paper withBorder p="sm" radius="md" c="green">
                <Text size="xs" c="dimmed">
                  Pagas
                </Text>
                <Text size="lg" fw={500} c="green">
                  {formatPrice(totals.paidAmount)}
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
            <>
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
                    <Table.Th>Valor do serviço</Table.Th>
                    <Table.Th>Comissão</Table.Th>
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
                        <Text size="sm">{toMoney(commission.percentage)}%</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {formatPrice(
                            commission.scheduledService?.price ?? 0,
                          )}
                        </Text>
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
            <Group justify="space-between" mt="md" mb="sm" wrap="wrap" gap="sm">
              <Text size="sm" c="dimmed">
                {commissionsData?.total ?? 0} comissão(ões) encontrada(s)
                {isFetching ? " · atualizando..." : ""}
              </Text>
              <Pagination
                total={totalPages}
                value={page}
                onChange={setPage}
              />
            </Group>
            </>
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
