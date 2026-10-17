import { AppShell, Group, Text, UnstyledButton } from "@mantine/core";
import { IconCalendar, IconCurrencyDollar, IconLogout } from "@tabler/icons-react";
import { useLocation, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useOperationalBranding } from "../hooks/useOperationalBranding";
import { withAlpha } from "../utils/theme.util";

const BOTTOM_NAV_HEIGHT = 64;

const navItems = [
  { icon: IconCalendar, label: "Agenda", path: "/" },
  { icon: IconCurrencyDollar, label: "Comissões", path: "/commissions" },
];

export function CollaboratorLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { branding } = useOperationalBranding();
  const primary = branding.primaryColor;

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <AppShell
      header={{ height: 56 }}
      footer={{ height: BOTTOM_NAV_HEIGHT }}
      padding="md"
      styles={{
        main: {
          backgroundColor: "var(--mantine-color-gray-0)",
          minHeight: "100vh",
        },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Text fw={700} c={primary} truncate>
            {branding.displayName}
          </Text>
          <UnstyledButton
            onClick={handleLogout}
            aria-label="Sair"
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            <IconLogout size={20} color="var(--mantine-color-gray-6)" />
          </UnstyledButton>
        </Group>
      </AppShell.Header>

      <AppShell.Main>{children}</AppShell.Main>

      <AppShell.Footer>
        <Group h="100%" gap={0} grow>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);
            return (
              <UnstyledButton
                key={item.path}
                onClick={() => navigate(item.path)}
                aria-label={item.label}
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  color: active ? primary : "var(--mantine-color-gray-6)",
                  backgroundColor: active ? withAlpha(primary, 0.1) : "transparent",
                }}
              >
                <Icon size={22} />
                <Text size="xs" fw={active ? 600 : 400}>
                  {item.label}
                </Text>
              </UnstyledButton>
            );
          })}
        </Group>
      </AppShell.Footer>
    </AppShell>
  );
}
