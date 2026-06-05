import {
  Card,
  Container,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconBuildingStore,
  IconCalendar,
  IconScissors,
  IconUsers,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useAdminDashboard } from '../hooks/useAdminDashboard';

const statCards = [
  {
    key: 'tenants' as const,
    title: 'Filiais',
    icon: IconBuildingStore,
    color: 'indigo',
    path: '/backoffice/tenants',
  },
  {
    key: 'users' as const,
    title: 'Usuários',
    icon: IconUsers,
    color: 'violet',
    path: '/backoffice/users',
  },
  {
    key: 'collaborators' as const,
    title: 'Colaboradores',
    icon: IconUsers,
    color: 'blue',
    path: null,
  },
  {
    key: 'services' as const,
    title: 'Serviços',
    icon: IconScissors,
    color: 'grape',
    path: null,
  },
  {
    key: 'appointments' as const,
    title: 'Agendamentos',
    icon: IconCalendar,
    color: 'teal',
    path: null,
  },
];

export function BackofficeDashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useAdminDashboard();

  return (
    <Container style={{ maxWidth: '95%' }} px={{ base: 'xs', sm: 'md' }}>
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
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            {statCards.map((card) => {
              const Icon = card.icon;
              const count = stats?.[card.key] ?? 0;

              return (
                <Card
                  key={card.key}
                  padding="lg"
                  radius="md"
                  withBorder
                  style={{
                    borderColor: '#334155',
                    backgroundColor: '#1e293b',
                    cursor: card.path ? 'pointer' : 'default',
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
                    <ThemeIcon size={48} radius="md" color={card.color} variant="light">
                      <Icon size={24} />
                    </ThemeIcon>
                  </Group>
                </Card>
              );
            })}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  );
}
