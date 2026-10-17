import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import {
  IconChevronLeft,
  IconChevronRight,
  IconCoin,
  IconPlus,
  IconReceipt2,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { DateTime } from "luxon";
import { useMemo, useState } from "react";
import { ConfirmModal } from "../components/ConfirmModal";
import { RowActions } from "../components/RowActions";
import { TablePage } from "../components/TablePage";
import { ExpenseFormModal } from "../components/expense/ExpenseFormModal";
import { useDeleteExpense, useExpenses } from "../hooks/useExpenses";
import { useNotifications } from "../hooks/useNotifications";
import type { Expense, ExpenseCategory } from "../types";
import { formatPrice } from "../utils/money.util";
import {
  expenseIncidesInMonth,
  monthLabelFrom,
} from "../utils/period.util";

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  aluguel: "Aluguel",
  contas: "Contas",
  salarios: "Salários",
  insumos: "Insumos",
  impostos: "Impostos",
  marketing: "Marketing",
  outros: "Outros",
};

function formatRecurrence(expense: Expense): string {
  if (expense.type === "recurring") {
    return `Todo dia ${expense.dayOfMonth}`;
  }
  if (expense.date) {
    return DateTime.fromISO(expense.date, {
      zone: "America/Sao_Paulo",
    }).toFormat("dd/MM/yyyy");
  }
  return "-";
}

