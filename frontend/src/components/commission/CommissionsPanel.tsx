import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Checkbox,
  Divider,
  Group,
  MultiSelect,
  Pagination,
  Paper,
  SegmentedControl,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import { useDebouncedValue, useMediaQuery } from "@mantine/hooks";
import {
  IconCalendar,
  IconCalendarEvent,
  IconCheck,
  IconCurrencyDollar,
  IconFilter,
  IconFilterOff,
  IconLayoutList,
  IconSearch,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import { DateTime } from "luxon";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ConfirmModal } from "../ConfirmModal";
import { PeriodFilter } from "../PeriodFilter";
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
import {
  initialPeriodForMode,
  periodToDateRange,
  type Period,
} from "../../utils/period.util";
import { useOperationalBranding } from "../../hooks/useOperationalBranding";

/** Limite de itens carregados no modo "por dia" (período inteiro, sem paginar). */
const DAILY_VIEW_LIMIT = 500;
const ZONE = "America/Sao_Paulo";

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
  const { periodMode } = useOperationalBranding();
  const isMobile = useMediaQuery("(max-width: 48em)");

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
  const [period, setPeriod] = useState<Period>(() =>
    initialPeriodForMode(periodMode),
  );
  /** Modo de exibição da lista: comissão a comissão ou agrupada por dia. */
  const [viewMode, setViewMode] = useState<"list" | "daily">("list");
  const [markAsPaidModalOpened, setMarkAsPaidModalOpened] = useState(false);
  const [markAsUnpaidModalOpened, setMarkAsUnpaidModalOpened] = useState(false);

  useEffect(() => {
    setPage(1);
    setSelectedCommissions(new Set());
  }, [
    statusFilter,
    period,
    collaboratorFilter,
    debouncedSearchTerm,
    viewMode,
  ]);

  // No modo "por dia" carregamos o período inteiro (sem paginar) para que os
  // subtotais diários fiquem corretos. O volume por período/colaborador é baixo.
  const effectiveLimit =
    viewMode === "daily" ? DAILY_VIEW_LIMIT : COMMISSIONS_PAGE_SIZE;

  // Prepara os filtros para enviar ao backend
  const filters = useMemo(() => {
    const { startDate, endDate } = periodToDateRange(period);

    const filterObj: {
      paid?: boolean;
      startDate?: string;
      endDate?: string;
      collaboratorIds?: string[];
      search?: string;
      page: number;
      limit: number;
    } = {
      page: viewMode === "daily" ? 1 : page,
      limit: effectiveLimit,
      startDate,
      endDate,
    };

    // Status: pending/paid/all
    if (statusFilter === "pending") {
      filterObj.paid = false;
    } else if (statusFilter === "paid") {
      filterObj.paid = true;
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
    period,
    collaboratorFilter,
    debouncedSearchTerm,
    page,
    fixedCollaboratorId,
    viewMode,
    effectiveLimit,
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

  const commissionsToShow = useMemo(
    () => commissionsData?.items ?? [],
    [commissionsData?.items],
  );
  const totals = commissionsData?.summary ?? {
    totalAmount: 0,
    pendingAmount: 0,
    paidAmount: 0,
  };

  // Agrupa as comissões por dia (data do agendamento), para a visão diária.
  // Ordena do dia mais recente para o mais antigo; cada dia traz subtotais.
  const dailyGroups = useMemo(() => {
    if (viewMode !== "daily") return [];

    const map = new Map<
      string,
      {
        dateKey: string;
        servicesCount: number;
        totalAmount: number;
        paidAmount: number;
        pendingAmount: number;
      }
    >();

    for (const c of commissionsToShow) {
      const rawDate = c.scheduledService?.appointment?.date;
      const dateKey = rawDate
        ? DateTime.fromISO(rawDate, { zone: ZONE }).toFormat("yyyy-MM-dd")
        : "sem-data";

      const group =
        map.get(dateKey) ??
        {
          dateKey,
          servicesCount: 0,
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
        };

      const amount = toMoney(c.amount);
      group.servicesCount += 1;
      group.totalAmount += amount;
      if (c.paid) group.paidAmount += amount;
      else group.pendingAmount += amount;

      map.set(dateKey, group);
    }

    return Array.from(map.values()).sort((a, b) =>
      b.dateKey.localeCompare(a.dateKey),
    );
  }, [viewMode, commissionsToShow]);

  const totalPages = Math.max(
    1,
    Math.ceil((commissionsData?.total ?? 0) / COMMISSIONS_PAGE_SIZE),
  );

  const hasActiveFilters =
    statusFilter !== "pending" ||
    period.fortnight !== "full" ||
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
        {isMobile ? (
          <Stack gap="sm">
            <TextInput
              placeholder={
                isScoped ? "Buscar..." : "Buscar serviço, cliente..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
              leftSection={<IconSearch size={16} />}
            />
            {!isScoped && (
              <MultiSelect
                placeholder="Colaborador(es)"
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
              />
            )}
            <Group gap="sm" wrap="nowrap" align="center">
              <Select
                data={[
                  { value: "pending", label: "Pendentes" },
                  { value: "paid", label: "Pagas" },
                  { value: "all", label: "Todas" },
                ]}
                value={statusFilter}
                onChange={(value) =>
                  setStatusFilter(
                    (value as "pending" | "paid" | "all") || "pending",
                  )
                }
                allowDeselect={false}
                leftSection={<IconFilter size={16} />}
                style={{ flex: 1 }}
              />
              {hasActiveFilters && (
                <ActionIcon
                  variant="light"
                  color="gray"
                  size="lg"
                  onClick={() => {
                    setStatusFilter("pending");
                    setPeriod(initialPeriodForMode(periodMode));
                    setCollaboratorFilter([]);
                  }}
                  aria-label="Limpar filtros"
                >
                  <IconFilterOff size={18} />
                </ActionIcon>
              )}
            </Group>
            <Group justify="center">
              <PeriodFilter value={period} onChange={setPeriod} mode={periodMode} />
            </Group>
          </Stack>
        ) : (
          <Group align="flex-end" gap="sm" wrap="wrap">
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
                setStatusFilter(
                  (value as "pending" | "paid" | "all") || "pending",
                )
              }
              allowDeselect={false}
              leftSection={<IconFilter size={16} />}
              style={{ maxWidth: 160 }}
            />
            <PeriodFilter value={period} onChange={setPeriod} mode={periodMode} />
            {hasActiveFilters && (
              <ActionIcon
                variant="light"
                color="gray"
                onClick={() => {
                  setStatusFilter("pending");
                  setPeriod(initialPeriodForMode(periodMode));
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
        )}

        {/* Alternância de visualização: lista x agrupado por dia */}
        <SegmentedControl
          size="sm"
          value={viewMode}
          onChange={(v) => setViewMode(v as "list" | "daily")}
          data={[
            {
              value: "list",
              label: (
                <Group gap={6} wrap="nowrap">
                  <IconLayoutList size={16} />
                  <span>Lista</span>
                </Group>
              ),
            },
            {
              value: "daily",
              label: (
                <Group gap={6} wrap="nowrap">
                  <IconCalendarEvent size={16} />
                  <span>Por dia</span>
                </Group>
              ),
            },
          ]}
          style={{ alignSelf: isMobile ? "stretch" : "flex-start" }}
        />

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

  const dailyBody = (
    <Stack gap="sm">
      {dailyGroups.map((day) => {
        const label =
          day.dateKey === "sem-data"
            ? "Sem data"
            : DateTime.fromISO(day.dateKey, { zone: ZONE })
                .setLocale("pt-BR")
                .toFormat("cccc, dd 'de' LLLL");
        return (
          <Card key={day.dateKey} withBorder radius="md" padding="md">
            <Group justify="space-between" wrap="nowrap" align="flex-start">
              <Group gap={8} wrap="nowrap">
                <IconCalendarEvent
                  size={18}
                  color="var(--mantine-color-brand-6)"
                />
                <div>
                  <Text fw={600} size="sm" tt="capitalize">
                    {label}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {day.servicesCount} serviço(s)
                  </Text>
                </div>
              </Group>
              <div style={{ textAlign: "right" }}>
                <Text fw={700} c="brand">
                  {formatPrice(day.totalAmount)}
                </Text>
                <Group gap={6} justify="flex-end">
                  {day.pendingAmount > 0 && (
                    <Text size="xs" c="yellow.7">
                      {formatPrice(day.pendingAmount)} pend.
                    </Text>
                  )}
                  {day.paidAmount > 0 && (
                    <Text size="xs" c="green.7">
                      {formatPrice(day.paidAmount)} pago
                    </Text>
                  )}
                </Group>
              </div>
            </Group>
          </Card>
        );
      })}
      <Divider my={4} />
      <Group justify="flex-end" mb="sm">
        <Text size="sm" c="dimmed">
          {commissionsToShow.length} comissão(ões) em {dailyGroups.length}{" "}
          dia(s)
          {isFetching ? " · atualizando..." : ""}
        </Text>
      </Group>
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
      ) : viewMode === "daily" ? (
        dailyBody
      ) : (
        <>
          {isMobile ? (
            <Stack gap="sm">
              {commissionsToShow.map((commission) => (
                <Card
                  key={commission.id}
                  withBorder
                  radius="md"
                  padding="md"
                  style={{ opacity: commission.paid ? 0.7 : 1 }}
                >
                  <Stack gap={8}>
                    <Group justify="space-between" wrap="nowrap">
                      <Group gap="xs" wrap="nowrap">
                        {canManagePayments && (
                          <Checkbox
                            checked={selectedCommissions.has(commission.id)}
                            onChange={() =>
                              handleSelectCommission(commission.id)
                            }
                          />
                        )}
                        <Text fw={600} size="sm">
                          {commission.scheduledService?.service?.name || "-"}
                        </Text>
                      </Group>
                      <Badge
                        color={commission.paid ? "green" : "yellow"}
                        variant="light"
                      >
                        {commission.paid ? "Pago" : "Pendente"}
                      </Badge>
                    </Group>
                    {!isScoped && (
                      <Group gap={6}>
                        <IconUser size={14} />
                        <Text size="sm" c="dimmed">
                          {commission.collaborator?.name || "-"}
                        </Text>
                      </Group>
                    )}
                    {commission.scheduledService?.appointment && (
                      <Group gap={6}>
                        <IconCalendar size={14} />
                        <Text size="sm" c="dimmed">
                          {formatDate(
                            commission.scheduledService.appointment?.date || "",
                          )}
                          {commission.scheduledService.appointment?.clientName
                            ? ` · ${commission.scheduledService.appointment.clientName}`
                            : ""}
                        </Text>
                      </Group>
                    )}
                    <Group justify="space-between">
                      <Text size="xs" c="dimmed">
                        {toMoney(commission.percentage)}% de{" "}
                        {formatPrice(commission.scheduledService?.price ?? 0)}
                      </Text>
                      <Group gap={4}>
                        <IconCurrencyDollar size={14} />
                        <Text fw={700}>{formatPrice(commission.amount)}</Text>
                      </Group>
                    </Group>
                  </Stack>
                </Card>
              ))}
            </Stack>
          ) : (
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
          )}
          <Group
            justify={isMobile ? "center" : "space-between"}
            mt="md"
            mb="sm"
            wrap="wrap"
            gap="sm"
          >
            <Text size="sm" c="dimmed" ta={isMobile ? "center" : undefined} w={isMobile ? "100%" : undefined}>
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
