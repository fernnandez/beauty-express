import { Box, Container, Grid, List, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { IconCheck } from '@tabler/icons-react'
import { BrowserFrame } from '../components/BrowserFrame'

type Demo = {
  tag: string
  title: string
  description: string
  bullets: string[]
  img: string
  alt: string
  url: string
}

const demos: Demo[] = [
  {
    tag: 'Agenda',
    title: 'Toda a agenda do dia numa tela',
    description:
      'Visualize os atendimentos por horário, com cliente, serviço, profissional e status. Alterne entre visão de agenda e lista.',
    bullets: [
      'Múltiplos serviços por agendamento',
      'Status: agendado, concluído e cancelado',
      'Registro retroativo de atendimentos',
    ],
    img: '/demo/agenda.png',
    alt: 'Agenda do dia com agendamentos',
    url: 'app.ageendoo.com/appointments',
  },
  {
    tag: 'Comissões',
    title: 'Comissões calculadas automaticamente',
    description:
      'Cada serviço concluído gera a comissão pelo percentual do profissional. Filtre por período, colaborador e status, e marque pagamentos em lote.',
    bullets: [
      'Cálculo automático por percentual',
      'Totais de pago e pendente sempre à vista',
      'Pagamento em lote',
    ],
    img: '/demo/comissoes.png',
    alt: 'Lista de comissões por colaborador',
    url: 'app.ageendoo.com/commissions',
  },
  {
    tag: 'Financeiro',
    title: 'Relatórios mensais e quinzenais',
    description:
      'Receita, comissões e valor líquido num painel claro. Alterne entre fechamento mensal e quinzenal com um clique.',
    bullets: [
      'Total agendado, pago e pendente',
      'Comissões pagas e previstas',
      'Valor líquido do período',
    ],
    img: '/demo/relatorios.png',
    alt: 'Relatórios financeiros com totais do período',
    url: 'app.ageendoo.com/financial-reports',
  },
  {
    tag: 'Equipe',
    title: 'Equipe e serviços organizados',
    description:
      'Cadastre profissionais com comissão própria e serviços associados, e mantenha o catálogo de serviços sempre atualizado.',
    bullets: [
      'Comissão individual por profissional',
      'Ativar/desativar sem perder histórico',
      'Catálogo de serviços com preços',
    ],
    img: '/demo/colaboradores.png',
    alt: 'Lista de colaboradores com área de atuação e status',
    url: 'app.ageendoo.com/collaborators',
  },
]

export function Demo() {
  return (
    <Box id="demo" bg="gray.0" py={{ base: 48, sm: 80 }}>
      <Container size="lg">
        <Stack align="center" gap="xs" mb={48} ta="center">
          <Text tt="uppercase" fw={700} c="brand.7" size="sm">
            Veja por dentro
          </Text>
          <Title order={2} fz={{ base: 28, sm: 40 }}>
            O sistema por dentro
          </Title>
          <Text c="dimmed" maw={620}>
            Telas reais do produto em uso — dados ilustrativos de demonstração.
          </Text>
        </Stack>

        <Stack gap={64}>
          {demos.map((demo, index) => {
            const imageFirst = index % 2 === 1
            const textCol = (
              <Grid.Col
                span={{ base: 12, md: 5 }}
                order={{ base: 2, md: imageFirst ? 2 : 1 }}
              >
                <Stack gap="sm" justify="center" h="100%">
                  <Text tt="uppercase" fw={700} c="brand.7" size="xs">
                    {demo.tag}
                  </Text>
                  <Title order={3} fz={{ base: 'xl', sm: 28 }}>
                    {demo.title}
                  </Title>
                  <Text c="dimmed">{demo.description}</Text>
                  <List
                    spacing="xs"
                    mt="xs"
                    icon={
                      <ThemeIcon color="brand" variant="light" size={22} radius="xl">
                        <IconCheck size={14} />
                      </ThemeIcon>
                    }
                  >
                    {demo.bullets.map((b) => (
                      <List.Item key={b}>{b}</List.Item>
                    ))}
                  </List>
                </Stack>
              </Grid.Col>
            )
            const imageColEl = (
              <Grid.Col
                span={{ base: 12, md: 7 }}
                order={{ base: 1, md: imageFirst ? 1 : 2 }}
              >
                <BrowserFrame src={demo.img} alt={demo.alt} url={demo.url} />
              </Grid.Col>
            )

            return (
              <Grid key={demo.title} gutter={40} align="center">
                {imageColEl}
                {textCol}
              </Grid>
            )
          })}
        </Stack>
      </Container>
    </Box>
  )
}
