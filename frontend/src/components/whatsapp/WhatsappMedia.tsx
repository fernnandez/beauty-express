import { useState } from "react";
import { Button, Image, Loader, Text } from "@mantine/core";
import { IconDownload } from "@tabler/icons-react";
import { whatsappService } from "../../services/whatsapp.service";
import type { WhatsappMessage } from "../../types";

interface WhatsappMediaProps {
  message: WhatsappMessage;
  onPreview?: (url: string) => void;
}

/**
 * Renderiza a mídia de uma mensagem. Se a mídia ainda não foi baixada
 * (mediaUrl ausente — caso de mensagens importadas pelo sync, que não baixam
 * em massa), oferece baixar sob demanda via endpoint.
 */
export function WhatsappMedia({ message, onPreview }: WhatsappMediaProps) {
  // URL baixada sob demanda (quando a mensagem veio sem mídia, ex.: sync).
  const [fetchedUrl, setFetchedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // A URL da prop (já resolvida pelo backend) tem prioridade; o fetch sob
  // demanda só cobre mensagens importadas sem mídia.
  const url = message.mediaUrl ?? fetchedUrl;

  const load = async () => {
    setLoading(true);
    try {
      const res = await whatsappService.resolveMedia(message.id);
      setFetchedUrl(res.url);
    } finally {
      setLoading(false);
    }
  };

  if (!url) {
    return (
      <Button
        size="xs"
        variant="light"
        color="gray"
        leftSection={
          loading ? <Loader size={12} /> : <IconDownload size={14} />
        }
        onClick={load}
        disabled={loading}
      >
        {loading ? "Baixando…" : "Baixar mídia"}
      </Button>
    );
  }

  if (message.type === "image" || message.type === "sticker") {
    return (
      <Image
        src={url}
        alt={message.type === "sticker" ? "Figurinha" : "Imagem"}
        w={message.type === "sticker" ? 120 : 220}
        fit="contain"
        radius="md"
        onClick={
          message.type === "image" && onPreview
            ? () => onPreview(url)
            : undefined
        }
        style={{ cursor: message.type === "image" ? "pointer" : undefined }}
      />
    );
  }
  if (message.type === "audio") {
    return (
      <audio controls src={url} style={{ maxWidth: 240, height: 40 }} />
    );
  }
  if (message.type === "video") {
    return (
      <video
        controls
        src={url}
        style={{ maxWidth: 240, borderRadius: 8 }}
      />
    );
  }
  // documento
  return (
    <Text
      size="sm"
      component="a"
      href={url}
      target="_blank"
      rel="noreferrer"
      c="blue"
      td="underline"
    >
      {message.content || "Abrir arquivo"}
    </Text>
  );
}
