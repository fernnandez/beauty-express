import { Card, Container, Grid, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import {
  IconCalendarCheck,
  IconCoin,
  IconReportMoney,
  type IconProps,
} from '@tabler/icons-react'
import type { ComponentType } from 'react'

type Result = {
  icon: ComponentType<IconProps>
  title: string
  description: string
}

const results: Result[] = [
  {
    icon: IconCalendarCheck,
    title: 'Agenda descomplicada',
    description:
      'Visão de agenda por dia, múltiplos serviços e status claros. Marcar e acompanhar atendimentos fica simples para toda a equipe.',
  },
  {
    icon: IconCoin,
    title: 'Gestão de comissão',
    description:
      'Comissão calculada automaticamente ao concluir cada serviço, com controle de pagamentos por profissional e período. Zero planilha.',
  },
  {
    icon: IconReportMoney,
    title: 'Relatórios financeiros',
    description:
      'Receita, comissões e valor líquido em relatórios mensais e quinzenais. Saiba exatamente quanto o negócio lucrou no período.',
  },
]

export function Results() {
  return (
    <Container size="lg" py={{ base: 48, sm: 80 }}>
      <Stack align="center" gap="xs" mb="xl" ta="center">
        <Text tt="uppercase" fw={700} c="brand.7" size="sm">
          O que entregamos
        </Text>
        <Title order={2} fz={{ base: 28, sm: 40 }}>
          Resultado real para o seu negócio
        </Title>
        <Text c="dimmed" maw={620}>
          Menos tempo na administração, mais clareza sobre dinheiro e equipe.
        </Text>
      </Stack>

      <Grid gutter="lg">
        {results.map((result) => (
          <Grid.Col key={result.title} span={{ base: 12, md: 4 }}>
            <Card withBorder radius="lg" padding="xl" h="100%">
              <ThemeIcon size={56} radius="md" variant="light" color="brand" mb="md">
                <result.icon size={30} />
              </ThemeIcon>
              <Text fw={700} fz="xl" mb={6}>
                {result.title}
              </Text>
              <Text c="dimmed">{result.description}</Text>
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    </Container>
  )
}
