import {
  Alert,
  Box,
  Card,
  Group,
  Loader,
  Paper,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { MonthPickerInput } from "@mantine/dates";
import {
  IconAlertCircle,
  IconCurrencyDollar,
  IconPigMoney,
  IconReceipt,
  IconReceiptOff,
} from "@tabler/icons-react";
import { DateTime } from "luxon";
import { useMemo, useState } from "react";
import { useFinancialReports } from "../hooks/useFinancialReports";
import { ReportsCharts } from "../components/report/ReportsCharts";
import { useOperationalBranding } from "../hooks/useOperationalBranding";
import {
  type FinancialReportPeriodType,
  type FortnightHalf,
  resolveFinancialReportPeriod,
} from "../utils/financial-report-period.util";
import { formatPrice, toMoney } from "../utils/money.util";

const CATEGORY_LABELS: Record<string, string> = {
  aluguel: "Aluguel",
  contas: "Contas",
  salarios: "Salários",
  insumos: "Insumos",
  impostos: "Impostos",
  marketing: "Marketing",
  outros: "Outros",
};

const SP_ZONE = "America/Sao_Paulo";

const PERIOD_OPTIONS: { value: FinancialReportPeriodType; label: string }[] = [
  { value: "fortnight", label: "Quinzena" },
  { value: "month", label: "Mês" },
];

const FORTNIGHT_OPTIONS = [
  { value: "first", label: "1ª quinzena (1–15)" },
  { value: "second", label: "2ª quinzena (16–fim)" },
];

function toReferenceDate(value: string | Date | null): Date {
  if (!value) {
    return DateTime.now().setZone(SP_ZONE).toJSDate();
  }

  const parsed =
    typeof value === "string"
      ? DateTime.fromISO(value, { zone: SP_ZONE })
      : DateTime.fromJSDate(value, { zone: SP_ZONE });

  if (parsed.isValid) {
    return parsed.toJSDate();
  }

  return DateTime.now().setZone(SP_ZONE).toJSDate();
}

export function FinancialReports() {
  const { commissionsEnabled } = useOperationalBranding();
  const [periodType, setPeriodType] =
    useState<FinancialReportPeriodType>("month");
  const [referenceDate, setReferenceDate] = useState<Date>(() =>
    DateTime.now().setZone(SP_ZONE).toJSDate(),
  );
  const [fortnightHalf, setFortnightHalf] = useState<FortnightHalf>("first");

  const period = useMemo(
    () =>
      resolveFinancialReportPeriod(periodType, referenceDate, fortnightHalf),
    [periodType, referenceDate, fortnightHalf],
  );

  const { data: report, isLoading, error } = useFinancialReports(
    period.startDate,
    period.endDate,
  );

  const groups = useMemo(() => {
    const commissionsPending =
      (report?.totalCommissionsExpected ?? 0) -
      (report?.totalCommissionsPaid ?? 0);

    const allGroups = [
      {
        key: "services",
        title: "Serviços",
        icon: IconReceipt,
        color: "blue",
        highlight: {
          label: "Total agendado",
          value: toMoney(report?.totalScheduled),
        },
        items: [
          { label: "Pagos", value: toMoney(report?.totalPaid), color: "green" },
          {
            label: "Não pagos",
            value: toMoney(report?.totalUnpaid),
            color: "orange",
          },
        ],
      },
      {
        key: "commissions",
        title: "Comissões",
        icon: IconCurrencyDollar,
        color: "violet",
        requiresCommissions: true,
        highlight: {
          label: "Previstas",
          value: toMoney(report?.totalCommissionsExpected),
        },
        items: [
          {
            label: "Pagas",
            value: toMoney(report?.totalCommissionsPaid),
            color: "green",
          },
          { label: "Pendentes", value: commissionsPending, color: "yellow" },
        ],
      },
      {
        key: "expenses",
        title: "Despesas",
        icon: IconReceiptOff,
        color: "red",
        highlight: {
          label: "Total no período",
          value: toMoney(report?.totalExpenses),
        },
        items: Object.entries(report?.expensesByCategory ?? {})
          .sort((a, b) => b[1] - a[1])
          .map(([category, value]) => ({
            label: CATEGORY_LABELS[category] ?? category,
            value,
            color: "gray",
          })),
      },
      {
        key: "result",
        title: "Resultado",
        icon: IconPigMoney,
        color: (report?.netProfit ?? 0) >= 0 ? "teal" : "red",
        highlight: {
          label: "Lucro do período",
          value: toMoney(report?.netProfit),
        },
        items: [
          {
            label: "Líquido (sem despesas)",
            value: toMoney(report?.netAmount),
            color: "gray",
          },
          {
            label: "Líquido previsto",
            value: toMoney(report?.netAmountExpected),
            color: "gray",
            requiresCommissions: true,
          },
        ],
      },
    ];

    if (!commissionsEnabled) {
      return allGroups
        .filter((g) => !g.requiresCommissions)
        .map((g) => ({
          ...g,
          items: g.items.filter((i) => !("requiresCommissions" in i) || !i.requiresCommissions),
        }));
    }

    return allGroups;
  }, [report, commissionsEnabled]);

  return (
    <Box
      style={{ width: "100%", paddingInline: "var(--mantine-spacing-md)" }}
      pb="xl"
    >
      <Group justify="space-between" align="flex-end" wrap="wrap" mb="xl">
        <Stack gap={2}>
          <Title order={1} c="brand" fz={{ base: 28, sm: 34 }}>
            Relatórios
          </Title>
          <Text c="dimmed">
            Acompanhe o desempenho financeiro e a evolução do negócio.
          </Text>
        </Stack>
      </Group>

      {error && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Erro ao carregar relatório"
          color="red"
          mb="md"
        >
          Não foi possível carregar o relatório financeiro. Tente novamente.
        </Alert>
      )}

      {isLoading ? (
        <Group justify="center" py="xl">
          <Loader size="lg" />
        </Group>
      ) : (
        <Stack gap="xl">
          <Stack gap="md">
            <Paper
              withBorder
              radius="lg"
              p="md"
              style={{ border: "1px solid var(--mantine-color-gray-3)" }}
            >
              <Group justify="space-between" align="center" wrap="wrap" gap="md">
                <div>
                  <Text fw={700} fz="lg" tt="capitalize">
                    {period.label}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Resumo do período selecionado
                  </Text>
                </div>

                <Group align="center" wrap="wrap" gap="sm">
                  <SegmentedControl
                    value={periodType}
                    onChange={(value) =>
                      setPeriodType(value as FinancialReportPeriodType)
                    }
                    data={PERIOD_OPTIONS}
                  />
                  <MonthPickerInput
                    aria-label="Mês"
                    placeholder="Escolha o mês"
                    value={referenceDate}
                    onChange={(value) =>
                      setReferenceDate(toReferenceDate(value))
                    }
                    valueFormat="MMMM [de] YYYY"
                    clearable={false}
                    style={{ minWidth: 190 }}
                  />
                  {periodType === "fortnight" && (
                    <Select
                      aria-label="Quinzena"
                      data={FORTNIGHT_OPTIONS}
                      value={fortnightHalf}
                      onChange={(value) =>
                        setFortnightHalf((value as FortnightHalf) ?? "first")
                      }
                      allowDeselect={false}
                      style={{ minWidth: 180 }}
                    />
                  )}
                </Group>
              </Group>
            </Paper>

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
              {groups.map((group) => (
                <SummaryGroupCard key={group.key} group={group} />
              ))}
            </SimpleGrid>
          </Stack>

          <ReportsCharts />
        </Stack>
      )}
    </Box>
  );
}

