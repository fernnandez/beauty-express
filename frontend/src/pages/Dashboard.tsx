import {
  Box,
  Card,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconCalendar,
  IconChartBar,
  IconReceipt2,
  IconScissors,
  IconSettings,
  IconUserCircle,
  IconUsers,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

const dashboardCards = [
  {
    title: "Colaboradores",
    description: "Gerenciar colaboradores",
    icon: IconUsers,
    path: "/collaborators",
    color: "blue",
  },
  {
    title: "Clientes",
    description: "Gerenciar clientes",
    icon: IconUserCircle,
    path: "/clients",
    color: "cyan",
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
    title: "Relatórios",
    description: "Relatórios financeiros",
    icon: IconChartBar,
    path: "/financial-reports",
    color: "brand",
  },
  {
    title: "Despesas",
    description: "Gerenciar despesas",
    icon: IconReceipt2,
    path: "/expenses",
    color: "red",
  },
  {
    title: "Configurações",
    description: "Personalizar o estabelecimento",
    icon: IconSettings,
    path: "/settings",
    color: "gray",
  },
];

export function Dashboard() {
  const navigate = useNavigate();

  const visibleCards = dashboardCards;

  return (
    <Box
      style={{ width: "100%", paddingInline: "var(--mantine-spacing-md)" }}
      pb="xl"
    >
      {/* Conteúdo centralizado com largura máxima confortável */}
      <Box style={{ maxWidth: 1100, marginInline: "auto" }}>
        <Stack gap={2} mb="xl">
          <Title order={1} c="brand" fz={{ base: 28, sm: 34 }}>
            Olá, bem-vindo 👋
          </Title>
          <Text c="dimmed">Aqui está um resumo rápido do seu negócio.</Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {visibleCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card
                key={card.path}
                padding="xl"
                radius="lg"
                withBorder
                style={{
                  cursor: "pointer",
                  border: "1px solid var(--mantine-color-gray-3)",
                  transition: "transform 160ms ease, box-shadow 160ms ease",
                }}
                onClick={() => navigate(card.path)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow =
                    "0 12px 32px rgba(16, 24, 40, 0.14)";
                  e.currentTarget.style.borderColor =
                    "var(--mantine-color-gray-4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor =
                    "var(--mantine-color-gray-3)";
                }}
              >
                <ThemeIcon
                  color={card.color}
                  size={52}
                  radius="md"
                  variant="light"
                  mb="md"
                >
                  <Icon size={26} />
                </ThemeIcon>
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
      </Box>
    </Box>
  );
}
