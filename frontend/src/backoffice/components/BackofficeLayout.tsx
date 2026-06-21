import {
  Anchor,
  AppShell,
  Center,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import {
  IconBuildingStore,
  IconCalendarEvent,
  IconHome,
  IconLogout,
  IconUsers,
  IconWorld,
} from '@tabler/icons-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import {
  BACKOFFICE_NAME,
  backofficeColors,
} from '../utils/backoffice-theme.util';

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
      <AppShell.Navbar p="md" style={{ backgroundColor: backofficeColors.navbar }}>
        <Center mb="xl">
          <Tooltip label={BACKOFFICE_NAME} position="right" withArrow>
            <ThemeIcon size={48} radius="md" color="gray" variant="light">
              <IconCalendarEvent size={26} stroke={1.5} />
            </ThemeIcon>
          </Tooltip>
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
                      ? backofficeColors.navActiveBg
                      : 'transparent',
                    color: active
                      ? backofficeColors.navTextActive
                      : backofficeColors.navText,
                    transition:
                      'background-color 150ms ease, color 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor =
                        backofficeColors.navHoverBg;
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
              color: backofficeColors.navText,
            }}
          >
            <IconLogout size={22} stroke={1.5} />
          </UnstyledButton>
        </Tooltip>
      </AppShell.Navbar>

      <AppShell.Main
        style={{
          backgroundColor: backofficeColors.bg,
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
        style={{
          backgroundColor: backofficeColors.surface,
          borderTop: `1px solid ${backofficeColors.border}`,
        }}
      >
        <Group justify="center" align="center" gap="md">
          {user?.email && (
            <Text size="sm" c="dimmed">
              {user.email}
            </Text>
          )}
          <Text size="sm" c="dimmed">
            {BACKOFFICE_NAME} ·{' '}
            <Anchor
              href="https://fernnandez-dev.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              c="gray.4"
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
