import {
  Alert,
  Box,
  Card,
  Group,
  Loader,
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
  IconCash,
  IconCurrencyDollar,
  IconReceipt,
  IconTrendingDown,
  IconTrendingUp,
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

const COMMISSION_REPORT_CARD_TITLES = new Set([
  "Comissões Pagas",
  "Comissões Previstas",
  "Valor Líquido",
  "Valor Líquido Previsto",
]);

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

  const cards = useMemo(() => {
    const allCards = [
      {
        title: "Total Agendado",
        value: toMoney(report?.totalScheduled),
        icon: IconReceipt,
        color: "blue",
        description: "Valor total dos serviços agendados",
      },
      {
        title: "Serviços Pagos",
        value: toMoney(report?.totalPaid),
        icon: IconCash,
        color: "green",
        description: "Valor dos serviços já pagos",
      },
      {
        title: "Serviços Não Pagos",
        value: toMoney(report?.totalUnpaid),
        icon: IconTrendingDown,
        color: "orange",
        description: "Valor dos serviços pendentes",
      },
      {
        title: "Comissões Pagas",
        value: toMoney(report?.totalCommissionsPaid),
        icon: IconCurrencyDollar,
        color: "violet",
        description: "Total de comissões pagas",
      },
      {
        title: "Comissões Previstas",
        value: toMoney(report?.totalCommissionsExpected),
        icon: IconCurrencyDollar,
        color: "indigo",
        description: "Total de comissões previstas (pagas + não pagas)",
      },
      {
        title: "Valor Líquido",
        value: toMoney(report?.netAmount),
        icon: IconTrendingUp,
        color: toMoney(report?.netAmount) >= 0 ? "teal" : "red",
        description: "Valor líquido (pagos - comissões pagas)",
      },
      {
        title: "Valor Líquido Previsto",
        value: toMoney(report?.netAmountExpected),
        icon: IconTrendingUp,
        color: toMoney(report?.netAmountExpected) >= 0 ? "cyan" : "red",
        description: "Valor líquido previsto (pagos - todas as comissões)",
      },
    ];

    if (!commissionsEnabled) {
      return allCards.filter(
        (card) => !COMMISSION_REPORT_CARD_TITLES.has(card.title),
      );
    }

    return allCards;
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

        <Stack gap="sm" align="flex-end">
          <SegmentedControl
            value={periodType}
            onChange={(value) =>
              setPeriodType(value as FinancialReportPeriodType)
            }
            data={PERIOD_OPTIONS}
          />

          <Group align="flex-end" wrap="wrap">
            {periodType === "fortnight" && (
              <>
                <MonthPickerInput
                  label="Mês"
                  placeholder="Escolha o mês"
                  value={referenceDate}
                  onChange={(value) => setReferenceDate(toReferenceDate(value))}
                  valueFormat="MMMM [de] YYYY"
                  clearable={false}
                  style={{ minWidth: 200 }}
                />
                <Select
                  label="Quinzena"
                  data={FORTNIGHT_OPTIONS}
                  value={fortnightHalf}
                  onChange={(value) =>
                    setFortnightHalf((value as FortnightHalf) ?? "first")
                  }
                  allowDeselect={false}
                  style={{ minWidth: 200 }}
                />
              </>
            )}

            {periodType === "month" && (
              <MonthPickerInput
                label="Mês"
                placeholder="Escolha o mês"
                value={referenceDate}
                onChange={(value) => setReferenceDate(toReferenceDate(value))}
                valueFormat="MMMM [de] YYYY"
                clearable={false}
                style={{ minWidth: 200 }}
              />
            )}
          </Group>
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
            <Text fw={600} tt="uppercase" fz="xs" c="dimmed">
              Resumo de {period.label}
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
              {cards.map((card) => (
                <MetricCard
                  key={card.title}
                  icon={card.icon}
                  color={card.color}
                  title={card.title}
                  value={formatPrice(card.value)}
                  description={card.description}
                />
              ))}
            </SimpleGrid>
          </Stack>

          <ReportsCharts />
        </Stack>
      )}
    </Box>
  );
}

interface MetricCardProps {
  icon: typeof IconReceipt;
  color: string;
  title: string;
  value: string;
  description: string;
}

function MetricCard({
  icon: Icon,
  color,
  title,
  value,
  description,
}: MetricCardProps) {
  return (
    <Card
      padding="lg"
      radius="lg"
      shadow="sm"
      style={{
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
      <Group gap="md" wrap="nowrap" align="flex-start">
        <ThemeIcon color={color} size={48} radius="md" variant="light">
          <Icon size={24} />
        </ThemeIcon>
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            {title}
          </Text>
          <Text fz={24} fw={800} lh={1.1} c={color}>
            {value}
          </Text>
          <Text size="xs" c="dimmed">
            {description}
          </Text>
        </Stack>
      </Group>
    </Card>
  );
}
