import { Box, Button, Container, Stack, Text, Title } from '@mantine/core'
import { IconBrandWhatsapp } from '@tabler/icons-react'
import { brand, whatsappLink } from '../branding'

export function CTA() {
  return (
    <Box
      id="contato"
      py={{ base: 48, sm: 80 }}
      style={{
        background:
          'linear-gradient(135deg, var(--mantine-color-brand-7) 0%, var(--mantine-color-brand-9) 100%)',
      }}
    >
      <Container size="sm">
        <Stack align="center" gap="lg" ta="center">
          <Title order={2} c="white" fz={{ base: 28, sm: 40 }}>
            Pronto para organizar o seu negócio?
          </Title>
          <Text c="white" opacity={0.9} fz="lg" maw={520}>
            Fale com a gente e veja como o {brand.productName} pode simplificar a gestão do seu
            negócio no dia a dia.
          </Text>
          <Button
            size="lg"
            color="white"
            variant="white"
            c="brand.7"
            component="a"
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            leftSection={<IconBrandWhatsapp size={20} />}
          >
            Falar no WhatsApp
          </Button>
        </Stack>
      </Container>
    </Box>
  )
}
