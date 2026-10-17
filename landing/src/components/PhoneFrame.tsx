import { Box } from '@mantine/core'

type PhoneFrameProps = {
  src: string
  alt: string
  /** largura do telefone em px */
  width?: number
}

/**
 * Moldura de smartphone para exibir screenshots mobile do app na LP.
 * Sem notch (a câmera tapava o título das telas); borda arredondada limpa.
 * Imagem em ratio natural para manter nitidez.
 */
export function PhoneFrame({ src, alt, width = 240 }: PhoneFrameProps) {
  return (
    <Box
      style={{
        width,
        borderRadius: 36,
        border: '10px solid #1f2937',
        background: '#1f2937',
        boxShadow: '0 24px 60px rgba(0,0,0,0.22)',
        overflow: 'hidden',
        flexShrink: 0,
        lineHeight: 0,
      }}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          borderRadius: 26,
        }}
      />
    </Box>
  )
}
