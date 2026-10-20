import { Box, Center, Stack, Text, ThemeIcon } from '@mantine/core'
import { IconMovie } from '@tabler/icons-react'

type VideoSlotProps = {
  /** URL do vídeo (mp4/webm) ou embed. Se vazio, mostra o placeholder. */
  src?: string
  /** Legenda/dica do que o vídeo mostra. */
  label?: string
  ratio?: number
}

/**
 * Espaço para vídeo de demonstração na apresentação comercial.
 * Enquanto não há arquivo, exibe um placeholder elegante (não quebra o layout).
 * Coloque os vídeos em landing/public/presentation/ e passe o src.
 */
export function VideoSlot({ src, label, ratio = 16 / 9 }: VideoSlotProps) {
  return (
    <Box
      style={{
        aspectRatio: String(ratio),
        borderRadius: 14,
        overflow: 'hidden',
        border: '1px solid var(--mantine-color-gray-3)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.14)',
        background: '#000',
      }}
    >
      {src ? (
        <video
          src={src}
          controls
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <Center h="100%" bg="gray.1">
          <Stack align="center" gap={6}>
            <ThemeIcon size={54} radius="xl" variant="light" color="brand">
              <IconMovie size={28} />
            </ThemeIcon>
            <Text fw={600} c="dimmed">
              Espaço para vídeo
            </Text>
            {label && (
              <Text size="sm" c="dimmed" ta="center" maw={320}>
                {label}
              </Text>
            )}
          </Stack>
        </Center>
      )}
    </Box>
  )
}
