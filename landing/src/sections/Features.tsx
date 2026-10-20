import { Box, Card, Container, Grid, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import {
  IconAlertTriangle,
  IconBrandWhatsapp,
  IconCalendarEvent,
  IconCash,
  IconChartBar,
  IconDeviceMobile,
  IconListCheck,
  IconReceipt2,
  IconUsers,
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
    icon: IconBrandWhatsapp,
    title: 'Atendimento por WhatsApp',
    description:
      'Converse com seus clientes pelo WhatsApp dentro do sistema: inbox com todas as conversas, confirmação de agendamentos, catálogo de preços e respostas rápidas — tudo em um só lugar.',
  },
  {
    icon: IconCalendarEvent,
    title: 'Agendamentos',
    description:
      'Marque atendimentos com múltiplos serviços, visão de agenda ou lista, e até registro retroativo de atendimentos já realizados.',
  },
  {
    icon: IconUsers,
    title: 'Equipe com acesso próprio',
    description:
      'Cadastre profissionais, defina comissões e dê a cada um acesso ao app para ver a própria agenda e comissões — sem depender do gestor.',
  },
  {
    icon: IconCash,
    title: 'Comissões automáticas',
    description:
      'A comissão é calculada sozinha pelo percentual do profissional assim que o serviço é concluído. Nada de planilha.',
  },
  {
    icon: IconAlertTriangle,
    title: 'Alertas de atraso',
    description:
      'Veja na hora quais profissionais têm comissões vencidas a pagar. Regime quinzenal ou mensal, do seu jeito.',
  },
  {
    icon: IconReceipt2,
    title: 'Despesas e lucro real',
    description:
      'Registre custos fixos e esporádicos e enxergue o lucro líquido do negócio: receita menos comissões menos despesas.',
  },
  {
    icon: IconChartBar,
    title: 'Relatórios financeiros',
    description:
      'Receita, comissões, despesas e lucro líquido com gráficos de evolução e filtro por mês ou quinzena.',
  },
  {
    icon: IconListCheck,
    title: 'Serviços e clientes',
    description:
      'Catálogo de serviços com preços e comissão, e a base de clientes do negócio sempre organizada.',
  },
  {
    icon: IconDeviceMobile,
    title: 'Instale como aplicativo',
    description:
      'Instale o Ageendoo no celular como um aplicativo. Abre em tela cheia, direto na tela inicial, sem lojas e sem complicação.',
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
