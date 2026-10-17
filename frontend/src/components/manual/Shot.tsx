import { Box, Image, Text } from "@mantine/core";
import { useState } from "react";

interface ShotProps {
  /** Caminho do print em /public (ex.: /manual/agendamentos.png). */
  src: string;
  alt: string;
  /** Legenda opcional abaixo da imagem. */
  caption?: string;
}

/**
 * Moldura de screenshot do manual: borda arredondada, sombra leve e legenda.
 * Se a imagem ainda não existir (print não gerado), mostra um placeholder
 * discreto em vez de quebrar o layout.
 */
export function Shot({ src, alt, caption }: ShotProps) {
  const [failed, setFailed] = useState(false);

  return (
    <Box>
      <Box
        style={{
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid var(--mantine-color-gray-3)",
          boxShadow: "0 6px 24px rgba(16,24,40,0.08)",
        }}
      >
        {failed ? (
          <Box
            style={{
              aspectRatio: "16 / 9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "var(--mantine-color-gray-0)",
            }}
          >
            <Text size="sm" c="dimmed">
              Pré-visualização em breve
            </Text>
          </Box>
        ) : (
          <Image src={src} alt={alt} onError={() => setFailed(true)} />
        )}
      </Box>
      {caption && (
        <Text size="xs" c="dimmed" ta="center" mt={6}>
          {caption}
        </Text>
      )}
    </Box>
  );
}