interface SummaryItem {
  label: string;
  value: number;
  color?: string;
}

interface SummaryGroup {
  key: string;
  title: string;
  icon: typeof IconReceipt;
  color: string;
  highlight: { label: string; value: number };
  items: SummaryItem[];
}

function SummaryGroupCard({ group }: { group: SummaryGroup }) {
  const Icon = group.icon;
  return (
    <Card
      padding="lg"
      radius="lg"
      shadow="sm"
      withBorder
      style={{
        border: "1px solid var(--mantine-color-gray-3)",
        transition: "transform 160ms ease, box-shadow 160ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 32px rgba(16, 24, 40, 0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(16, 24, 40, 0.06)";
      }}
    >
      <Stack gap="sm">
        <Group gap="xs" wrap="nowrap" align="center">
          <ThemeIcon color={group.color} size={36} radius="md" variant="light">
            <Icon size={20} />
          </ThemeIcon>
          <Text size="sm" fw={600} tt="uppercase" c="dimmed">
            {group.title}
          </Text>
        </Group>

        <div>
          <Text size="xs" c="dimmed">
            {group.highlight.label}
          </Text>
          <Text fz={26} fw={800} lh={1.1} c={group.color}>
            {formatPrice(group.highlight.value)}
          </Text>
        </div>

        {group.items.length > 0 && (
          <Stack gap={6} pt={4} style={{ borderTop: "1px solid var(--mantine-color-gray-2)" }}>
            {group.items.map((item) => (
              <Group key={item.label} justify="space-between" gap="xs" wrap="nowrap">
                <Text size="sm" c="dimmed">
                  {item.label}
                </Text>
                <Text size="sm" fw={600} c={item.color}>
                  {formatPrice(item.value)}
                </Text>
              </Group>
            ))}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
