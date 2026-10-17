import { Box, Button, Container, Grid, Group, Image, List, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { IconCheck, IconClockHour4, IconCoin } from '@tabler/icons-react'
import { brand, whatsappLink } from '../branding'

const benefits = [
  'Tudo da sua operação em um só lugar: agenda, equipe e financeiro',
  'Comissões calculadas automaticamente, sem planilha',
  'Relatórios mensais e quinzenais do seu resultado',
  'Simples de usar no dia a dia por toda a equipe',
]

export function ClientProof() {
  return (
    <Box id="negocio" bg="brand.0" py={{ base: 48, sm: 80 }}>
      <Container size="lg">
        <Grid gutter={48} align="center">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="md">
              <Title order={2} fz={{ base: 28, sm: 40 }}>
                Feito para o dono do negócio
              </Title>
              <Text c="dimmed">
                O {brand.productName} foi pensado para quem toca o negócio no dia a dia.
                Menos tempo na administração, mais clareza sobre dinheiro e equipe — do seu jeito,
                no seu ritmo.
              </Text>

              <List
                spacing="sm"
                mt="xs"
                icon={
                  <ThemeIcon color="brand" variant="filled" size={22} radius="xl">
                    <IconCheck size={14} />
                  </ThemeIcon>
                }
              >
                {benefits.map((item) => (
                  <List.Item key={item}>{item}</List.Item>
                ))}
              </List>

              <Button
                mt="md"
                size="md"
                w={{ base: '100%', sm: 'fit-content' }}
                component="a"
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                Quero para o meu negócio
              </Button>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="lg" align="center">
              <Image
                src="/ilustra-dona.png"
                alt="Dona de um negócio de beleza organizando a agenda no tablet"
                maw={300}
                visibleFrom="md"
              />
              <Box
                p="xl"
                bg="white"
                w="100%"
                style={{
                  borderRadius: 'var(--mantine-radius-lg)',
                  boxShadow: 'var(--mantine-shadow-md)',
                }}
              >
              <Stack gap="lg">
                <Group gap="md" wrap="nowrap">
                  <Image
                    src="/maria-borboleta.png"
                    alt="Logo Maria Borboleta"
                    w={56}
                    h={56}
                    radius="md"
                    fit="cover"
                  />
                  <Stack gap={2}>
                    <Title order={3} fz="xl">
                      {brand.anchorClient} — Paulista
                    </Title>
                  </Stack>
                </Group>

                <Text size="sm" c="dimmed">
                  A unidade Paulista da {brand.anchorClient} usa o {brand.productName} no dia a dia
                  para gerir agenda, comissões e relatórios financeiros.
                </Text>

                <Grid>
                  <Grid.Col span={6}>
                    <Stack gap={4} align="center" ta="center">
                      <ThemeIcon size={40} radius="md" variant="light" color="brand">
                        <IconClockHour4 size={22} />
                      </ThemeIcon>
                      <Text fw={700}>Menos tempo</Text>
                      <Text size="xs" c="dimmed">
                        na administração
                      </Text>
                    </Stack>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Stack gap={4} align="center" ta="center">
                      <ThemeIcon size={40} radius="md" variant="light" color="brand">
                        <IconCoin size={22} />
                      </ThemeIcon>
                      <Text fw={700}>Mais controle</Text>
                      <Text size="xs" c="dimmed">
                        do financeiro
                      </Text>
                    </Stack>
                  </Grid.Col>
                </Grid>
              </Stack>
            </Box>
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  )
}
