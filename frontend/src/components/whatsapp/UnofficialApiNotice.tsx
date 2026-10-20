import { useDisclosure } from "@mantine/hooks";
import { Alert, Anchor, Collapse, List, Stack, Text } from "@mantine/core";
import { IconShieldExclamation } from "@tabler/icons-react";

/**
 * Aviso sobre o uso de API não oficial do WhatsApp (Evolution/Baileys):
 * risco de bloqueio do número e boas práticas para reduzir esse risco.
 *
 * `variant="compact"` mostra só o resumo com um link para expandir as dicas
 * (usado em painéis menores, como o modal de configurações).
 */
export function UnofficialApiNotice({
  variant = "full",
}: {
  variant?: "full" | "compact";
}) {
  const [opened, { toggle }] = useDisclosure(variant === "full");

  return (
    <Alert
      variant="light"
      color="yellow"
      radius="md"
      icon={<IconShieldExclamation size={18} />}
      title="Atenção: conexão não oficial do WhatsApp"
    >
      <Stack gap="xs">
        <Text size="sm">
          Este atendimento usa uma conexão <b>não oficial</b> (via WhatsApp Web),
          que <b>não é homologada pela Meta</b>. O número pode ser{" "}
          <b>bloqueado sem aviso</b> se o WhatsApp identificar comportamento
          considerado abusivo. Use com bom senso, como se estivesse conversando
          pelo celular.
        </Text>

        {variant === "compact" && (
          <Anchor size="sm" onClick={toggle} style={{ cursor: "pointer" }}>
            {opened ? "Ocultar boas práticas" : "Ver boas práticas de uso"}
          </Anchor>
        )}

        <Collapse in={opened}>
          <Text size="sm" fw={600} mt={4}>
            Boas práticas para reduzir o risco de bloqueio:
          </Text>
          <List size="sm" spacing={4} mt={4}>
            <List.Item>
              <b>Não dispare em massa.</b> Evite enviar muitas mensagens em
              sequência ou para muitos contatos de uma vez.
            </List.Item>
            <List.Item>
              <b>Fale só com quem já é seu cliente</b> ou com quem iniciou a
              conversa. Evite abordar números desconhecidos.
            </List.Item>
            <List.Item>
              <b>Prefira responder</b> a mensagens recebidas em vez de iniciar
              muitas conversas novas.
            </List.Item>
            <List.Item>
              <b>Personalize</b> as mensagens; evite textos idênticos repetidos
              para vários contatos.
            </List.Item>
            <List.Item>
              <b>Respeite quem pede para parar.</b> Não insista com quem não quer
              ser contatado.
            </List.Item>
            <List.Item>
              <b>Use um número dedicado</b> ao atendimento (não o número pessoal)
              e, de preferência, um chip ativo há algum tempo.
            </List.Item>
            <List.Item>
              <b>Comece devagar</b> ao conectar um número novo e aumente o volume
              aos poucos.
            </List.Item>
          </List>
          <Text size="xs" c="dimmed" mt="xs">
            Para operação em alto volume ou com garantias de entrega, o caminho
            recomendado é a API oficial do WhatsApp (Cloud API da Meta).
          </Text>
        </Collapse>
      </Stack>
    </Alert>
  );
}
