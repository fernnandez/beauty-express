import { Container, Grid, Image, List, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { IconArrowRight } from '@tabler/icons-react'
import { brand } from '../branding'

const steps = [
  'Agenda e histórico sempre organizados — nada se perde',
  'Comissões e valores calculados pelo sistema, não na mão',
  'Resultado do mês e da quinzena em poucos cliques',
]

export function FromNotebook() {
  return (
    <Container size="lg" py={{ base: 48, sm: 80 }}>
      <Grid gutter={48} align="center">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Image
            src="/ilustra-caderno.png"
            alt="Do caderno bagunçado para um painel digital organizado"
            radius="lg"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack gap="md">
            <Title order={2} fz={{ base: 28, sm: 40 }}>
              Do caderno ao controle total
            </Title>
            <Text c="dimmed">
              Trocar a bagunça do caderno e das planilhas por um sistema simples muda o dia a dia
              do seu negócio. O {brand.productName} centraliza tudo em um só lugar.
            </Text>
            <List
              spacing="sm"
              mt="xs"
              icon={
                <ThemeIcon color="brand" variant="light" size={22} radius="xl">
                  <IconArrowRight size={14} />
                </ThemeIcon>
              }
            >
              {steps.map((item) => (
                <List.Item key={item}>{item}</List.Item>
              ))}
            </List>
          </Stack>
        </Grid.Col>
      </Grid>
    </Container>
  )
}
