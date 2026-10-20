import { useState } from "react";
import {
  ActionIcon,
  Button,
  Divider,
  Group,
  Loader,
  Center,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import {
  IconCheck,
  IconDownload,
  IconPencil,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { useSettings, useUpdateSettings } from "../../hooks/useSettings";
import { useImportPriceList } from "../../hooks/useWhatsapp";
import { useNotifications } from "../../hooks/useNotifications";
import type { QuickReply } from "../../types/tenant-settings.types";

/**
 * Configurações de conteúdo do atendimento (dentro da engrenagem do inbox):
 * - Catálogo de preços: liga/desliga + mensagem editável + importar do catálogo.
 * - Respostas rápidas: lista editável.
 */
export function WhatsappConfigPanel() {
  const { data: settings, isLoading } = useSettings();

  if (isLoading) {
    return (
      <Center p="md">
        <Loader size="sm" />
      </Center>
    );
  }

  return (
    <WhatsappConfigEditor
      key={JSON.stringify(settings?.features ?? {})}
      initialQuickReplies={settings?.features?.quickReplies ?? []}
      initialPriceEnabled={settings?.features?.priceList?.enabled ?? false}
      initialPriceMessage={settings?.features?.priceList?.message ?? ""}
    />
  );
}

function WhatsappConfigEditor({
  initialQuickReplies,
  initialPriceEnabled,
  initialPriceMessage,
}: {
  initialQuickReplies: QuickReply[];
  initialPriceEnabled: boolean;
  initialPriceMessage: string;
}) {
  const updateMutation = useUpdateSettings();
  const importPriceList = useImportPriceList();
  const { showSuccess, showError } = useNotifications();

  const [priceEnabled, setPriceEnabled] = useState(initialPriceEnabled);
  const [priceMessage, setPriceMessage] = useState(initialPriceMessage);
  const [items, setItems] = useState<QuickReply[]>(initialQuickReplies);
  // Índices em modo de edição (expandido). Vazios/novos começam editando.
  const [editing, setEditing] = useState<Set<number>>(new Set());

  const addItem = () =>
    setItems((prev) => {
      const next = [...prev, { title: "", message: "" }];
      setEditing((e) => new Set(e).add(next.length - 1));
      return next;
    });
  const removeItem = (i: number) =>
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  const toggleEdit = (i: number) =>
    setEditing((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  const updateItem = (i: number, field: "title" | "message", value: string) =>
    setItems((prev) =>
      prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)),
    );

  const handleImport = () => {
    importPriceList.mutate(undefined, {
      onSuccess: ({ message }) => {
        setPriceMessage(message);
        setPriceEnabled(true);
      },
      onError: (err) => showError(err),
    });
  };

  const handleSave = () => {
    const cleaned = items
      .map((i) => ({ ...i, title: i.title.trim(), message: i.message.trim() }))
      .filter((i) => i.title && i.message);
    updateMutation.mutate(
      {
        features: {
          quickReplies: cleaned,
          priceList: { enabled: priceEnabled, message: priceMessage.trim() },
        },
      },
      {
        onSuccess: () => showSuccess("Configurações salvas."),
        onError: (err) => showError(err),
      },
    );
  };

  return (
    <Stack gap="lg">
      {/* Catálogo de preços */}
      <Stack gap="xs">
        <Group justify="space-between">
          <Title order={5}>Catálogo de preços</Title>
          <Switch
            checked={priceEnabled}
            onChange={(e) => setPriceEnabled(e.currentTarget.checked)}
            label={priceEnabled ? "Ativo" : "Desativado"}
          />
        </Group>
        <Text size="xs" c="dimmed">
          Quando ativo, aparece um botão no chat para preencher o input com esta
          mensagem (você revisa e envia).
        </Text>
        <Button
          size="xs"
          variant="light"
          leftSection={<IconDownload size={14} />}
          onClick={handleImport}
          loading={importPriceList.isPending}
          style={{ alignSelf: "flex-start" }}
        >
          Importar do catálogo
        </Button>
        <Textarea
          autosize
          minRows={4}
          maxRows={12}
          placeholder="Escreva a mensagem do catálogo ou importe dos serviços…"
          value={priceMessage}
          onChange={(e) => setPriceMessage(e.currentTarget.value)}
        />
      </Stack>

      <Divider />

      {/* Respostas rápidas */}
      <Stack gap="xs">
        <Title order={5}>Respostas rápidas</Title>
        <Text size="xs" c="dimmed">
          Mensagens prontas que preenchem o input no chat.
        </Text>
        {items.length === 0 && (
          <Text size="sm" c="dimmed">
            Nenhuma cadastrada ainda.
          </Text>
        )}
        {items.map((item, index) => {
          const isEditing = editing.has(index) || !item.title.trim();
          if (!isEditing) {
            return (
              <Group
                key={index}
                justify="space-between"
                wrap="nowrap"
                gap="xs"
                p="xs"
                style={{
                  border: "1px solid var(--mantine-color-gray-2)",
                  borderRadius: 8,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <Text size="sm" fw={600} truncate>
                    {item.title}
                  </Text>
                  <Text size="xs" c="dimmed" truncate>
                    {item.message}
                  </Text>
                </div>
                <Group gap={4} wrap="nowrap">
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    onClick={() => toggleEdit(index)}
                    aria-label="Editar"
                  >
                    <IconPencil size={16} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() => removeItem(index)}
                    aria-label="Remover"
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Group>
            );
          }
          return (
            <Group key={index} align="flex-start" gap="xs" wrap="nowrap">
              <Stack gap={4} style={{ flex: 1 }}>
                <TextInput
                  size="xs"
                  placeholder="Título (ex.: Endereço)"
                  value={item.title}
                  onChange={(e) =>
                    updateItem(index, "title", e.currentTarget.value)
                  }
                />
                <Textarea
                  size="xs"
                  autosize
                  minRows={2}
                  maxRows={6}
                  placeholder="Mensagem"
                  value={item.message}
                  onChange={(e) =>
                    updateItem(index, "message", e.currentTarget.value)
                  }
                />
              </Stack>
              <Stack gap={4}>
                {item.title.trim() && (
                  <ActionIcon
                    variant="subtle"
                    color="teal"
                    onClick={() => toggleEdit(index)}
                    aria-label="Concluir edição"
                  >
                    <IconCheck size={16} />
                  </ActionIcon>
                )}
                <ActionIcon
                  color="red"
                  variant="light"
                  onClick={() => removeItem(index)}
                  aria-label="Remover"
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Stack>
            </Group>
          );
        })}
        <Button
          size="xs"
          variant="light"
          leftSection={<IconPlus size={14} />}
          onClick={addItem}
          style={{ alignSelf: "flex-start" }}
        >
          Adicionar resposta
        </Button>
      </Stack>

      <Button
        color="teal"
        onClick={handleSave}
        loading={updateMutation.isPending}
      >
        Salvar configurações
      </Button>
    </Stack>
  );
}
