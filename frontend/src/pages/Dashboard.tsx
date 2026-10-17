import {
  Card,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconCalendar,
  IconChartBar,
  IconCurrencyDollar,
  IconScissors,
  IconUsers,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useAppointments } from "../hooks/useAppointments";
import { useCollaborators } from "../hooks/useCollaborators";
import { useCommissions } from "../hooks/useCommissions";
import { useOperationalBranding } from "../hooks/useOperationalBranding";
import { useServices } from "../hooks/useServices";

const dashboardCards = [
  {
    title: "Colaboradores",
    description: "Gerenciar colaboradores",
    icon: IconUsers,
    path: "/collaborators",
    color: "blue",
  },
  {
    title: "Serviços",
    description: "Gerenciar serviços",
    icon: IconScissors,
    path: "/services",
    color: "violet",
  },
  {
    title: "Agendamentos",
    description: "Gerenciar agendamentos",
    icon: IconCalendar,
    path: "/appointments",
    color: "green",
  },
  {
    title: "Comissões",
    description: "Visualizar comissões",
    icon: IconCurrencyDollar,
    path: "/commissions",
    color: "orange",
    requiresCommissions: true,
  },
  {
    title: "Relatórios Financeiros",
    description: "Visualizar relatórios financeiros",
    icon: IconChartBar,
    path: "/financial-reports",
    color: "brand",
  },
];

export function Dashboard() {
  const navigate = useNavigate();
  const { commissionsEnabled } = useOperationalBranding();
  const { data: collaborators } = useCollaborators();
  const { data: services } = useServices();
  const { data: appointments } = useAppointments();
  const { data: commissionsData } = useCommissions(
    { page: 1, limit: 1 },
    commissionsEnabled,
  );

  const visibleCards = dashboardCards.filter(
    (card) => !card.requiresCommissions || commissionsEnabled,
  );

  const getCount = (path: string) => {
    switch (path) {
      case "/collaborators":
        return collaborators?.length || 0;
      case "/services":
        return services?.length || 0;
      case "/appointments":
        return appointments?.length || 0;
      case "/commissions":
        return commissionsData?.total || 0;
      case "/financial-reports":
        return null; // Não mostra contagem para relatórios
      default:
        return 0;
    }
  };

  return (
    <Container fluid px={{ base: "xs", sm: "md" }}>
      <Stack gap={2} mb="xl">
        <Title order={1} c="brand" fz={{ base: 28, sm: 34 }}>
          Olá, bem-vindo 👋
        </Title>
        <Text c="dimmed">
          Aqui está um resumo rápido do seu negócio.
        </Text>
      </Stack>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
        {visibleCards.map((card) => {
          const Icon = card.icon;
          const count = getCount(card.path);
          return (
            <Card
              key={card.path}
              padding="xl"
              radius="lg"
              style={{
                cursor: "pointer",
                transition: "transform 160ms ease, box-shadow 160ms ease",
              }}
              onClick={() => navigate(card.path)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow =
                  "0 12px 32px rgba(16, 24, 40, 0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 2px 8px rgba(16, 24, 40, 0.06)";
              }}
            >
              <Group justify="space-between" align="flex-start" mb="md">
                <ThemeIcon
                  color={card.color}
                  size={52}
                  radius="md"
                  variant="light"
                >
                  <Icon size={26} />
                </ThemeIcon>
                {count !== null && (
                  <Text fz={28} fw={800} lh={1}>
                    {count}
                  </Text>
                )}
              </Group>
              <Text fw={700} size="lg">
                {card.title}
              </Text>
              <Text size="sm" c="dimmed">
                {card.description}
              </Text>
            </Card>
          );
        })}
      </SimpleGrid>
    </Container>
  );
}
