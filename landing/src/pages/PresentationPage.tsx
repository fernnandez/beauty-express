import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Container,
  Grid,
  Group,
  List,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import {
  IconArrowRight,
  IconBrandWhatsapp,
  IconChevronLeft,
  IconChevronRight,
  IconCheck,
} from '@tabler/icons-react'
import { BrowserFrame } from '../components/BrowserFrame'
import { VideoSlot } from '../components/VideoSlot'
import { brand, whatsappLink } from '../branding'

const BRAND_GRADIENT =
  'linear-gradient(135deg, var(--mantine-color-brand-6), var(--mantine-color-brand-8))'

/* -------------------------------------------------------------------------- */
/* Blocos reutilizáveis de slide                                              */
/* -------------------------------------------------------------------------- */

/** Slide de recurso: texto + bullets de um lado, print do outro. */
function FeatureSlide({
  n,
  tag,
  title,
  description,
  bullets,
  img,
  alt,
  url,
  flip,
}: {
  n: string
  tag: string
  title: string
  description: string
  bullets: string[]
  img: string
  alt: string
  url: string
  flip?: boolean
}) {
  const text = (
    <Stack gap="sm">
      <Group gap="sm">
        <Text fw={800} fz={44} c="brand.3" lh={1}>
          {n}
        </Text>
        <Badge variant="light" color="brand" radius="sm" size="lg">
          {tag}
        </Badge>
      </Group>
      <Title order={2} fz={{ base: 26, sm: 38 }}>
        {title}
      </Title>
      <Text c="dimmed" fz={{ base: 'md', sm: 'lg' }}>
        {description}
      </Text>
      <List
        mt="xs"
        spacing="sm"
        icon={
          <ThemeIcon color="brand" variant="light" size={24} radius="xl">
            <IconCheck size={15} />
          </ThemeIcon>
        }
      >
        {bullets.map((b) => (
          <List.Item key={b}>{b}</List.Item>
        ))}
      </List>
    </Stack>
  )
  const image = <BrowserFrame src={img} alt={alt} url={url} />

  return (
    <Grid gutter={48} align="center" w="100%">
      <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 2, md: flip ? 2 : 1 }}>
        {flip ? image : text}
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 1, md: flip ? 1 : 2 }}>
        {flip ? text : image}
      </Grid.Col>
    </Grid>
  )
}

/* -------------------------------------------------------------------------- */
/* Definição dos slides                                                       */
/* -------------------------------------------------------------------------- */

