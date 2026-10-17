import {
  ActionIcon,
  Badge,
  Button,
  Checkbox,
  Group,
  MultiSelect,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
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
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ConfirmModal } from "../ConfirmModal";
import { TablePage } from "../TablePage";
import { useCollaborators } from "../../hooks/useCollaborators";
import {
  COMMISSIONS_PAGE_SIZE,
  useCommissions,
  useMarkCommissionsAsPaid,
  useMarkCommissionsAsUnpaid,
} from "../../hooks/useCommissions";
import { useNotifications } from "../../hooks/useNotifications";
import { formatDate } from "../../utils/appointment.utils";
import { formatPrice, toMoney } from "../../utils/money.util";

interface CommissionsPanelProps {
  /**
   * Quando informado, trava o painel às comissões de um único colaborador
   * e oculta o filtro/coluna de colaborador.
   */
  fixedCollaboratorId?: string;
  /**
   * Habilita seleção em lote e ações de pagamento (marcar como pago/não pago).
   * Default: true. Usar `false` para a futura visão somente-leitura do colaborador.
   */
  canManagePayments?: boolean;
  /** Conteúdo renderizado acima dos filtros (ex.: título, cabeçalho do perfil). */
  headerTop?: ReactNode;
  /** Mostra os três cards pequenos de totais (Total/Pendentes/Pagas). Default: true. */
  showTotals?: boolean;
  /** Habilita o scroll só na tabela usando o layout TablePage. Default: true. */
  withTablePageLayout?: boolean;
}

