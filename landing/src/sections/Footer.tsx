import { Box, Container, Group, Stack, Text } from '@mantine/core'
import { brand } from '../branding'
import { Logo } from '../components/Logo'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <Box
      component="footer"
      bg="brand.0"
      py="xl"
      style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}
    >
      <Container size="lg">
        {/* Desktop: logo e copyright nas pontas */}
        <Group justify="space-between" align="center" visibleFrom="sm">
          <Logo height={36} />
          <Text size="sm" c="dimmed">
            © {year} {brand.productName}. Todos os direitos reservados.
          </Text>
        </Group>

        {/* Mobile: empilhado e centralizado */}
        <Stack align="center" gap="sm" hiddenFrom="sm">
          <Logo height={32} />
          <Text size="xs" c="dimmed" ta="center">
            © {year} {brand.productName}. Todos os direitos reservados.
          </Text>
        </Stack>
      </Container>
    </Box>
  )
}
