import { Box, Card, Container, Grid, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import {
  IconCalendarEvent,
  IconCash,
  IconChartBar,
  IconListCheck,
  IconReceipt2,
  IconUsers,
  IconUserHeart,
  IconDeviceLaptop,
  type IconProps,
} from '@tabler/icons-react'
import type { ComponentType } from 'react'

type Feature = {
  icon: ComponentType<IconProps>
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: IconCalendarEvent,
    title: 'Agendamentos',
    description:
      'Marque atendimentos com múltiplos serviços, controle de status e até registro retroativo de atendimentos já realizados.',
  },
  {
    icon: IconUsers,
    title: 'Gestão de colaboradores',
    description:
      'Cadastre profissionais, defina a comissão de cada um, associe os serviços que executam e ative ou desative quando precisar.',
  },
  {
    icon: IconListCheck,
    title: 'Catálogo de serviços',
    description:
      'Mantenha preços e descrições organizados, prontos para usar em qualquer agendamento.',
  },
  {
    icon: IconCash,
    title: 'Comissões automáticas',
    description:
      'A comissão é calculada sozinha pelo percentual do profissional assim que o serviço é concluído. Nada de planilha.',
  },
  {
    icon: IconReceipt2,
    title: 'Controle de pagamentos',
    description:
      'Filtre comissões por período, profissional e status, e marque pagamentos em lote como pagos ou pendentes.',
  },
  {
    icon: IconChartBar,
    title: 'Relatórios financeiros',
    description:
      'Visão mensal clara de receita, total de comissões e valor líquido do negócio.',
  },
  {
    icon: IconUserHeart,
    title: 'Gestão de clientes',
    description:
      'Mantenha a base de clientes do negócio organizada e vinculada aos agendamentos.',
  },
  {
    icon: IconDeviceLaptop,
    title: 'Acesse de qualquer lugar',
    description:
      'Sistema 100% web: use no computador do negócio ou no celular, sem instalar nada. Seus dados sempre seguros e disponíveis.',
  },
]

export function Features() {
  return (
    <Box id="funcionalidades" bg="gray.0" py={{ base: 48, sm: 80 }}>
      <Container size="lg">
        <Stack align="center" gap="xs" mb="xl" ta="center">
          <Title order={2} fz={{ base: 28, sm: 40 }}>
            Tudo que você já pode fazer hoje
          </Title>
          <Text c="dimmed" maw={620}>
            Funcionalidades disponíveis e em uso real para gerir a operação do dia a dia.
          </Text>
        </Stack>

        <Grid gutter="lg">
          {features.map((feature) => (
            <Grid.Col key={feature.title} span={{ base: 12, sm: 6, md: 3 }}>
              <Card withBorder radius="lg" padding="lg" h="100%">
                <ThemeIcon size={48} radius="md" variant="light" color="brand" mb="md">
                  <feature.icon size={26} />
                </ThemeIcon>
                <Text fw={700} fz="lg" mb={4}>
                  {feature.title}
                </Text>
                <Text size="sm" c="dimmed">
                  {feature.description}
                </Text>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}
