import { Box, Text } from '@mantine/core';

export function DevEnvironmentBanner() {
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <Box
      component="header"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        backgroundColor: '#e03131',
        color: '#fff',
        textAlign: 'center',
        padding: '8px 16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        pointerEvents: 'none',
      }}
    >
      <Text size="xs" fw={700} tt="uppercase" lh={1.4}>
        Ambiente de desenvolvimento — dados fictícios para demonstração
      </Text>
      <Text size="xs" lh={1.4} opacity={0.95}>
        Maria Borboleta · Beauty Express · localhost
      </Text>
    </Box>
  );
}

export const DEV_BANNER_HEIGHT = 52;
