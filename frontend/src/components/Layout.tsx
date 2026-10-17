import {
  Anchor,
  AppShell,
  Avatar,
  Box,
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
  IconHome,
  IconLogout,
  IconScissors,
  IconReceipt2,
  IconSettings,
  IconUserCircle,
  IconUsers,
} from "@tabler/icons-react";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useOperationalBranding } from "../hooks/useOperationalBranding";
import {
  DEV_BANNER_HEIGHT,
  DevEnvironmentBanner,
} from "./DevEnvironmentBanner";
import { withAlpha } from "../utils/theme.util";

interface LayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { icon: IconUsers, label: "Colaboradores", path: "/collaborators" },
  { icon: IconUserCircle, label: "Clientes", path: "/clients" },
  { icon: IconScissors, label: "Serviços", path: "/services" },
  { icon: IconCalendar, label: "Agendamentos", path: "/appointments" },
  { icon: IconChartBar, label: "Relatórios", path: "/financial-reports" },
  { icon: IconReceipt2, label: "Despesas", path: "/expenses" },
  { icon: IconSettings, label: "Configurações", path: "/settings" },
];

const BOTTOM_NAV_HEIGHT = 64;

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

  const devBannerOffset = import.meta.env.DEV ? DEV_BANNER_HEIGHT : 0;

  return (
    <>
      <DevEnvironmentBanner />
      <AppShell
        navbar={{
          width: 80,
          breakpoint: "sm",
          collapsed: { mobile: true },
        }}
        footer={{
          height: { base: 56, lg: 42 },
        }}
        styles={{
          navbar: {
            top: devBannerOffset,
            height: devBannerOffset
              ? `calc(100% - ${devBannerOffset}px)`
              : undefined,
          },
          main: {
            paddingTop: devBannerOffset ? devBannerOffset + 16 : undefined,
          },
        }}
      >
        {/* Navbar lateral — desktop */}
        <AppShell.Navbar
          p="md"
          style={{
            backgroundColor: "#ffffff",
            borderRight: "1px solid rgba(16,24,40,0.07)",
          }}
        >
          <Center mb="xl" mt={4}>
            {(() => {
              const isHome = location.pathname === "/";
              return (
                <Tooltip
                  label="Início"
                  position="right"
                  withArrow
                  transitionProps={{ duration: 0 }}
                >
                  <UnstyledButton
                    onClick={() => navigate("/")}
                    aria-label="Ir para o início"
                    style={{
                      position: "relative",
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingBlock: 8,
                      borderRadius: 18,
                      backgroundColor: isHome
                        ? withAlpha(branding.primaryColor, 0.16)
                        : "transparent",
                      transition: "all 160ms ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isHome) {
                        e.currentTarget.style.backgroundColor =
                          "var(--mantine-color-gray-1)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isHome) {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    {isHome && (
                      <span
                        style={{
                          position: "absolute",
                          left: -16,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: 5,
                          height: 40,
                          borderRadius: 4,
                          backgroundColor: branding.primaryColor,
                        }}
                      />
                    )}
                    <Avatar
                      src={branding.logoUrl || "/logo.png"}
                      size={46}
                      radius="lg"
                      style={{
                        boxShadow: "0 4px 12px rgba(16,24,40,0.10)",
                        cursor: "pointer",
                      }}
                    />
                  </UnstyledButton>
                </Tooltip>
              );
            })()}
          </Center>

          <Stack justify="center" gap={6} style={{ flex: 1 }}>
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
                      position: "relative",
                      width: "100%",
                      height: 46,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 14,
                      backgroundColor: isActive
                        ? withAlpha(branding.primaryColor, 0.12)
                        : "transparent",
                      color: isActive
                        ? branding.primaryColor
                        : "var(--mantine-color-gray-6)",
                      transition: "all 160ms ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor =
                          "var(--mantine-color-gray-1)";
                        e.currentTarget.style.color =
                          "var(--mantine-color-gray-9)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color =
                          "var(--mantine-color-gray-6)";
                      }
                    }}
                  >
                    {isActive && (
                      <span
                        style={{
                          position: "absolute",
                          left: -16,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: 4,
                          height: 24,
                          borderRadius: 4,
                          backgroundColor: branding.primaryColor,
                        }}
                      />
                    )}
                    <Icon size={22} stroke={isActive ? 2 : 1.6} />
                  </UnstyledButton>
                </Tooltip>
              );
            })}
          </Stack>

          <Box
            style={{
              borderTop: "1px solid var(--mantine-color-gray-2)",
              paddingTop: 10,
              marginTop: 10,
            }}
          >
            <Tooltip label="Sair" position="right" withArrow>
              <UnstyledButton
                onClick={handleLogout}
                style={{
                  width: "100%",
                  height: 46,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 14,
                  color: "var(--mantine-color-gray-6)",
                  transition: "all 160ms ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--mantine-color-red-0)";
                  e.currentTarget.style.color = "var(--mantine-color-red-6)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "var(--mantine-color-gray-6)";
                }}
              >
                <IconLogout size={22} stroke={1.6} />
              </UnstyledButton>
            </Tooltip>
          </Box>
        </AppShell.Navbar>

        <AppShell.Main
          style={{
            backgroundColor: "#f7f8fa",
            width: "100%",
            maxWidth: "100%",
            height: "100dvh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
          pt="md"
          pb="md"
        >
          {/* wrapper ocupa a altura disponível; padding inferior no mobile p/ bottom-nav */}
          <div
            className="app-main-inner"
            style={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
            }}
          >
            {children}
          </div>
        </AppShell.Main>

        {/* Rodapé — só desktop (no mobile há a bottom-nav) */}
        <AppShell.Footer
          py="xs"
          visibleFrom="sm"
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

      {/* Bottom navigation — só mobile */}
      <MobileBottomNav
        items={visibleNavigationItems}
        activePath={location.pathname}
        primaryColor={branding.primaryColor}
        onNavigate={navigate}
        onLogout={handleLogout}
      />
    </>
  );
}

interface MobileBottomNavProps {
  items: { icon: typeof IconHome; label: string; path: string }[];
  activePath: string;
  primaryColor: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

function MobileBottomNav({
  items,
  activePath,
  primaryColor,
  onNavigate,
  onLogout,
}: MobileBottomNavProps) {
  return (
    <Group
      hiddenFrom="sm"
      gap={0}
      wrap="nowrap"
      justify="space-around"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: BOTTOM_NAV_HEIGHT,
        backgroundColor: "#fff",
        borderTop: "1px solid #e9ecef",
        zIndex: 200,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activePath === item.path;
        return (
          <UnstyledButton
            key={item.path}
            onClick={() => onNavigate(item.path)}
            aria-label={item.label}
            style={{
              flex: 1,
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isActive ? primaryColor : "var(--mantine-color-gray-6)",
              backgroundColor: isActive
                ? withAlpha(primaryColor, 0.1)
                : "transparent",
            }}
          >
            <Icon size={24} stroke={isActive ? 2 : 1.6} />
          </UnstyledButton>
        );
      })}
      <UnstyledButton
        onClick={onLogout}
        aria-label="Sair"
        style={{
          flex: 1,
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--mantine-color-gray-6)",
        }}
      >
        <IconLogout size={24} stroke={1.6} />
      </UnstyledButton>
    </Group>
  );
}