const slides: { id: string; dark?: boolean; content: ReactNode }[] = [
  // 0 — Capa
  {
    id: 'capa',
    dark: true,
    content: (
      <Stack align="center" ta="center" gap="lg" maw={820}>
        <Text fw={800} fz={30} style={{ letterSpacing: 0.5 }}>
          {brand.productName}
        </Text>
        <Badge size="lg" variant="white" c="brand.8" radius="sm">
          Apresentação comercial
        </Badge>
        <Title order={1} fz={{ base: 32, sm: 56 }} lh={1.08}>
          A gestão completa do salão, do primeiro "oi" no WhatsApp ao lucro do mês
        </Title>
        <Text fz={{ base: 'md', sm: 'xl' }} opacity={0.92} maw={620}>
          Agenda, atendimento, comissões e financeiro em um só lugar.
        </Text>
      </Stack>
    ),
  },
  // 1 — Problema → solução
  {
    id: 'problema',
    content: (
      <Grid gutter="xl" align="center" w="100%" maw={1000}>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Badge variant="light" color="red" radius="sm" mb="sm" size="lg">
            O problema
          </Badge>
          <Title order={2} fz={{ base: 24, sm: 34 }} mb="md">
            Caderno, WhatsApp pessoal e planilha não conversam entre si
          </Title>
          <List
            spacing="sm"
            icon={
              <ThemeIcon color="red" variant="light" size={24} radius="xl">
                <IconCheck size={15} />
              </ThemeIcon>
            }
          >
            <List.Item>Agendamentos espalhados e esquecidos</List.Item>
            <List.Item>Comissão calculada na mão, com erro e retrabalho</List.Item>
            <List.Item>Conversa com cliente perdida no WhatsApp pessoal</List.Item>
            <List.Item>Sem clareza do lucro real no fim do mês</List.Item>
          </List>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Box
            style={{ background: BRAND_GRADIENT, color: '#fff', borderRadius: 16 }}
            p="xl"
          >
            <Badge variant="white" c="brand.8" radius="sm" mb="sm" size="lg">
              A solução
            </Badge>
            <Title order={3} fz={{ base: 22, sm: 30 }} mb="sm">
              Uma plataforma só, que acompanha toda a operação
            </Title>
            <Text opacity={0.92} fz="lg">
              Do atendimento ao fechamento financeiro, com a equipe tendo acesso ao que é
              dela. Menos apps abertos, menos planilha, mais controle.
            </Text>
          </Box>
        </Grid.Col>
      </Grid>
    ),
  },
  // 2 — WhatsApp (destaque, com print do inbox)
  {
    id: 'whatsapp',
    content: (
      <FeatureSlide
        n="★"
        tag="WhatsApp"
        title="Atendimento por WhatsApp dentro do sistema"
        description="O número do salão conectado ao Ageendoo: todas as conversas num inbox, sem misturar com o WhatsApp pessoal."
        bullets={[
          'Inbox com todas as conversas e não lidas',
          'Buckets: agendados, clientes e novos contatos',
          'Confirmação de agendamento em um clique',
        ]}
        img="/demo/whatsapp.png"
        alt="Inbox de atendimento por WhatsApp"
        url="app.ageendoo.com/whatsapp"
      />
    ),
  },
  // 3 — WhatsApp (chat + catálogo/respostas)
  {
    id: 'whatsapp-chat',
    content: (
      <FeatureSlide
        n="★"
        tag="WhatsApp"
        title="Conversa completa, com catálogo e respostas rápidas"
        description="Responda o cliente com a conversa inteira à vista, status de entrega e atalhos que agilizam o atendimento."
        bullets={[
          'Status de entrega e leitura (tiquinhos)',
          'Catálogo de preços pronto para enviar',
          'Respostas rápidas configuráveis',
        ]}
        img="/demo/whatsapp-chat.png"
        alt="Conversa de WhatsApp aberta"
        url="app.ageendoo.com/whatsapp"
        flip
      />
    ),
  },
  // 4 — Agenda
  {
    id: 'agenda',
    content: (
      <FeatureSlide
        n="01"
        tag="Agenda"
        title="A agenda do dia inteira numa tela"
        description="Todos os atendimentos por horário — cliente, serviço, profissional e status — e marca em segundos."
        bullets={[
          'Visão de agenda ou lista',
          'Múltiplos serviços por horário',
          'Registro retroativo de atendimentos',
        ]}
        img="/demo/agenda.png"
        alt="Agenda do dia"
        url="app.ageendoo.com/appointments"
      />
    ),
  },
  // 5 — Comissões
  {
    id: 'comissoes',
    content: (
      <FeatureSlide
        n="02"
        tag="Comissões"
        title="Comissão no automático, sem planilha"
        description="Ao concluir o serviço, a comissão é calculada pelo percentual do profissional. Pague em lote e acompanhe atrasos."
        bullets={[
          'Cálculo automático por serviço',
          'Filtro por período, profissional e status',
          'Pagamento em lote e alerta de atraso',
        ]}
        img="/demo/comissoes.png"
        alt="Comissões por colaborador"
        url="app.ageendoo.com/commissions"
        flip
      />
    ),
  },
  // 6 — Financeiro
  {
    id: 'financeiro',
    content: (
      <FeatureSlide
        n="03"
        tag="Financeiro"
        title="O lucro real do mês, não só o faturamento"
        description="Receita, comissões e despesas num painel só. O Ageendoo mostra o lucro líquido — o que de fato sobra."
        bullets={[
          'Receita − comissões − despesas = lucro',
          'Gráficos de evolução no tempo',
          'Fechamento mensal ou quinzenal',
        ]}
        img="/demo/relatorios.png"
        alt="Relatórios financeiros"
        url="app.ageendoo.com/financial-reports"
      />
    ),
  },
  // 7 — Vídeo
  {
    id: 'video',
    content: (
      <Stack w="100%" maw={900} gap="lg" align="center">
        <Stack gap={4} align="center" ta="center">
          <Badge color="brand" variant="light" radius="sm" size="lg">
            Demonstração
          </Badge>
          <Title order={2} fz={{ base: 24, sm: 36 }}>
            Veja o Ageendoo em ação
          </Title>
        </Stack>
        <Box w="100%">
          <VideoSlot label="Espaço para o vídeo de demonstração do produto (grave a navegação real do app aqui)." />
        </Box>
      </Stack>
    ),
  },
  // 8 — Fechamento / CTA
  {
    id: 'cta',
    dark: true,
    content: (
      <Stack align="center" ta="center" gap="lg" maw={720}>
        <Title order={2} fz={{ base: 30, sm: 46 }}>
          Pronto para tirar o salão do caderno?
        </Title>
        <Text fz={{ base: 'md', sm: 'xl' }} opacity={0.92} maw={560}>
          Vamos conversar e montar o Ageendoo para a realidade do seu negócio.
        </Text>
        <Button
          size="xl"
          color="white"
          c="brand.8"
          variant="white"
          component="a"
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          leftSection={<IconBrandWhatsapp size={22} />}
          rightSection={<IconArrowRight size={20} />}
        >
          Falar com a gente
        </Button>
      </Stack>
    ),
  },
]

