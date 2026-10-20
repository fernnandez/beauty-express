import {
  Badge,
  Box,
  Container,
  Grid,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import {
  IconAlertTriangle,
  IconBrandWhatsapp,
  IconCalendarEvent,
  IconCash,
  IconChartBar,
  IconDeviceMobile,
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

/** Demais recursos — exibidos como lista enxuta, sem o peso de cards cheios. */
const features: Feature[] = [
  {
    icon: IconCalendarEvent,
    title: 'Agendamentos',
    description:
      'Múltiplos serviços por horário, visão de agenda ou lista e registro retroativo.',
  },
  {
    icon: IconCash,
    title: 'Comissões automáticas',
    description:
      'Calculadas sozinhas pelo percentual do profissional ao concluir o serviço.',
  },
  {
    icon: IconReceipt2,
    title: 'Despesas e lucro real',
    description:
      'Custos fixos e esporádicos e o lucro líquido do negócio, sem planilha.',
  },
  {
    icon: IconChartBar,
    title: 'Relatórios financeiros',
    description:
      'Receita, comissões, despesas e lucro com gráficos e filtro por mês ou quinzena.',
  },
  {
    icon: IconUsers,
    title: 'Equipe com acesso próprio',
    description:
      'Cada profissional vê a própria agenda e comissões no app, sem depender do gestor.',
  },
  {
    icon: IconAlertTriangle,
    title: 'Alertas de atraso',
    description:
      'Veja na hora as comissões vencidas a pagar. Regime quinzenal ou mensal.',
  },
]

export function Features() {
  return (
    <Box id="funcionalidades" bg="gray.0" py={{ base: 48, sm: 80 }}>
      <Container size="lg">
        <Stack align="center" gap="xs" mb="xl" ta="center">
          <Title order={2} fz={{ base: 28, sm: 40 }}>
            Tudo em um só lugar
          </Title>
          <Text c="dimmed" maw={600}>
            Do primeiro contato no WhatsApp ao fechamento financeiro do mês.
          </Text>
        </Stack>

        {/* Destaque: WhatsApp — recurso novo, ganha um bloco próprio */}
        <Paper
          radius="lg"
          p={{ base: 'lg', sm: 'xl' }}
          mb="lg"
          style={{
            background:
              'linear-gradient(135deg, var(--mantine-color-brand-6), var(--mantine-color-brand-8))',
            color: '#fff',
          }}
        >
          <Grid align="center" gutter="xl">
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Group gap="sm" mb="sm">
                <ThemeIcon size={44} radius="md" variant="white" color="brand">
                  <IconBrandWhatsapp size={26} />
                </ThemeIcon>
                <Badge color="white" c="brand.8" variant="white" radius="sm">
                  Novidade
                </Badge>
              </Group>
              <Title order={3} fz={{ base: 22, sm: 28 }} mb={6}>
                Atendimento por WhatsApp
              </Title>
              <Text opacity={0.92} maw={560}>
                Converse com seus clientes pelo WhatsApp dentro do sistema: um inbox com
                todas as conversas, confirmação de agendamentos, catálogo de preços e
                respostas rápidas — sem ficar trocando de aplicativo.
              </Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Stack gap={8}>
                {['Inbox de conversas', 'Confirmar agendamento', 'Catálogo e respostas rápidas'].map(
                  (t) => (
                    <Group key={t} gap={8} wrap="nowrap">
                      <ThemeIcon size={20} radius="xl" variant="white" color="brand">
                        <IconBrandWhatsapp size={12} />
                      </ThemeIcon>
                      <Text size="sm" fw={600}>
                        {t}
                      </Text>
                    </Group>
                  ),
                )}
              </Stack>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Demais recursos: lista enxuta, ícone + texto (sem cards repetidos) */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
          {features.map((feature) => (
            <Group key={feature.title} align="flex-start" gap="sm" wrap="nowrap">
              <ThemeIcon size={40} radius="md" variant="light" color="brand">
                <feature.icon size={22} />
              </ThemeIcon>
              <div>
                <Text fw={700} mb={2}>
                  {feature.title}
                </Text>
                <Text size="sm" c="dimmed">
                  {feature.description}
                </Text>
              </div>
            </Group>
          ))}
        </SimpleGrid>

        {/* Instalável como app — faixa final discreta */}
        <Group justify="center" mt={40} gap="xs">
          <ThemeIcon size={28} radius="xl" variant="light" color="brand">
            <IconDeviceMobile size={16} />
          </ThemeIcon>
          <Text size="sm" c="dimmed">
            Também instala no celular como aplicativo, direto na tela inicial — sem lojas.
          </Text>
        </Group>
      </Container>
    </Box>
  )
}
