import { Box, Container, Group, List, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { IconCheck, IconDeviceMobile } from '@tabler/icons-react'
import { PhoneFrame } from '../components/PhoneFrame'
import { brand } from '../branding'

const phones = [
  { src: '/demo-mobile/agenda.png', alt: 'Agenda no celular' },
  { src: '/demo-mobile/dashboard.png', alt: 'Painel no celular' },
  { src: '/demo-mobile/relatorios.png', alt: 'Relatórios no celular' },
]

const bullets = [
  'Instale como app e abra em tela cheia',
  'Cada profissional vê a própria agenda e comissões',
  'Navegação pensada para a tela do celular',
]

export function MobileApp() {
  return (
    <Box bg="brand.0" py={{ base: 48, sm: 80 }} style={{ overflow: 'hidden' }}>
      <Container size="lg">
        <Group justify="center" gap={6} mb="xs">
          <ThemeIcon variant="light" color="brand" radius="xl" size="md">
            <IconDeviceMobile size={16} />
          </ThemeIcon>
          <Text tt="uppercase" fw={700} c="brand.7" size="sm">
            No celular
          </Text>
        </Group>
        <Title order={2} fz={{ base: 28, sm: 40 }} ta="center" mb="xs">
          O sistema na palma da mão
        </Title>
        <Text c="dimmed" ta="center" maw={620} mx="auto" mb={48}>
          O {brand.productName} funciona no computador e no celular. Gerencie o seu negócio de onde
          estiver, sem instalar nada.
        </Text>

        {/* Desktop: celulares em leque + texto */}
        <Group justify="center" align="center" gap={64} visibleFrom="md">
          <Group gap="md" style={{ perspective: 1000 }}>
            <Box style={{ transform: 'rotate(-6deg) translateY(10px)' }}>
              <PhoneFrame src={phones[0].src} alt={phones[0].alt} width={250} />
            </Box>
            <Box style={{ zIndex: 2 }}>
              <PhoneFrame src={phones[1].src} alt={phones[1].alt} width={270} />
            </Box>
            <Box style={{ transform: 'rotate(6deg) translateY(10px)' }}>
              <PhoneFrame src={phones[2].src} alt={phones[2].alt} width={250} />
            </Box>
          </Group>
        </Group>

        {/* Mobile: um celular central + bullets */}
        <Stack align="center" gap="xl" hiddenFrom="md">
          <PhoneFrame src={phones[1].src} alt={phones[1].alt} width={240} />
          <List
            spacing="sm"
            icon={
              <ThemeIcon color="brand" variant="filled" size={22} radius="xl">
                <IconCheck size={14} />
              </ThemeIcon>
            }
          >
            {bullets.map((b) => (
              <List.Item key={b}>{b}</List.Item>
            ))}
          </List>
        </Stack>

        {/* Desktop: bullets abaixo, centralizados */}
        <Group justify="center" mt={48} visibleFrom="md">
          <List
            spacing="sm"
            icon={
              <ThemeIcon color="brand" variant="filled" size={22} radius="xl">
                <IconCheck size={14} />
              </ThemeIcon>
            }
            style={{ display: 'flex', gap: 32 }}
          >
            {bullets.map((b) => (
              <List.Item key={b}>{b}</List.Item>
            ))}
          </List>
        </Group>
      </Container>
    </Box>
  )
}
