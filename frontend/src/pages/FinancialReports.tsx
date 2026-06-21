import {
  Alert,
  Card,
  Container,
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
    <Container style={{ maxWidth: "95%" }} px={{ base: "xs", sm: "md" }}>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-end" wrap="wrap">
          <Title order={1} c="brand">
            Relatórios Financeiros
          </Title>

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
                    onChange={(value) =>
                      setReferenceDate(toReferenceDate(value))
                    }
                    valueFormat="MMMM [de] YYYY"
                    clearable={false}
                    style={{ minWidth: 220 }}
                  />
                  <Select
                    label="Quinzena"
                    data={FORTNIGHT_OPTIONS}
                    value={fortnightHalf}
                    onChange={(value) =>
                      setFortnightHalf((value as FortnightHalf) ?? "first")
                    }
                    allowDeselect={false}
                    style={{ minWidth: 220 }}
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
                  style={{ minWidth: 220 }}
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
          >
            Não foi possível carregar o relatório financeiro. Tente novamente.
          </Alert>
        )}

        {isLoading ? (
          <Group justify="center" py="xl">
            <Loader size="lg" />
          </Group>
        ) : (
          <>
            <Text size="lg" c="dimmed" mb="md">
              Relatório de {period.label}
            </Text>

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
              {cards.map((card) => {
                const Icon = card.icon;
                return (
                  <Card
                    key={card.title}
                    shadow="sm"
                    padding="lg"
                    radius="md"
                    withBorder
                  >
                    <Group justify="space-between" mb="xs">
                      <ThemeIcon color={card.color} size={40} radius="md">
                        <Icon size={24} />
                      </ThemeIcon>
                      <Text size="xl" fw={700} c={card.color}>
                        {formatPrice(card.value)}
                      </Text>
                    </Group>
                    <Text fw={500} size="lg" mb="xs">
                      {card.title}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {card.description}
                    </Text>
                  </Card>
                );
              })}
            </SimpleGrid>

            {report && (
              <Card shadow="sm" padding="lg" radius="md" withBorder mt="md">
                <Stack gap="xs">
                  <Text fw={600} size="md">
                    Resumo do Período
                  </Text>
                  <Text size="sm" c="dimmed">
                    Período:{" "}
                    {DateTime.fromISO(report.period.startDate, {
                      zone: SP_ZONE,
                    }).toFormat("dd/MM/yyyy")}{" "}
                    até{" "}
                    {DateTime.fromISO(report.period.endDate, {
                      zone: SP_ZONE,
                    }).toFormat("dd/MM/yyyy")}
                  </Text>
                </Stack>
              </Card>
            )}
          </>
        )}
      </Stack>
    </Container>
  );
}
