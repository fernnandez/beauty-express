import { Anchor, AppShell, Avatar, Group, NavLink, Text } from "@mantine/core";
import {
  IconCalendar,
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
];

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <AppShell
      navbar={{
        width: 240,
        breakpoint: "sm",
      }}
      footer={{
        height: 35,
      }}
    >
      <AppShell.Navbar p="md" style={{ backgroundColor: "#faf5ff" }}>
        <Group gap="sm" mb="xl">
          <Avatar src="/logo.png" size={40} radius="md" />
          <Text size="xl" fw={700} c="pink">
            Beauty Express
          </Text>
        </Group>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              label={item.label}
              leftSection={<Icon size={20} />}
              active={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              mb="xs"
              style={{
                borderRadius: "8px",
              }}
            />
          );
        })}
      </AppShell.Navbar>

      <AppShell.Main style={{ backgroundColor: "#fefefe" }} pt="md">
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
