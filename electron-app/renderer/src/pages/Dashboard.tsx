import {
  Card,
  Container,
  Group,
  SimpleGrid,
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
  },
  {
    title: "Relatórios Financeiros",
    description: "Visualizar relatórios financeiros",
    icon: IconChartBar,
    path: "/financial-reports",
    color: "pink",
  },
];

export function Dashboard() {
  const navigate = useNavigate();
  const { data: collaborators } = useCollaborators();
  const { data: services } = useServices();
  const { data: appointments } = useAppointments();
  const { data: commissions } = useCommissions();

  const getCount = (path: string) => {
    switch (path) {
      case "/collaborators":
        return collaborators?.length || 0;
      case "/services":
        return services?.length || 0;
      case "/appointments":
        return appointments?.length || 0;
      case "/commissions":
        return commissions?.length || 0;
      case "/financial-reports":
        return null; // Não mostra contagem para relatórios
      default:
        return 0;
    }
  };

  return (
    <Container style={{ maxWidth: "95%" }} px={{ base: "xs", sm: "md" }}>
      <Group gap="md" mb="xl">
        <Title order={1} c="pink">
          Dashboard
        </Title>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
        {dashboardCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.path}
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              style={{ cursor: "pointer" }}
              onClick={() => navigate(card.path)}
            >
              <Group justify="space-between" mb="xs">
                <ThemeIcon color={card.color} size={40} radius="md">
                  <Icon size={24} />
                </ThemeIcon>
                {getCount(card.path) !== null && (
                  <Text size="xl" fw={700}>
                    {getCount(card.path)}
                  </Text>
                )}
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
    </Container>
  );
}
