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
} from "@mantine/core";
import {
  IconCalendar,
  IconChartBar,
  IconCurrencyDollar,
  IconHome,
  IconLogout,
  IconScissors,
  IconUserCircle,
  IconUsers,
} from "@tabler/icons-react";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useOperationalBranding } from "../hooks/useOperationalBranding";
import { getNavbarBackground, withAlpha } from "../utils/theme.util";

interface LayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { icon: IconHome, label: "Dashboard", path: "/" },
  { icon: IconUsers, label: "Colaboradores", path: "/collaborators" },
  { icon: IconUserCircle, label: "Clientes", path: "/clients" },
  { icon: IconScissors, label: "Serviços", path: "/services" },
  { icon: IconCalendar, label: "Agendamentos", path: "/appointments" },
  {
    icon: IconCurrencyDollar,
    label: "Comissões",
    path: "/commissions",
    requiresCommissions: true,
  },
  { icon: IconChartBar, label: "Relatórios", path: "/financial-reports" },
];

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { branding, commissionsEnabled } = useOperationalBranding();

  const visibleNavigationItems = useMemo(
    () =>
      navigationItems.filter(
        (item) => !item.requiresCommissions || commissionsEnabled,
      ),
    [commissionsEnabled],
  );

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <AppShell
      navbar={{
        width: 80,
        breakpoint: "sm",
      }}
      footer={{
        height: 35,
      }}
    >
      <AppShell.Navbar
        p="md"
        style={{ backgroundColor: getNavbarBackground(branding.accentColor) }}
      >
        <Center mb="xl">
          <Avatar src={branding.logoUrl || "/logo.png"} size={48} radius="md" />
        </Center>

        <Stack justify="center" gap={0} style={{ flex: 1 }}>
          {visibleNavigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

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
                    width: "100%",
                    height: 50,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "8px",
                    backgroundColor: isActive
                      ? withAlpha(branding.primaryColor, 0.14)
                      : "transparent",
                    color: isActive
                      ? branding.primaryColor
                      : "var(--mantine-color-gray-7)",
                    transition:
                      "background-color 150ms ease, color 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor =
                        "var(--mantine-color-gray-1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "transparent";
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
              width: "100%",
              height: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "8px",
              color: "var(--mantine-color-gray-7)",
            }}
          >
            <IconLogout size={22} stroke={1.5} />
          </UnstyledButton>
        </Tooltip>
      </AppShell.Navbar>

      <AppShell.Main
        style={{
          backgroundColor: "#fefefe",
          width: "100%",
          maxWidth: "100%",
        }}
        pt="md"
      >
        {children}
      </AppShell.Main>

      <AppShell.Footer
        py="xs"
        style={{ backgroundColor: "#fff", borderTop: "1px solid #e9ecef" }}
      >
        <Group justify="center" align="center" gap="md">
          {(user?.tenantSettings?.branding.displayName || user?.tenantName) && (
            <Text size="sm" c="dimmed">
              {user?.tenantSettings?.branding.displayName || user?.tenantName}
            </Text>
          )}
          <Text size="sm" c="dimmed">
            Made by{" "}
            <Anchor
              href="https://fernnandez-dev.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              c={branding.primaryColor}
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
