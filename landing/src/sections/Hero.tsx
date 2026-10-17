import { Box, Button, Container, Grid, Group, Image, Stack, Text, Title } from '@mantine/core'
import { IconBrandWhatsapp, IconCalendarCheck } from '@tabler/icons-react'
import { Link } from 'react-router-dom'
import { brand, whatsappLink } from '../branding'

export function Hero() {
  return (
    <Box
      py={{ base: 48, sm: 72 }}
      style={{
        background:
          'linear-gradient(160deg, var(--mantine-color-brand-0) 0%, #ffffff 55%)',
        overflow: 'hidden',
      }}
    >
      <Container size="lg">
        <Grid gutter={48} align="center">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="lg">
              <Text
                component="span"
                w="fit-content"
                fw={700}
                tt="uppercase"
                c="brand.7"
                bg="brand.1"
                fz={{ base: 11, sm: 'sm' }}
                lh={1.3}
                style={{
                  borderRadius: 'var(--mantine-radius-sm)',
                  padding: '6px 12px',
                  letterSpacing: 0.3,
                }}
              >
                Gestão para negócios de beleza e esmalterias
              </Text>

              <Title order={1} fz={{ base: 34, sm: 50 }} lh={1.1}>
                A agenda do seu negócio fácil e as comissões no controle
              </Title>

              <Text fz={{ base: 'md', sm: 'lg' }} c="dimmed" maw={520}>
                {brand.productName} tira a sua operação do caderno e da planilha. Agende, acompanhe
                comissões automáticas e enxergue o resultado financeiro do seu negócio em tempo
                real.
              </Text>

              <Group mt="xs" gap="sm" w={{ base: '100%', sm: 'auto' }}>
                <Button
                  size="lg"
                  component="a"
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  leftSection={<IconBrandWhatsapp size={20} />}
                  w={{ base: '100%', xs: 'auto' }}
                >
                  Falar no WhatsApp
                </Button>
                <Button
                  size="lg"
                  variant="default"
                  component={Link}
                  to="/sistema"
                  leftSection={<IconCalendarCheck size={20} />}
                  w={{ base: '100%', xs: 'auto' }}
                >
                  Ver o sistema
                </Button>
              </Group>

              <Text size="sm" c="dimmed">
                Sem instalação complicada. Acesse de qualquer navegador.
              </Text>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }} visibleFrom="md">
            <Image
              src="/hero-ilustra.png"
              alt="Dona de um negócio de beleza usando o Ageendoo no tablet"
              radius="lg"
            />
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  )
}