/* -------------------------------------------------------------------------- */
/* Deck                                                                       */
/* -------------------------------------------------------------------------- */

export function PresentationPage() {
  const [index, setIndex] = useState(0)
  const total = slides.length

  const go = useCallback(
    (dir: number) => {
      setIndex((i) => Math.min(total - 1, Math.max(0, i + dir)))
    },
    [total],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') go(1)
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(-1)
      else if (e.key === 'Home') setIndex(0)
      else if (e.key === 'End') setIndex(total - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, total])

  const slide = slides[index]
  const dark = !!slide.dark

  return (
    <Box
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: dark ? undefined : 'var(--mantine-color-gray-0)',
        backgroundImage: dark ? BRAND_GRADIENT : undefined,
        color: dark ? '#fff' : undefined,
        transition: 'background 0.3s ease',
      }}
    >
      {/* Área do slide */}
      <Box
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 24px',
          overflowY: 'auto',
        }}
      >
        <Container size="lg" w="100%" style={{ display: 'flex', justifyContent: 'center' }}>
          {slide.content}
        </Container>
      </Box>

      {/* Barra de navegação */}
      <Group
        justify="space-between"
        align="center"
        px="lg"
        py="md"
        style={{
          borderTop: dark
            ? '1px solid rgba(255,255,255,0.2)'
            : '1px solid var(--mantine-color-gray-3)',
        }}
      >
        <ActionIcon
          variant={dark ? 'white' : 'light'}
          color="brand"
          size="lg"
          radius="xl"
          onClick={() => go(-1)}
          disabled={index === 0}
          aria-label="Slide anterior"
        >
          <IconChevronLeft size={20} />
        </ActionIcon>

        {/* indicadores */}
        <Group gap={8}>
          {slides.map((s, i) => (
            <Box
              key={s.id}
              onClick={() => setIndex(i)}
              style={{
                width: i === index ? 26 : 9,
                height: 9,
                borderRadius: 999,
                cursor: 'pointer',
                background:
                  i === index
                    ? dark
                      ? '#fff'
                      : 'var(--mantine-color-brand-6)'
                    : dark
                      ? 'rgba(255,255,255,0.4)'
                      : 'var(--mantine-color-gray-4)',
                transition: 'width 0.2s ease',
              }}
            />
          ))}
        </Group>

        <Group gap="xs">
          <Text size="sm" fw={600} opacity={0.8}>
            {index + 1} / {total}
          </Text>
          <ActionIcon
            variant={dark ? 'white' : 'filled'}
            color="brand"
            size="lg"
            radius="xl"
            onClick={() => go(1)}
            disabled={index === total - 1}
            aria-label="Próximo slide"
          >
            <IconChevronRight size={20} />
          </ActionIcon>
        </Group>
      </Group>
    </Box>
  )
}
