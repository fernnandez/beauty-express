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
    description: "Equipe e acessos",
    icon: IconUsers,
    path: "/collaborators",
    color: "blue",
  },
  {
    title: "Clientes",
    description: "Base de clientes",
    icon: IconUserCircle,
    path: "/clients",
    color: "cyan",
  },
  {
    title: "Serviços",
    description: "Preços e comissões",
    icon: IconScissors,
    path: "/services",
    color: "violet",
  },
  {
    title: "Agendamentos",
    description: "Agenda e horários",
    icon: IconCalendar,
    path: "/appointments",
    color: "green",
  },
  {
    title: "Relatórios",
    description: "Receita e lucro",
    icon: IconChartBar,
    path: "/financial-reports",
    color: "brand",
  },
  {
    title: "Despesas",
    description: "Custos do negócio",
    icon: IconReceipt2,
    path: "/expenses",
    color: "red",
  },
  {
    title: "Configurações",
    description: "Preferências",
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

        <SimpleGrid cols={{ base: 2, sm: 2, lg: 3 }} spacing={{ base: "sm", sm: "lg" }}>
          {visibleCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card
                key={card.path}
                padding="lg"
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
                  size={44}
                  radius="md"
                  variant="light"
                  mb="sm"
                >
                  <Icon size={24} />
                </ThemeIcon>
                <Text fw={700} fz={{ base: "md", sm: "lg" }} lh={1.2}>
                  {card.title}
                </Text>
                <Text size="sm" c="dimmed" lineClamp={1}>
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
