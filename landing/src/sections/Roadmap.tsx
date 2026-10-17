import { Badge, Card, Container, Grid, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { IconBrandWhatsapp, IconUserCircle, IconSparkles, type IconProps } from '@tabler/icons-react'
import type { ComponentType } from 'react'

type RoadmapItem = {
  icon: ComponentType<IconProps>
  title: string
  description: string
}

const items: RoadmapItem[] = [
  {
    icon: IconUserCircle,
    title: 'Perfil do profissional',
    description:
      'Cada colaborador acessa a própria agenda e acompanha as suas comissões em tempo real, sem depender do gestor.',
  },
  {
    icon: IconBrandWhatsapp,
    title: 'Integração com WhatsApp',
    description:
      'Comunicação com clientes diretamente pelo WhatsApp Web — confirmações e lembretes de agendamento sem sair do fluxo.',
  },
  {
    icon: IconSparkles,
    title: 'E muito mais',
    description:
      'Estamos sempre evoluindo o produto com base no retorno de quem usa no dia a dia. Novas funcionalidades a caminho.',
  },
]

export function Roadmap() {
  return (
    <Container id="roadmap" size="lg" py={{ base: 48, sm: 80 }}>
      <Stack align="center" gap="xs" mb="xl" ta="center">
        <Badge size="lg" variant="light" color="brand" radius="sm">
          Em desenvolvimento
        </Badge>
        <Title order={2} fz={{ base: 28, sm: 40 }}>
          O que vem por aí
        </Title>
        <Text c="dimmed" maw={620}>
          Já estamos construindo os próximos passos do Ageendoo — mais autonomia para o
          profissional e mais proximidade com o cliente.
        </Text>
      </Stack>

      <Grid gutter="lg">
        {items.map((item) => (
          <Grid.Col key={item.title} span={{ base: 12, md: 4 }}>
            <Card
              withBorder
              radius="lg"
              padding="xl"
              h="100%"
              style={{ borderStyle: 'dashed' }}
            >
              <Group mb="md">
                <ThemeIcon size={48} radius="md" variant="light" color="brand">
                  <item.icon size={26} />
                </ThemeIcon>
                <Badge variant="outline" color="brand" size="sm">
                  Planejado
                </Badge>
              </Group>
              <Text fw={700} fz="lg" mb={4}>
                {item.title}
              </Text>
              <Text size="sm" c="dimmed">
                {item.description}
              </Text>
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    </Container>
  )
}
