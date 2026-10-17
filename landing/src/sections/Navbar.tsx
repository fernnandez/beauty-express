import { Box, Button, Container, Group, Text } from '@mantine/core'
import { IconBrandWhatsapp } from '@tabler/icons-react'
import { Link } from 'react-router-dom'
import { whatsappLink } from '../branding'
import { Logo } from '../components/Logo'

const links = [
  { label: 'O sistema', to: '/sistema' },
  { label: 'Funcionalidades', to: '/#funcionalidades' },
  { label: 'Roadmap', to: '/#roadmap' },
]

export function Navbar() {
  return (
    <Box
      component="header"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderBottom: '1px solid var(--mantine-color-gray-2)',
      }}
    >
      <Container size="lg" py="sm">
        <Group justify="space-between" wrap="nowrap">
          <Box component={Link} to="/" style={{ display: 'flex' }}>
            <Logo height={34} />
          </Box>

          <Group gap="lg" wrap="nowrap">
            <Group gap="lg" visibleFrom="sm">
              {links.map((link) => (
                <Text
                  key={link.to}
                  component={Link}
                  to={link.to}
                  size="sm"
                  fw={500}
                  c="dark.5"
                  style={{ textDecoration: 'none' }}
                >
                  {link.label}
                </Text>
              ))}
            </Group>

            <Button
              visibleFrom="xs"
              component="a"
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              leftSection={<IconBrandWhatsapp size={18} />}
            >
              Falar com vendas
            </Button>

            <Button
              hiddenFrom="xs"
              size="sm"
              px="md"
              component="a"
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              leftSection={<IconBrandWhatsapp size={16} />}
            >
              Vendas
            </Button>
          </Group>
        </Group>
      </Container>
    </Box>
  )
}
