import {
  ActionIcon,
  Badge,
  Card,
  Container,
  Group,
  Loader,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  IconBuildingStore,
  IconCalendar,
  IconCash,
  IconCurrencyDollar,
  IconEye,
  IconScissors,
  IconUsers,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { formatPrice, toMoney } from "../../utils/money.util";
import { useAdminDashboard } from "../hooks/useAdminDashboard";
import type { TenantDashboardRow } from "../../types/admin.types";

const cardStyle = {
  borderColor: "#334155",
  backgroundColor: "#1e293b",
};

const tableStyles = {
  th: { backgroundColor: "#1e293b", color: "#e2e8f0" },
  td: { backgroundColor: "#0f172a", color: "#f1f5f9" },
};

const kpiCards = [
  {
    key: "activeTenants" as const,
    title: "Filiais ativas",
    icon: IconBuildingStore,
    color: "indigo",
    format: "number" as const,
    path: "/backoffice/tenants",
  },
  {
    key: "appointmentsToday" as const,
    title: "Agendamentos hoje",
    icon: IconCalendar,
    color: "teal",
    format: "number" as const,
    path: null,
  },
  {
    key: "revenueThisMonth" as const,
    title: "Receita do mês",
    icon: IconCash,
    color: "green",
    format: "money" as const,
    path: null,
  },
  {
    key: "pendingCommissions" as const,
    title: "Comissões pendentes",
    icon: IconCurrencyDollar,
    color: "yellow",
    format: "money" as const,
    path: null,
  },
];

const inventoryCards = [
  {
    key: "tenants" as const,
    title: "Filiais",
    icon: IconBuildingStore,
    color: "indigo",
    path: "/backoffice/tenants",
  },
  {
    key: "users" as const,
    title: "Usuários",
    icon: IconUsers,
    color: "violet",
    path: "/backoffice/users",
  },
  {
    key: "collaborators" as const,
    title: "Colaboradores",
    icon: IconUsers,
    color: "blue",
    path: null,
  },
  {
    key: "services" as const,
    title: "Serviços",
    icon: IconScissors,
    color: "grape",
    path: null,
  },
  {
    key: "appointments" as const,
    title: "Agendamentos",
    icon: IconCalendar,
    color: "cyan",
    path: null,
  },
];

function formatStatValue(
  value: number | undefined,
  format: "number" | "money",
): string {
  if (value === undefined) return "—";
  return format === "money" ? formatPrice(toMoney(value)) : String(value);
}

export function BackofficeDashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useAdminDashboard();

  return (
    <Container style={{ maxWidth: "95%" }} px={{ base: "xs", sm: "md" }}>
      <Stack gap="xl" mb="xl">
        <Stack gap="xs">
          <Title order={1} c="indigo.3">
            Dashboard consolidado
          </Title>
          <Text c="dimmed">
            Visão geral de todas as filiais Maria Borboleta
          </Text>
        </Stack>

        {isLoading ? (
          <Group justify="center" py="xl">
            <Loader color="indigo" />
          </Group>
        ) : (
          <Stack gap="xl">
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
              {kpiCards.map((card) => {
                const Icon = card.icon;
                const value = stats?.[card.key];

                return (
                  <Card
                    key={card.key}
                    padding="lg"
                    radius="md"
                    withBorder
                    style={{
                      ...cardStyle,
                      cursor: card.path ? "pointer" : "default",
                    }}
                    onClick={() => card.path && navigate(card.path)}
                  >
                    <Group justify="space-between">
                      <Stack gap={4}>
                        <Text size="sm" c="dimmed">
                          {card.title}
                        </Text>
                        <Text size="xl" fw={700} c="white">
                          {formatStatValue(value, card.format)}
                        </Text>
                      </Stack>
                      <ThemeIcon
                        size={48}
                        radius="md"
                        color={card.color}
                        variant="light"
                      >
                        <Icon size={24} />
                      </ThemeIcon>
                    </Group>
                  </Card>
                );
              })}
            </SimpleGrid>

            <Stack gap="md">
              <Title order={3} c="indigo.3">
                Comparativo por filial
              </Title>
              <ScrollArea>
                <Table
                  highlightOnHover
                  withTableBorder
                  withColumnBorders
                  styles={tableStyles}
                >
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Filial</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Hoje</Table.Th>
                      <Table.Th>Receita do mês</Table.Th>
                      <Table.Th>Comissões pendentes</Table.Th>
                      <Table.Th>Colaboradores</Table.Th>
                      <Table.Th>Serviços</Table.Th>
                      <Table.Th w={60} />
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {stats?.byTenant.map((tenant: TenantDashboardRow) => (
                      <Table.Tr
                        key={tenant.tenantId}
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          navigate(`/backoffice/tenants/${tenant.tenantId}`)
                        }
                      >
                        <Table.Td>
                          <Stack gap={2}>
                            <Text size="sm" fw={500}>
                              {tenant.tenantName}
                            </Text>
                            <Text size="xs" ff="monospace" c="dimmed">
                              {tenant.slug}
                            </Text>
                          </Stack>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={tenant.isActive ? "green" : "gray"}>
                            {tenant.isActive ? "Ativa" : "Inativa"}
                          </Badge>
                        </Table.Td>
                        <Table.Td>{tenant.appointmentsToday}</Table.Td>
                        <Table.Td>
                          {formatPrice(toMoney(tenant.revenueThisMonth))}
                        </Table.Td>
                        <Table.Td>
                          {formatPrice(toMoney(tenant.pendingCommissions))}
                        </Table.Td>
                        <Table.Td>{tenant.collaborators}</Table.Td>
                        <Table.Td>{tenant.services}</Table.Td>
                        <Table.Td onClick={(event) => event.stopPropagation()}>
                          <Tooltip label="Ver detalhes">
                            <ActionIcon
                              variant="subtle"
                              color="indigo"
                              onClick={() =>
                                navigate(
                                  `/backoffice/tenants/${tenant.tenantId}`,
                                )
                              }
                            >
                              <IconEye size={18} />
                            </ActionIcon>
                          </Tooltip>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Stack>

            <Stack gap="md">
              <Title order={3} c="indigo.3">
                Inventário da plataforma
              </Title>
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {inventoryCards.map((card) => {
                  const Icon = card.icon;
                  const count = stats?.[card.key] ?? 0;

                  return (
                    <Card
                      key={card.key}
                      padding="lg"
                      radius="md"
                      withBorder
                      style={{
                        ...cardStyle,
                        cursor: card.path ? "pointer" : "default",
                      }}
                      onClick={() => card.path && navigate(card.path)}
                    >
                      <Group justify="space-between">
                        <Stack gap={4}>
                          <Text size="sm" c="dimmed">
                            {card.title}
                          </Text>
                          <Text size="xl" fw={700} c="white">
                            {count}
                          </Text>
                        </Stack>
                        <ThemeIcon
                          size={48}
                          radius="md"
                          color={card.color}
                          variant="light"
                        >
                          <Icon size={24} />
                        </ThemeIcon>
                      </Group>
                    </Card>
                  );
                })}
              </SimpleGrid>
            </Stack>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
