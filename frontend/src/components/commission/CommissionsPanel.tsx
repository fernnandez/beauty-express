import {
  ActionIcon,
  Accordion,
  Badge,
  Button,
  Checkbox,
  Divider,
  Group,
  MultiSelect,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useDebouncedValue, useMediaQuery } from "@mantine/hooks";
import {
  IconCalendarEvent,
  IconCheck,
  IconFilter,
  IconFilterOff,
  IconSearch,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import { DateTime } from "luxon";
import { useMemo, useState, type ReactNode } from "react";
import { ConfirmModal } from "../ConfirmModal";
import { PeriodFilter } from "../PeriodFilter";
import { TablePage } from "../TablePage";
import { useCollaborators } from "../../hooks/useCollaborators";
import {
  useCommissions,
  useMarkCommissionsAsPaid,
  useMarkCommissionsAsUnpaid,
} from "../../hooks/useCommissions";
import { useNotifications } from "../../hooks/useNotifications";
import { formatPrice, toMoney } from "../../utils/money.util";
import { countLabel, pluralize } from "../../utils/plural.util";
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
  const [statusFilter, setStatusFilter] = useState<"pending" | "paid" | "all">(
    "pending",
  );
  const [period, setPeriod] = useState<Period>(() =>
    initialPeriodForMode(periodMode),
  );
  const [markAsPaidModalOpened, setMarkAsPaidModalOpened] = useState(false);
  const [markAsUnpaidModalOpened, setMarkAsUnpaidModalOpened] = useState(false);

  // Reseta a seleção quando qualquer filtro muda, ajustando o estado durante o
  // render (padrão recomendado pelo React, sem useEffect/renders em cascata).
  const filtersKey = `${statusFilter}|${JSON.stringify(period)}|${collaboratorFilter}|${debouncedSearchTerm}`;
  const [lastFiltersKey, setLastFiltersKey] = useState(filtersKey);
  if (filtersKey !== lastFiltersKey) {
    setLastFiltersKey(filtersKey);
    setSelectedCommissions(new Set());
  }

  // Prepara os filtros para enviar ao backend. A visão é sempre agregada por
  // dia, então carregamos o período inteiro (sem paginar) para os subtotais
  // diários ficarem corretos. O volume por período/colaborador é baixo.
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
      page: 1,
      limit: DAILY_VIEW_LIMIT,
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
    const map = new Map<
      string,
      {
        dateKey: string;
        servicesCount: number;
        totalAmount: number;
        paidAmount: number;
        pendingAmount: number;
        items: typeof commissionsToShow;
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
          items: [] as typeof commissionsToShow,
        };

      const amount = toMoney(c.amount);
      group.servicesCount += 1;
      group.totalAmount += amount;
      if (c.paid) group.paidAmount += amount;
      else group.pendingAmount += amount;
      group.items.push(c);

      map.set(dateKey, group);
    }

    return Array.from(map.values()).sort((a, b) =>
      b.dateKey.localeCompare(a.dateKey),
    );
  }, [commissionsToShow]);

  const hasActiveFilters =
    statusFilter !== "pending" ||
    period.fortnight !== "full" ||
    (!isScoped && collaboratorFilter.length > 0);

  const handleSelectCommission = (id: string) => {
    const newSelected = new Set(selectedCommissions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCommissions(newSelected);
  };

  // Marca/desmarca todos os serviços de um dia de uma vez.
  const handleSelectDay = (ids: string[], select: boolean) => {
    const newSelected = new Set(selectedCommissions);
    for (const id of ids) {
      if (select) newSelected.add(id);
      else newSelected.delete(id);
    }
    setSelectedCommissions(newSelected);
  };

  const handleMarkAsPaid = async () => {
    if (selectedCommissions.size === 0) return;
    try {
      await markAsPaidMutation.mutateAsync(Array.from(selectedCommissions));
      showSuccess(
        `${countLabel(
          selectedCommissions.size,
          "comissão marcada",
          "comissões marcadas",
        )} como paga${pluralize(selectedCommissions.size, "", "s")}!`,
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
        `${countLabel(
          selectedCommissions.size,
          "comissão marcada",
          "comissões marcadas",
        )} como não paga${pluralize(selectedCommissions.size, "", "s")}!`,
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
                placeholder="Colaboradores"
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
                placeholder="Filtrar por colaboradores"
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
              {countLabel(
                selectedCommissions.size,
                "comissão selecionada",
                "comissões selecionadas",
              )}
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
      <Accordion variant="separated" radius="md" multiple>
        {dailyGroups.map((day) => {
          const label =
            day.dateKey === "sem-data"
              ? "Sem data"
              : DateTime.fromISO(day.dateKey, { zone: ZONE })
                  .setLocale("pt-BR")
                  .toFormat("cccc, dd 'de' LLLL");
          return (
            <Accordion.Item key={day.dateKey} value={day.dateKey}>
              <Accordion.Control
                icon={
                  <IconCalendarEvent
                    size={18}
                    color="var(--mantine-color-brand-6)"
                  />
                }
              >
                <Group
                  justify="space-between"
                  wrap="nowrap"
                  align="flex-start"
                  pr="sm"
                >
                  <Group gap="sm" wrap="nowrap" align="flex-start">
                    {canManagePayments &&
                      (() => {
                        const dayIds = day.items.map((c) => c.id);
                        const selectedCount = dayIds.filter((id) =>
                          selectedCommissions.has(id),
                        ).length;
                        const allDaySelected =
                          selectedCount === dayIds.length && dayIds.length > 0;
                        return (
                          <Checkbox
                            aria-label="Selecionar o dia inteiro"
                            checked={allDaySelected}
                            indeterminate={
                              selectedCount > 0 && !allDaySelected
                            }
                            onClick={(e) => e.stopPropagation()}
                            onChange={() =>
                              handleSelectDay(dayIds, !allDaySelected)
                            }
                            mt={2}
                          />
                        );
                      })()}
                    <div>
                      <Text fw={600} size="sm" tt="capitalize">
                        {label}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {countLabel(
                          day.servicesCount,
                          "serviço",
                          "serviços",
                        )}
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
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="xs">
                  {day.items.map((c) => (
                    <Group
                      key={c.id}
                      justify="space-between"
                      wrap="nowrap"
                      align="flex-start"
                    >
                      <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                        {canManagePayments && (
                          <Checkbox
                            aria-label="Selecionar comissão"
                            checked={selectedCommissions.has(c.id)}
                            onChange={() => handleSelectCommission(c.id)}
                            mt={2}
                          />
                        )}
                        <div style={{ minWidth: 0 }}>
                          <Text size="sm" fw={500} truncate>
                            {c.scheduledService?.service?.name ?? "Serviço"}
                          </Text>
                          <Text size="xs" c="dimmed" truncate>
                            {c.scheduledService?.appointment?.clientName ??
                              "Cliente"}
                            {!isScoped && c.collaborator?.name
                              ? ` · ${c.collaborator.name}`
                              : ""}
                          </Text>
                        </div>
                      </Group>
                      <Group gap={8} wrap="nowrap" align="center">
                        <Badge
                          size="sm"
                          color={c.paid ? "green" : "yellow"}
                          variant="light"
                        >
                          {c.paid ? "Pago" : "Pendente"}
                        </Badge>
                        <Text
                          size="sm"
                          fw={600}
                          style={{ whiteSpace: "nowrap" }}
                        >
                          {formatPrice(c.amount)}
                        </Text>
                      </Group>
                    </Group>
                  ))}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
      </Accordion>
      <Divider my={4} />
      <Group justify="flex-end" mb="sm">
        <Text size="sm" c="dimmed">
          {countLabel(
            commissionsToShow.length,
            "comissão",
            "comissões",
          )}{" "}
          em {countLabel(dailyGroups.length, "dia", "dias")}
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
      ) : (
        dailyBody
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
        message={`Tem certeza que deseja marcar ${countLabel(
          selectedCommissions.size,
          "comissão",
          "comissões",
        )} como paga${pluralize(selectedCommissions.size, "", "s")}?`}
        confirmLabel="Marcar como Pago"
        confirmColor="green"
        loading={markAsPaidMutation.isPending}
      />
      <ConfirmModal
        opened={markAsUnpaidModalOpened}
        onClose={() => setMarkAsUnpaidModalOpened(false)}
        onConfirm={handleMarkAsUnpaid}
        title="Marcar como Não Pago"
        message={`Tem certeza que deseja marcar ${countLabel(
          selectedCommissions.size,
          "comissão",
          "comissões",
        )} como não paga${pluralize(selectedCommissions.size, "", "s")}?`}
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
