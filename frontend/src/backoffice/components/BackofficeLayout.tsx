import {
  Anchor,
  AppShell,
  Avatar,
  Center,
  Group,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import {
  IconBuildingStore,
  IconHome,
  IconLogout,
  IconUsers,
  IconWorld,
} from '@tabler/icons-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const navigationItems = [
  { icon: IconHome, label: 'Dashboard', path: '/backoffice' },
  { icon: IconWorld, label: 'Portais', path: '/backoffice/portals' },
  { icon: IconBuildingStore, label: 'Filiais', path: '/backoffice/tenants' },
  { icon: IconUsers, label: 'Usuários', path: '/backoffice/users' },
];

export function BackofficeLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAdminAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/backoffice/login', { replace: true });
  };

  const isActive = (path: string) => {
    if (path === '/backoffice') {
      return location.pathname === '/backoffice';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <AppShell
      navbar={{ width: 80, breakpoint: 'sm' }}
      footer={{ height: 35 }}
    >
      <AppShell.Navbar p="md" style={{ backgroundColor: '#1e1b4b' }}>
        <Center mb="xl">
          <Avatar src="/logo.png" size={48} radius="md" />
        </Center>

        <Stack justify="center" gap={0} style={{ flex: 1 }}>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Tooltip
                key={item.path}
                label={item.label}
                position="right"
                withArrow
                transitionProps={{ duration: 0 }}
              >
                <UnstyledButton
                  onClick={() => navigate(item.path)}
                  style={{
                    width: '100%',
                    height: 50,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    backgroundColor: active
                      ? 'rgba(99, 102, 241, 0.25)'
                      : 'transparent',
                    color: active ? '#a5b4fc' : '#c7d2fe',
                    transition:
                      'background-color 150ms ease, color 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor =
                        'rgba(99, 102, 241, 0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <Icon size={22} stroke={1.5} />
                </UnstyledButton>
              </Tooltip>
            );
          })}
        </Stack>

        <Tooltip label="Sair" position="right" withArrow>
          <UnstyledButton
            onClick={handleLogout}
            style={{
              width: '100%',
              height: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              color: '#c7d2fe',
            }}
          >
            <IconLogout size={22} stroke={1.5} />
          </UnstyledButton>
        </Tooltip>
      </AppShell.Navbar>

      <AppShell.Main
        style={{
          backgroundColor: '#0f172a',
          width: '100%',
          maxWidth: '100%',
          minHeight: '100vh',
        }}
        pt="md"
      >
        <Outlet />
      </AppShell.Main>

      <AppShell.Footer
        py="xs"
        style={{ backgroundColor: '#1e293b', borderTop: '1px solid #334155' }}
      >
        <Group justify="center" align="center" gap="md">
          {user?.email && (
            <Text size="sm" c="dimmed">
              {user.email}
            </Text>
          )}
          <Text size="sm" c="dimmed">
            Backoffice ·{' '}
            <Anchor
              href="https://fernnandez-dev.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              c="indigo"
              fw={500}
            >
              fernnnadez
            </Anchor>
          </Text>
        </Group>
      </AppShell.Footer>
    </AppShell>
  );
}
