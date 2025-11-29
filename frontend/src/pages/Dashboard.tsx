import { Container, Title, SimpleGrid, Card, Text, Group, ThemeIcon, Avatar } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import {
  IconUsers,
  IconScissors,
  IconCalendar,
  IconCurrencyDollar,
} from '@tabler/icons-react';
import { useCollaborators } from '../hooks/useCollaborators';
import { useServices } from '../hooks/useServices';
import { useAppointments } from '../hooks/useAppointments';
import { useCommissions } from '../hooks/useCommissions';

const dashboardCards = [
  {
    title: 'Colaboradores',
    description: 'Gerenciar colaboradores',
    icon: IconUsers,
    path: '/collaborators',
    color: 'blue',
  },
  {
    title: 'Serviços',
    description: 'Gerenciar serviços',
    icon: IconScissors,
    path: '/services',
    color: 'violet',
  },
  {
    title: 'Agendamentos',
    description: 'Gerenciar agendamentos',
    icon: IconCalendar,
    path: '/appointments',
    color: 'green',
  },
  {
    title: 'Comissões',
    description: 'Visualizar comissões',
    icon: IconCurrencyDollar,
    path: '/commissions',
    color: 'orange',
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
      case '/collaborators':
        return collaborators?.length || 0;
      case '/services':
        return services?.length || 0;
      case '/appointments':
        return appointments?.length || 0;
      case '/commissions':
        return commissions?.length || 0;
      default:
        return 0;
    }
  };

  return (
    <Container size="xl">
      <Group gap="md" mb="xl">
        <Avatar src="/logo.png" size={48} radius="md" />
        <Title order={1} c="pink">Dashboard</Title>
      </Group>

      <SimpleGrid cols={{ base: 2, sm: 2, lg: 2 }} spacing="lg">
        {dashboardCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.path}
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(card.path)}
            >
              <Group justify="space-between" mb="xs">
                <ThemeIcon color={card.color} size={40} radius="md">
                  <Icon size={24} />
                </ThemeIcon>
                <Text size="xl" fw={700}>
                  {getCount(card.path)}
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
    </Container>
  );
}

