import { Anchor, AppShell, Avatar, Center, Group, Stack, Text, Tooltip, UnstyledButton } from "@mantine/core";
import {
  IconCalendar,
  IconChartBar,
  IconCurrencyDollar,
  IconHome,
  IconScissors,
  IconUsers,
} from "@tabler/icons-react";
import { useLocation, useNavigate } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { icon: IconHome, label: "Dashboard", path: "/" },
  { icon: IconUsers, label: "Colaboradores", path: "/collaborators" },
  { icon: IconScissors, label: "Serviços", path: "/services" },
  { icon: IconCalendar, label: "Agendamentos", path: "/appointments" },
  { icon: IconCurrencyDollar, label: "Comissões", path: "/commissions" },
  { icon: IconChartBar, label: "Relatórios", path: "/financial-reports" },
];

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

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
      <AppShell.Navbar p="md" style={{ backgroundColor: "#faf5ff" }}>
        <Center mb="xl">
          <Avatar src="/logo.png" size={48} radius="md" />
        </Center>

        <Stack justify="center" gap={0}>
          {navigationItems.map((item) => {
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
                    backgroundColor: isActive ? "var(--mantine-color-pink-0)" : "transparent",
                    color: isActive ? "var(--mantine-color-pink-6)" : "var(--mantine-color-gray-7)",
                    transition: "background-color 150ms ease, color 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "var(--mantine-color-gray-1)";
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
        <Group justify="center" align="center">
          <Text size="sm" c="dimmed">
            Made by{" "}
            <Anchor
              href="https://fernnandez-dev.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              c="pink"
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
