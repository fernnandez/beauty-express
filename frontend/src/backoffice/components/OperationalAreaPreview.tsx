import {
  Avatar,
  Box,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconCalendar,
  IconHome,
  IconScissors,
  IconUsers,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import type { LoginBranding } from '../../types/branding.types';
import { getNavbarBackground } from '../../utils/theme.util';

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function withAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return hex;
  }

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function resolveLogoSrc(logoUrl?: string | null): string {
  const trimmed = logoUrl?.trim();
  return trimmed || '/logo.png';
}

const previewNavItems = [
  { icon: IconHome, label: 'Dashboard', active: false },
  { icon: IconUsers, label: 'Colaboradores', active: false },
  { icon: IconCalendar, label: 'Agendamentos', active: true },
  { icon: IconScissors, label: 'Serviços', active: false },
];

export function OperationalAreaPreview({ branding }: { branding: LoginBranding }) {
  const logoSrc = resolveLogoSrc(branding.logoUrl);
  const [logoFailed, setLogoFailed] = useState(false);
  const navbarBg = getNavbarBackground(branding.accentColor);
  const activeBg = withAlpha(branding.primaryColor, 0.14);

  useEffect(() => {
    setLogoFailed(false);
  }, [logoSrc]);

  return (
    <Paper
      radius="md"
      withBorder
      style={{
        overflow: 'hidden',
        borderColor: '#e9ecef',
        backgroundColor: '#fefefe',
      }}
    >
      <Group align="stretch" gap={0} wrap="nowrap">
        <Stack
          gap={6}
          p={8}
          align="center"
          style={{
            width: 56,
            minHeight: 220,
            backgroundColor: navbarBg,
            borderRight: '1px solid #e9ecef',
          }}
        >
          <Avatar
            src={logoFailed ? undefined : logoSrc}
            alt={branding.displayName}
            size={36}
            radius="md"
            mb={4}
            imageProps={{ onError: () => setLogoFailed(true) }}
          >
            {(branding.displayName || '?').slice(0, 1).toUpperCase()}
          </Avatar>

          {previewNavItems.map(({ icon: Icon, label, active }) => (
            <Box
              key={label}
              title={label}
              style={{
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                backgroundColor: active ? activeBg : 'transparent',
                color: active ? branding.primaryColor : '#868e96',
              }}
            >
              <Icon size={18} stroke={1.5} />
            </Box>
          ))}
        </Stack>

        <Stack gap="sm" p="md" style={{ flex: 1, minWidth: 0 }}>
          <Stack gap={2}>
            <Title order={4} c={branding.primaryColor}>
              Agendamentos
            </Title>
            <Text size="xs" c="dimmed">
              {branding.displayName || 'Nome da filial'}
            </Text>
          </Stack>

          <Paper p="sm" radius="md" withBorder style={{ borderColor: '#f1f3f5' }}>
            <Group gap="sm" wrap="nowrap">
              <ThemeIcon
                size={32}
                radius="md"
                variant="light"
                color="brand"
                style={{
                  backgroundColor: activeBg,
                  color: branding.primaryColor,
                }}
              >
                <IconCalendar size={16} />
              </ThemeIcon>
              <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                <Text size="sm" fw={600} c="dark.7" lineClamp={1}>
                  Cliente exemplo
                </Text>
                <Text size="xs" c="dimmed">
                  14:00 · Manicure
                </Text>
              </Stack>
            </Group>
          </Paper>

          <Box
            py={6}
            style={{
              borderTop: '1px solid #e9ecef',
              marginTop: 'auto',
            }}
          >
            <Text size="xs" c="dimmed" ta="center">
              {branding.displayName || 'Nome da filial'}
            </Text>
          </Box>
        </Stack>
      </Group>

      {logoFailed && branding.logoUrl?.trim() && (
        <Text size="xs" c="red" ta="center" py={4} px="md">
          Não foi possível carregar o logo desta URL
        </Text>
      )}
    </Paper>
  );
}
