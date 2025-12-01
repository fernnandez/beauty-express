import {
  Card,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
  ThemeIcon,
  Loader,
  Alert,
} from "@mantine/core";
import { MonthPickerInput } from "@mantine/dates";
import { IconAlertCircle, IconCurrencyDollar, IconTrendingUp, IconTrendingDown, IconReceipt, IconCash } from "@tabler/icons-react";
import { DateTime } from "luxon";
import { useMemo, useState } from "react";
import { useFinancialReports } from "../hooks/useFinancialReports";

function formatPrice(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getMonthName(month: number): string {
  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  return months[month - 1];
}

export function FinancialReports() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    new Date() // Inicia com o mês atual
  );

  // Usa Luxon para extrair ano e mês de forma segura
  const { year, month } = useMemo(() => {
    let currentDate: DateTime;
    
    if (selectedDate) {
      currentDate = DateTime.fromJSDate(selectedDate, { zone: "America/Sao_Paulo" });
      if (!currentDate.isValid) {
        currentDate = DateTime.now().setZone("America/Sao_Paulo");
      }
    } else {
      currentDate = DateTime.now().setZone("America/Sao_Paulo");
    }
    
    return {
      year: currentDate.year,
      month: currentDate.month, // Luxon usa 1-12
    };
  }, [selectedDate]);

  const { data: report, isLoading, error } = useFinancialReports(year, month);

  const cards = [
    {
      title: "Total Agendado",
      value: report?.totalScheduled ?? 0,
      icon: IconReceipt,
      color: "blue",
      description: "Valor total dos serviços agendados",
    },
    {
      title: "Serviços Pagos",
      value: report?.totalPaid ?? 0,
      icon: IconCash,
      color: "green",
      description: "Valor dos serviços já pagos",
    },
    {
      title: "Serviços Não Pagos",
      value: report?.totalUnpaid ?? 0,
      icon: IconTrendingDown,
      color: "orange",
      description: "Valor dos serviços pendentes",
    },
    {
      title: "Comissões Pagas",
      value: report?.totalCommissionsPaid ?? 0,
      icon: IconCurrencyDollar,
      color: "violet",
      description: "Total de comissões pagas",
    },
    {
      title: "Valor Líquido",
      value: report?.netAmount ?? 0,
      icon: IconTrendingUp,
      color: report?.netAmount && report.netAmount >= 0 ? "teal" : "red",
      description: "Valor líquido (pagos - comissões)",
    },
  ];

  return (
    <Container style={{ maxWidth: "95%" }} px={{ base: "xs", sm: "md" }}>
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Title order={1} c="pink">
            Relatórios Financeiros
          </Title>
          <MonthPickerInput
            label="Selecione o mês"
            placeholder="Escolha o mês"
            value={selectedDate}
            onChange={(value: string | null) => {
              // Garante que sempre temos um Date válido usando Luxon
              if (value) {
                const dateValue = DateTime.fromISO(value, {
                  zone: "America/Sao_Paulo",
                }).toJSDate();
                setSelectedDate(dateValue);
              } else {
                setSelectedDate(DateTime.now().setZone("America/Sao_Paulo").toJSDate());
              }
            }}
            valueFormat="MMMM [de] YYYY"
            locale="pt-BR"
            clearable={false}
            style={{ maxWidth: 300 }}
          />
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
              Relatório de {getMonthName(month)} de {year}
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
                      zone: "America/Sao_Paulo",
                    }).toFormat("dd/MM/yyyy")}{" "}
                    até{" "}
                    {DateTime.fromISO(report.period.endDate, {
                      zone: "America/Sao_Paulo",
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

