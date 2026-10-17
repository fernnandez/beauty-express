import { AreaChart, BarChart, LineChart } from "@mantine/charts";
import {
  Card,
  Group,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useState } from "react";
import {
  useReportTimeseries,
  useTopServices,
} from "../../hooks/useFinancialReports";
import type { ReportGranularity } from "../../services/financial-report.service";
import { formatPrice } from "../../utils/money.util";

export function ReportsCharts() {
  const [granularity, setGranularity] = useState<ReportGranularity>("semester");

  const { data: timeseries = [], isLoading: loadingSeries } =
    useReportTimeseries(granularity);
  const { data: topServices = [], isLoading: loadingTop } =
    useTopServices(granularity, 5);

  const topServicesData = topServices.map((s) => ({
    service: s.serviceName,
    Quantidade: s.quantity,
  }));

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center" wrap="wrap">
        <Title order={3}>Evolução</Title>
        <SegmentedControl
          value={granularity}
          onChange={(v) => setGranularity(v as ReportGranularity)}
          data={[
            { value: "semester", label: "Semestral" },
            { value: "year", label: "Anual" },
          ]}
        />
      </Group>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
        <ChartCard
          title="Agendamentos e serviços"
          subtitle="Quantidade por mês"
        >
          <AreaChart
            h={260}
            data={timeseries}
            dataKey="label"
            withLegend
            curveType="monotone"
            series={[
              { name: "appointmentsCount", label: "Agendamentos", color: "blue.6" },
              { name: "servicesCount", label: "Serviços", color: "teal.6" },
            ]}
            valueFormatter={(value) => String(value)}
          />
          {!loadingSeries && timeseries.length === 0 && <EmptyHint />}
        </ChartCard>

        <ChartCard title="Ticket médio" subtitle="Receita ÷ agendamentos, por mês">
          <LineChart
            h={260}
            data={timeseries}
            dataKey="label"
            curveType="monotone"
            series={[
              { name: "averageTicket", label: "Ticket médio", color: "grape.6" },
            ]}
            valueFormatter={(value) => formatPrice(value)}
          />
          {!loadingSeries && timeseries.length === 0 && <EmptyHint />}
        </ChartCard>

        <ChartCard title="Receita" subtitle="Receita dos serviços por mês">
          <AreaChart
            h={260}
            data={timeseries}
            dataKey="label"
            curveType="monotone"
            series={[{ name: "revenue", label: "Receita", color: "green.6" }]}
            valueFormatter={(value) => formatPrice(value)}
          />
          {!loadingSeries && timeseries.length === 0 && <EmptyHint />}
        </ChartCard>

        <ChartCard
          title="Serviços mais vendidos"
          subtitle="Top 5 por quantidade no período"
        >
          {!loadingTop && topServicesData.length === 0 ? (
            <EmptyHint />
          ) : (
            <BarChart
              h={260}
              data={topServicesData}
              dataKey="service"
              orientation="vertical"
              series={[{ name: "Quantidade", color: "indigo.6" }]}
              withLegend={false}
            />
          )}
        </ChartCard>
      </SimpleGrid>
    </Stack>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Card padding="lg" radius="lg" shadow="sm">
      <Stack gap="xs">
        <div>
          <Text fw={600}>{title}</Text>
          <Text size="xs" c="dimmed">
            {subtitle}
          </Text>
        </div>
        {children}
      </Stack>
    </Card>
  );
}

function EmptyHint() {
  return (
    <Text size="sm" c="dimmed" ta="center" py="xl">
      Sem dados no período.
    </Text>
  );
}