export function CommissionsPanel({
  fixedCollaboratorId,
  canManagePayments = true,
  headerTop,
  showTotals = true,
  withTablePageLayout = true,
}: CommissionsPanelProps) {
  const isScoped = Boolean(fixedCollaboratorId);

  const [selectedCommissions, setSelectedCommissions] = useState<Set<string>>(
    new Set(),
  );
  const [collaboratorFilter, setCollaboratorFilter] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 500);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"pending" | "paid" | "all">(
    "pending",
  );
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [markAsPaidModalOpened, setMarkAsPaidModalOpened] = useState(false);
  const [markAsUnpaidModalOpened, setMarkAsUnpaidModalOpened] = useState(false);

  useEffect(() => {
    setPage(1);
    setSelectedCommissions(new Set());
  }, [
    statusFilter,
    startDate,
    endDate,
    collaboratorFilter,
    debouncedSearchTerm,
  ]);

  const toDateString = (value: Date): string =>
    DateTime.fromJSDate(value, { zone: "America/Sao_Paulo" }).toFormat(
      "yyyy-MM-dd",
    );

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

    // Status: pending/paid/all
    if (statusFilter === "pending") {
      filterObj.paid = false;
    } else if (statusFilter === "paid") {
      filterObj.paid = true;
    }

    if (startDate) {
      filterObj.startDate = toDateString(startDate);
    }
    if (endDate) {
      filterObj.endDate = toDateString(endDate);
    }

    if (fixedCollaboratorId) {
      filterObj.collaboratorIds = [fixedCollaboratorId];
    } else if (collaboratorFilter.length > 0) {
      filterObj.collaboratorIds = collaboratorFilter;
    }

    if (debouncedSearchTerm.trim()) {
      filterObj.search = debouncedSearchTerm.trim();
    }

    return filterObj;
  }, [
    statusFilter,
    startDate,
    endDate,
    collaboratorFilter,
    debouncedSearchTerm,
    page,
    fixedCollaboratorId,
  ]);

  const {
    data: commissionsData,
    isLoading,
    isFetching,
  } = useCommissions(filters, true);
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

  const hasActiveFilters =
    statusFilter !== "pending" ||
    Boolean(startDate) ||
    Boolean(endDate) ||
    (!isScoped && collaboratorFilter.length > 0);

  // Seleção
  const allSelected =
    commissionsToShow.length > 0 &&
    commissionsToShow.every((c) => selectedCommissions.has(c.id));
  const someSelected =
    commissionsToShow.some((c) => selectedCommissions.has(c.id)) && !allSelected;

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
        `${selectedCommissions.size} comissão(ões) marcada(s) como paga(s)!`,
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
        `${selectedCommissions.size} comissão(ões) marcada(s) como não paga(s)!`,
      );
      setSelectedCommissions(new Set());
      setMarkAsUnpaidModalOpened(false);
    } catch {
      showError("Erro ao marcar comissões como não pagas");
    }
  };

  const header = (
    <Stack gap="md" mb="md">
      {headerTop}

      {/* Filtros */}
      <Stack gap="md">
        <Group>
          {!isScoped && (
            <MultiSelect
              placeholder="Filtrar por colaborador(es)"
              data={
                collaborators
                  ?.filter((c) => c.isActive)
                  .map((c) => ({ value: c.id, label: c.name })) || []
              }
              value={collaboratorFilter}
              onChange={setCollaboratorFilter}
              clearable
              searchable
              leftSection={<IconUser size={16} />}
              style={{ flex: 1, maxWidth: 320 }}
            />
          )}
          <Select
            data={[
              { value: "pending", label: "Pendentes" },
              { value: "paid", label: "Pagas" },
              { value: "all", label: "Todas" },
            ]}
            value={statusFilter}
            onChange={(value) =>
              setStatusFilter((value as "pending" | "paid" | "all") || "pending")
            }
            allowDeselect={false}
            leftSection={<IconFilter size={16} />}
            style={{ maxWidth: 160 }}
          />
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
          {hasActiveFilters && (
            <ActionIcon
              variant="light"
              color="gray"
              onClick={() => {
                setStatusFilter("pending");
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
            placeholder={
              isScoped
                ? "Buscar por serviço ou cliente..."
                : "Buscar por serviço, cliente ou colaborador..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.currentTarget.value)}
            style={{ flex: 1, maxWidth: 300 }}
          />
        </Group>

        {/* Totais */}
        {showTotals && (
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
        )}

        {/* Ações em lote */}
        {canManagePayments && selectedCommissions.size > 0 && (
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
            {statusFilter !== "pending" && (
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
    </Stack>
  );

  const body = (
    <>
      {isLoading ? (
        <Text>Carregando...</Text>
      ) : commissionsToShow.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          Nenhuma comissão encontrada
        </Text>
      ) : (
        <>
          <Table striped highlightOnHover miw={isScoped ? 640 : 720}>
            <Table.Thead>
              <Table.Tr>
                {canManagePayments && (
                  <Table.Th style={{ width: 50 }}>
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={handleSelectAll}
                    />
                  </Table.Th>
                )}
                <Table.Th>Status</Table.Th>
                {!isScoped && <Table.Th>Colaborador</Table.Th>}
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
                  style={{ opacity: commission.paid ? 0.7 : 1 }}
                >
                  {canManagePayments && (
                    <Table.Td>
                      <Checkbox
                        checked={selectedCommissions.has(commission.id)}
                        onChange={() => handleSelectCommission(commission.id)}
                      />
                    </Table.Td>
                  )}
                  <Table.Td>
                    <Badge
                      color={commission.paid ? "green" : "yellow"}
                      variant="light"
                    >
                      {commission.paid ? "Pago" : "Pendente"}
                    </Badge>
                  </Table.Td>
                  {!isScoped && (
                    <Table.Td>
                      <Group gap="xs">
                        <IconUser size={14} />
                        <Text size="sm">
                          {commission.collaborator?.name || "-"}
                        </Text>
                      </Group>
                    </Table.Td>
                  )}
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
                              commission.scheduledService.appointment?.date ||
                                "",
                            )}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {commission.scheduledService.appointment
                              ?.clientName || "-"}
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
                      {formatPrice(commission.scheduledService?.price ?? 0)}
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
          <Group justify="space-between" mt="md" mb="sm" wrap="wrap" gap="sm">
            <Text size="sm" c="dimmed">
              {commissionsData?.total ?? 0} comissão(ões) encontrada(s)
              {isFetching ? " · atualizando..." : ""}
            </Text>
            <Pagination total={totalPages} value={page} onChange={setPage} />
          </Group>
        </>
      )}
    </>
  );

  const modals = (
    <>
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
    </>
  );

  if (withTablePageLayout) {
    return (
      <TablePage header={header}>
        {body}
        {modals}
      </TablePage>
    );
  }

  return (
    <Stack gap={0}>
      {header}
      {body}
      {modals}
    </Stack>
  );
}
