import { Box } from '@mantine/core'
import type { ReactNode } from 'react'

type BrowserFrameProps = {
  src: string
  alt: string
  /** rótulo exibido na barra de endereço fake */
  url?: string
  children?: ReactNode
}

/**
 * Emoldura um screenshot num "navegador" para dar contexto de produto na LP.
 */
export function BrowserFrame({ src, alt, url = 'app.ageendoo.com' }: BrowserFrameProps) {
  return (
    <Box
      style={{
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
        border: '1px solid var(--mantine-color-gray-3)',
        background: '#fff',
      }}
    >
      {/* barra do navegador */}
      <Box
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          background: 'var(--mantine-color-gray-1)',
          borderBottom: '1px solid var(--mantine-color-gray-3)',
        }}
      >
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57' }} />
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#febc2e' }} />
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840' }} />
        <Box
          style={{
            marginLeft: 10,
            flex: 1,
            maxWidth: 320,
            fontSize: 12,
            color: 'var(--mantine-color-gray-6)',
            background: '#fff',
            borderRadius: 6,
            padding: '3px 10px',
            border: '1px solid var(--mantine-color-gray-3)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {url}
        </Box>
      </Box>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        style={{ display: 'block', width: '100%', height: 'auto' }}
      />
    </Box>
  )
}