export function Expenses() {
  const { data: expenses, isLoading } = useExpenses();
  const deleteMutation = useDeleteExpense();
  const { showSuccess, showError } = useNotifications();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebouncedValue(searchTerm, 300);
  const [typeFilter, setTypeFilter] = useState<"all" | "one_time" | "recurring">(
    "all",
  );
  const [refMonth, setRefMonth] = useState(() => {
    const now = DateTime.now().setZone("America/Sao_Paulo");
    return { year: now.year, month: now.month };
  });
  const [formOpened, setFormOpened] = useState(false);
  const [deleteOpened, setDeleteOpened] = useState(false);
  const [selected, setSelected] = useState<Expense | null>(null);

  const shiftRefMonth = (delta: number) => {
    const dt = DateTime.fromObject(
      { year: refMonth.year, month: refMonth.month, day: 1 },
      { zone: "America/Sao_Paulo" },
    ).plus({ months: delta });
    setRefMonth({ year: dt.year, month: dt.month });
  };

  const filtered = useMemo(() => {
    let list = expenses ?? [];
    // Incidência no mês selecionado: recorrentes vigentes repetem;
    // esporádicas só no mês da sua data.
    list = list.filter((e) =>
      expenseIncidesInMonth(e, refMonth.year, refMonth.month),
    );
    if (typeFilter !== "all") {
      list = list.filter((e) => e.type === typeFilter);
    }
    const term = debouncedSearch.trim().toLowerCase();
    if (term) {
      list = list.filter((e) => e.description.toLowerCase().includes(term));
    }
    return list;
  }, [expenses, typeFilter, debouncedSearch, refMonth]);

  const total = filtered.reduce((sum, e) => sum + Number(e.amount), 0);

  const handleCreate = () => {
    setSelected(null);
    setFormOpened(true);
  };

  const handleEdit = (expense: Expense) => {
    setSelected(expense);
    setFormOpened(true);
  };

  const handleDelete = (expense: Expense) => {
    setSelected(expense);
    setDeleteOpened(true);
  };

  const confirmDelete = async () => {
    if (!selected) return;
    try {
      await deleteMutation.mutateAsync(selected.id);
      showSuccess("Despesa excluída!");
      setDeleteOpened(false);
      setSelected(null);
    } catch {
      showError("Erro ao excluir a despesa");
    }
  };

  return (
    <TablePage
      header={
        <Stack gap="md" mb="md">
          <Group justify="space-between" wrap="wrap">
            <Stack gap={2}>
              <Title order={1} c="brand">
                Despesas
              </Title>
              <Text c="dimmed">
                Cadastre despesas fixas e esporádicas do seu negócio.
              </Text>
            </Stack>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={handleCreate}
              color="brand"
              size="md"
            >
              Nova Despesa
            </Button>
          </Group>

          <Group justify="space-between" wrap="wrap" gap="sm">
            <Group gap="sm" wrap="nowrap">
              <Group gap={4} wrap="nowrap">
                <ActionIcon
                  variant="light"
                  color="gray"
                  onClick={() => shiftRefMonth(-1)}
                  aria-label="Mês anterior"
                >
                  <IconChevronLeft size={18} />
                </ActionIcon>
                <Text
                  fw={500}
                  tt="capitalize"
                  style={{ minWidth: 140, textAlign: "center" }}
                >
                  {monthLabelFrom(refMonth.year, refMonth.month)}
                </Text>
                <ActionIcon
                  variant="light"
                  color="gray"
                  onClick={() => shiftRefMonth(1)}
                  aria-label="Próximo mês"
                >
                  <IconChevronRight size={18} />
                </ActionIcon>
              </Group>
              <SegmentedControl
                value={typeFilter}
                onChange={(v) =>
                  setTypeFilter(v as "all" | "one_time" | "recurring")
                }
                data={[
                  { value: "all", label: "Todas" },
                  { value: "recurring", label: "Fixas" },
                  { value: "one_time", label: "Esporádicas" },
                ]}
              />
            </Group>
            <TextInput
              placeholder="Buscar por descrição..."
              leftSection={<IconSearch size={16} />}
              rightSection={
                searchTerm && (
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    onClick={() => setSearchTerm("")}
                    size="sm"
                  >
                    <IconX size={16} />
                  </ActionIcon>
                )
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
              style={{ flex: 1, maxWidth: 320 }}
            />
          </Group>

          <SimpleGrid cols={{ base: 2, sm: 2 }} spacing="md" maw={520}>
            <StatCard
              icon={<IconReceipt2 size={22} />}
              color="blue"
              label="Despesas no mês"
              value={String(filtered.length)}
            />
            <StatCard
              icon={<IconCoin size={22} />}
              color="red"
              label="Total do mês"
              value={formatPrice(total)}
            />
          </SimpleGrid>
        </Stack>
      }
    >
      {isLoading ? (
        <Text>Carregando...</Text>
      ) : filtered.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          Nenhuma despesa neste mês
        </Text>
      ) : (
        <Table striped highlightOnHover miw={720}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Descrição</Table.Th>
              <Table.Th>Categoria</Table.Th>
              <Table.Th>Tipo</Table.Th>
              <Table.Th>Recorrência</Table.Th>
              <Table.Th>Valor</Table.Th>
              <Table.Th>Ações</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filtered.map((expense) => (
              <Table.Tr key={expense.id}>
                <Table.Td>{expense.description}</Table.Td>
                <Table.Td>{CATEGORY_LABELS[expense.category]}</Table.Td>
                <Table.Td>
                  <Badge
                    variant="light"
                    color={expense.type === "recurring" ? "blue" : "gray"}
                  >
                    {expense.type === "recurring" ? "Fixa" : "Esporádica"}
                  </Badge>
                </Table.Td>
                <Table.Td>{formatRecurrence(expense)}</Table.Td>
                <Table.Td>
                  <Text fw={500}>{formatPrice(expense.amount)}</Text>
                </Table.Td>
                <Table.Td>
                  <RowActions
                    onEdit={() => handleEdit(expense)}
                    onDelete={() => handleDelete(expense)}
                  />
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <ExpenseFormModal
        opened={formOpened}
        onClose={() => {
          setFormOpened(false);
          setSelected(null);
        }}
        expense={selected}
      />

      <ConfirmModal
        opened={deleteOpened}
        onClose={() => {
          setDeleteOpened(false);
          setSelected(null);
        }}
        onConfirm={confirmDelete}
        title="Excluir Despesa"
        message={`Tem certeza que deseja excluir "${selected?.description}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        confirmColor="red"
        loading={deleteMutation.isPending}
      />
    </TablePage>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: string;
}

function StatCard({ icon, color, label, value }: StatCardProps) {
  return (
    <Card
      padding="md"
      radius="lg"
      shadow="sm"
      withBorder
      style={{ border: "1px solid var(--mantine-color-gray-3)" }}
    >
      <Group gap="sm" wrap="nowrap" align="center">
        <ThemeIcon color={color} size={44} radius="md" variant="light">
          {icon}
        </ThemeIcon>
        <Stack gap={0}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            {label}
          </Text>
          <Text fz={22} fw={800} lh={1.1} c={color}>
            {value}
          </Text>
        </Stack>
      </Group>
    </Card>
  );
}
