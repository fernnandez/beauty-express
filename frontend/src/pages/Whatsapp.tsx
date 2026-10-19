import { useEffect, useRef, useState } from "react";
import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Center,
  Group,
  Image,
  Loader,
  Modal,
  Paper,
  ScrollArea,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconArrowLeft,
  IconBrandWhatsapp,
  IconCalendarCheck,
  IconLink,
  IconMessagePlus,
  IconPlugConnectedX,
  IconReportMoney,
  IconSend,
  IconSettings,
  IconUserPlus,
} from "@tabler/icons-react";
import {
  useConversations,
  useCreateWhatsappInstance,
  useDisconnectWhatsapp,
  useLinkConversation,
  useMarkConversationRead,
  useMessages,
  useSendMessage,
  useSendPriceList,
  useStartConversation,
  useWhatsappInstance,
  useWhatsappQr,
} from "../hooks/useWhatsapp";
import type {
  Client,
  Conversation,
  ConversationCategory,
  MessageType,
  WhatsappQr,
} from "../types";
import { ClientPickerModal } from "../components/client/ClientPickerModal";
import { TodayAppointmentsModal } from "../components/whatsapp/TodayAppointmentsModal";
import { formatBrazilianPhone } from "../utils/phone.util";

const WA_GREEN = "#25D366";

const MEDIA_LABELS: Partial<Record<MessageType, string>> = {
  image: "[imagem]",
  sticker: "[figurinha]",
  audio: "[áudio]",
  video: "[vídeo]",
  document: "[arquivo]",
  location: "[localização]",
  contact: "[contato]",
};

function mediaLabel(type: MessageType): string {
  return MEDIA_LABELS[type] ?? "[mensagem]";
}

const CATEGORY_META: Record<
  ConversationCategory,
  { label: string; color: string }
> = {
  scheduled: { label: "Agendado", color: "teal" },
  client: { label: "Cliente", color: "blue" },
  lead: { label: "Novo contato", color: "gray" },
};

type BucketFilter = "all" | ConversationCategory;

/** Iniciais para o avatar do contato. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function Whatsapp() {
  const { data: instance, isLoading } = useWhatsappInstance();
  const connected = instance?.status === "connected";

  if (isLoading) {
    return (
      <Center h="100%">
        <Loader />
      </Center>
    );
  }

  return connected ? (
    <Inbox phoneNormalized={instance?.phoneNormalized} />
  ) : (
    <ConnectPanel status={instance?.status} />
  );
}

/* -------------------------------------------------------------------------- */
/* Conexão (pareamento via QR)                                                */
/* -------------------------------------------------------------------------- */

function ConnectPanel({ status }: { status?: string }) {
  const createInstance = useCreateWhatsappInstance();
  const started = status === "connecting" || createInstance.isSuccess;
  const qrQuery = useWhatsappQr(started);
  const qr: WhatsappQr | undefined = qrQuery.data;
  const qrLoading = qrQuery.isLoading;

  return (
    <Center h="100%" p="md">
      <Card withBorder shadow="sm" radius="lg" p="xl" maw={440} w="100%">
        <Stack align="center" gap="md">
          <ThemeIcon
            size={64}
            radius="xl"
            variant="light"
            color="teal"
            style={{ color: WA_GREEN }}
          >
            <IconBrandWhatsapp size={36} />
          </ThemeIcon>
          <Title order={3} ta="center">
            Conectar o WhatsApp
          </Title>
          <Text c="dimmed" ta="center" size="sm">
            Conecte o número do seu estabelecimento para atender os clientes por
            aqui. Abra o WhatsApp no celular, vá em <b>Aparelhos conectados</b> e
            escaneie o código.
          </Text>

          {!started && (
            <Button
              leftSection={<IconBrandWhatsapp size={18} />}
              color="teal"
              radius="md"
              size="md"
              onClick={() => createInstance.mutate()}
              loading={createInstance.isPending}
            >
              Conectar WhatsApp
            </Button>
          )}

          {started && (
            <Stack align="center" gap="sm">
              {qrLoading && !qr?.base64 && <Loader size="sm" />}
              {qr?.base64 && (
                <Paper withBorder radius="md" p="sm">
                  <Image
                    src={qr.base64}
                    alt="QR code para parear o WhatsApp"
                    w={240}
                    h={240}
                    fit="contain"
                  />
                </Paper>
              )}
              {!qr?.base64 && qr?.code && (
                <Paper withBorder p="md" radius="md">
                  <Text size="sm" c="dimmed">
                    Código de pareamento:
                  </Text>
                  <Text fw={700} fz="xl" ta="center">
                    {qr.code}
                  </Text>
                </Paper>
              )}
              <Group gap={6} align="center">
                <Loader size="xs" color="teal" />
                <Text c="dimmed" size="xs">
                  Aguardando leitura… o status atualiza sozinho.
                </Text>
              </Group>
            </Stack>
          )}
        </Stack>
      </Card>
    </Center>
  );
}

/* -------------------------------------------------------------------------- */
/* Configurações do inbox (modal)                                             */
/* -------------------------------------------------------------------------- */

function SettingsModal({
  opened,
  onClose,
  phoneNormalized,
}: {
  opened: boolean;
  onClose: () => void;
  phoneNormalized?: string | null;
}) {
  const disconnect = useDisconnectWhatsapp();

  const handleDisconnect = () => {
    disconnect.mutate(undefined, { onSuccess: onClose });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Configurações do atendimento"
      radius="lg"
      centered
    >
      <Stack gap="lg">
        {/* Status da conexão */}
        <Paper withBorder radius="md" p="md">
          <Group justify="space-between" wrap="nowrap">
            <Group gap="sm" wrap="nowrap">
              <ThemeIcon
                variant="light"
                color="teal"
                radius="xl"
                size="lg"
                style={{ color: WA_GREEN }}
              >
                <IconBrandWhatsapp size={20} />
              </ThemeIcon>
              <div>
                <Text fw={600} size="sm">
                  WhatsApp conectado
                </Text>
                <Text size="xs" c="dimmed">
                  {phoneNormalized
                    ? formatBrazilianPhone(phoneNormalized)
                    : "Número conectado"}
                </Text>
              </div>
            </Group>
            <Badge color="teal" variant="light">
              Ativo
            </Badge>
          </Group>
        </Paper>

        {/* Ação de desconectar */}
        <div>
          <Text fw={600} size="sm" mb={4}>
            Desconectar número
          </Text>
          <Text size="xs" c="dimmed" mb="sm">
            O número para de receber e enviar mensagens pelo sistema até ser
            conectado novamente. As conversas já recebidas continuam salvas.
          </Text>
          <Button
            color="red"
            variant="light"
            radius="md"
            leftSection={<IconPlugConnectedX size={18} />}
            onClick={handleDisconnect}
            loading={disconnect.isPending}
          >
            Desconectar WhatsApp
          </Button>
        </div>
      </Stack>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Inbox (lista de conversas + chat)                                          */
/* -------------------------------------------------------------------------- */

function Inbox({ phoneNormalized }: { phoneNormalized?: string | null }) {
  const { data: conversations = [], isLoading } = useConversations();
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [bucket, setBucket] = useState<BucketFilter>("all");
  const [settingsOpened, { open: openSettings, close: closeSettings }] =
    useDisclosure(false);
  const [newOpened, { open: openNew, close: closeNew }] = useDisclosure(false);
  const [todayOpened, { open: openToday, close: closeToday }] =
    useDisclosure(false);
  const [draft, setDraft] = useState<string>("");
  const markRead = useMarkConversationRead();
  const startConversation = useStartConversation();

  const openConversation = (c: Conversation) => {
    setSelected(c);
    setDraft("");
    if (c.unreadCount > 0) {
      markRead.mutate(c.id);
    }
  };

  const handleStart = (client: Client) => {
    startConversation.mutate(client.id, {
      onSuccess: (conv) => {
        closeNew();
        setSelected(conv);
        setDraft("");
      },
    });
  };

  const handlePrepared = (conv: Conversation, text: string) => {
    closeToday();
    setSelected(conv);
    setDraft(text);
  };

  const filtered =
    bucket === "all"
      ? conversations
      : conversations.filter((c) => c.category === bucket);

  return (
    <Box
      h={{ base: "100%", sm: "calc(100% - 56px)", lg: "calc(100% - 42px)" }}
      p={{ base: 0, sm: "md" }}
    >
      <Card
        withBorder
        shadow="sm"
        radius="lg"
        p={0}
        h="100%"
        style={{ overflow: "hidden" }}
      >
        <Group h="100%" align="stretch" gap={0} wrap="nowrap">
          {/* Lista de conversas */}
          <Box
            w={{ base: "100%", sm: 330 }}
            display={{ base: selected ? "none" : "flex", sm: "flex" }}
            style={{
              flexDirection: "column",
              borderRight: "1px solid var(--mantine-color-gray-2)",
              overflow: "hidden",
            }}
          >
            <Group
              justify="space-between"
              px="md"
              py="sm"
              wrap="nowrap"
              style={{
                borderBottom: "1px solid var(--mantine-color-gray-2)",
                backgroundColor: "var(--mantine-color-gray-0)",
              }}
            >
              <Group gap="xs" wrap="nowrap">
                <ThemeIcon
                  variant="light"
                  color="teal"
                  radius="xl"
                  style={{ color: WA_GREEN }}
                >
                  <IconBrandWhatsapp size={18} />
                </ThemeIcon>
                <Title order={5}>Atendimento</Title>
              </Group>
              <Group gap={4} wrap="nowrap">
                <Tooltip label="Agendamentos de hoje" withArrow>
                  <ActionIcon
                    variant="subtle"
                    color="teal"
                    onClick={openToday}
                    aria-label="Agendamentos de hoje"
                  >
                    <IconCalendarCheck size={20} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Nova conversa" withArrow>
                  <ActionIcon
                    variant="subtle"
                    color="teal"
                    onClick={openNew}
                    aria-label="Nova conversa"
                  >
                    <IconMessagePlus size={20} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Configurações" withArrow>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    onClick={openSettings}
                    aria-label="Configurações do atendimento"
                  >
                    <IconSettings size={20} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>

            <Box
              px="sm"
              py="xs"
              style={{ borderBottom: "1px solid var(--mantine-color-gray-1)" }}
            >
              <SegmentedControl
                fullWidth
                size="xs"
                radius="md"
                value={bucket}
                onChange={(v) => setBucket(v as BucketFilter)}
                data={[
                  { label: "Todas", value: "all" },
                  { label: "Agendados", value: "scheduled" },
                  { label: "Leads", value: "lead" },
                ]}
              />
            </Box>

            <ScrollArea style={{ flex: 1 }}>
              {isLoading && (
                <Center p="xl">
                  <Loader size="sm" />
                </Center>
              )}
              {!isLoading && filtered.length === 0 && (
                <Text c="dimmed" size="sm" ta="center" p="xl">
                  {conversations.length === 0
                    ? "Nenhuma conversa ainda. Quando um cliente mandar mensagem, ela aparece aqui."
                    : "Nenhuma conversa nesta categoria."}
                </Text>
              )}
              <Stack gap={0}>
                {filtered.map((c) => (
                  <ConversationItem
                    key={c.id}
                    conversation={c}
                    active={selected?.id === c.id}
                    onClick={() => openConversation(c)}
                  />
                ))}
              </Stack>
            </ScrollArea>
          </Box>

          {/* Chat */}
          <Box
            style={{ flex: 1, minWidth: 0 }}
            display={{ base: selected ? "block" : "none", sm: "block" }}
          >
            {selected ? (
              <ChatView
                key={`${selected.id}:${draft}`}
                conversation={selected}
                initialDraft={draft}
                onBack={() => setSelected(null)}
              />
            ) : (
              <Center h="100%" bg="var(--mantine-color-gray-0)">
                <Stack align="center" gap="xs">
                  <ThemeIcon
                    size={56}
                    radius="xl"
                    variant="light"
                    color="teal"
                    style={{ color: WA_GREEN }}
                  >
                    <IconBrandWhatsapp size={30} />
                  </ThemeIcon>
                  <Text c="dimmed">Selecione uma conversa para começar</Text>
                </Stack>
              </Center>
            )}
          </Box>
        </Group>
      </Card>

      <SettingsModal
        opened={settingsOpened}
        onClose={closeSettings}
        phoneNormalized={phoneNormalized}
      />

      <ClientPickerModal
        opened={newOpened}
        onClose={closeNew}
        title="Nova conversa"
        confirmLabel="Iniciar conversa"
        loading={startConversation.isPending}
        onSelect={handleStart}
      />

      <TodayAppointmentsModal
        opened={todayOpened}
        onClose={closeToday}
        onPrepared={handlePrepared}
      />
    </Box>
  );
}

function ConversationItem({
  conversation,
  active,
  onClick,
}: {
  conversation: Conversation;
  active: boolean;
  onClick: () => void;
}) {
  const title =
    conversation.contactName ||
    formatBrazilianPhone(conversation.phoneNormalized);
  return (
    <Group
      onClick={onClick}
      px="md"
      py="sm"
      gap="sm"
      wrap="nowrap"
      style={{
        cursor: "pointer",
        backgroundColor: active ? "var(--mantine-color-teal-0)" : undefined,
        borderBottom: "1px solid var(--mantine-color-gray-1)",
        borderLeft: active
          ? `3px solid ${WA_GREEN}`
          : "3px solid transparent",
      }}
    >
      <Avatar radius="xl" color="teal" variant="light">
        {initials(title)}
      </Avatar>
      <Box style={{ flex: 1, minWidth: 0 }}>
        <Group justify="space-between" wrap="nowrap" gap="xs">
          <Text fw={600} truncate>
            {title}
          </Text>
          {conversation.unreadCount > 0 && (
            <Badge color="teal" size="sm" circle>
              {conversation.unreadCount}
            </Badge>
          )}
        </Group>
        {conversation.lastMessagePreview && (
          <Text size="sm" c="dimmed" truncate>
            {conversation.lastMessagePreview}
          </Text>
        )}
        {conversation.category && (
          <Badge
            mt={4}
            size="xs"
            variant="light"
            color={CATEGORY_META[conversation.category].color}
          >
            {CATEGORY_META[conversation.category].label}
          </Badge>
        )}
      </Box>
    </Group>
  );
}

function ChatView({
  conversation,
  initialDraft,
  onBack,
}: {
  conversation: Conversation;
  initialDraft?: string;
  onBack: () => void;
}) {
  const { data: messages = [], isLoading } = useMessages(conversation.id);
  const sendMessage = useSendMessage();
  const sendPriceList = useSendPriceList();
  const linkConversation = useLinkConversation();
  const [linkOpened, { open: openLink, close: closeLink }] =
    useDisclosure(false);
  const [text, setText] = useState(initialDraft ?? "");
  const viewport = useRef<HTMLDivElement>(null);

  const isClient = !!conversation.clientId;

  useEffect(() => {
    viewport.current?.scrollTo({ top: viewport.current.scrollHeight });
  }, [messages]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage.mutate(
      { conversationId: conversation.id, text: trimmed },
      { onSuccess: () => setText("") },
    );
  };

  const handleLink = (client: Client) => {
    linkConversation.mutate(
      { conversationId: conversation.id, clientId: client.id },
      { onSuccess: closeLink },
    );
  };

  const title =
    conversation.contactName ||
    formatBrazilianPhone(conversation.phoneNormalized);

  return (
    <Stack h="100%" gap={0}>
      {/* Cabeçalho */}
      <Group
        px="md"
        py="sm"
        gap="sm"
        wrap="nowrap"
        style={{
          borderBottom: "1px solid var(--mantine-color-gray-2)",
          backgroundColor: "var(--mantine-color-gray-0)",
        }}
      >
        <ActionIcon
          variant="subtle"
          color="gray"
          hiddenFrom="sm"
          onClick={onBack}
          aria-label="Voltar"
        >
          <IconArrowLeft size={20} />
        </ActionIcon>
        <Avatar radius="xl" color="teal" variant="light" size="md">
          {initials(title)}
        </Avatar>
        <div>
          <Group gap={6} wrap="nowrap">
            <Text fw={600}>{title}</Text>
            <Badge
              size="xs"
              variant="light"
              color={isClient ? "teal" : "gray"}
            >
              {isClient ? "Cliente" : "Novo contato"}
            </Badge>
          </Group>
          <Text size="xs" c="dimmed">
            {formatBrazilianPhone(conversation.phoneNormalized)}
          </Text>
        </div>
        <Box style={{ flex: 1 }} />
        {!isClient && (
          <Tooltip label="Vincular a um cliente" withArrow>
            <ActionIcon
              variant="light"
              color="blue"
              onClick={openLink}
              aria-label="Vincular a um cliente"
            >
              <IconUserPlus size={20} />
            </ActionIcon>
          </Tooltip>
        )}
        <Tooltip label="Enviar tabela de preços" withArrow>
          <ActionIcon
            variant="light"
            color="teal"
            onClick={() => sendPriceList.mutate(conversation.id)}
            loading={sendPriceList.isPending}
            aria-label="Enviar tabela de preços"
          >
            <IconReportMoney size={20} />
          </ActionIcon>
        </Tooltip>
      </Group>

      {!isClient && (
        <Group
          gap="xs"
          px="md"
          py="xs"
          wrap="nowrap"
          style={{ backgroundColor: "var(--mantine-color-blue-0)" }}
        >
          <IconLink size={16} color="var(--mantine-color-blue-6)" />
          <Text size="xs" c="blue.7" style={{ flex: 1 }}>
            Este contato ainda não é um cliente cadastrado.
          </Text>
          <Button
            size="compact-xs"
            variant="light"
            color="blue"
            onClick={openLink}
          >
            Vincular
          </Button>
        </Group>
      )}

      {/* Mensagens */}
      <ScrollArea
        style={{ flex: 1 }}
        viewportRef={viewport}
        p="md"
        bg="var(--mantine-color-gray-0)"
      >
        {isLoading && (
          <Center p="xl">
            <Loader size="sm" />
          </Center>
        )}
        <Stack gap={6}>
          {messages.map((m) => {
            const outbound = m.direction === "outbound";
            const isMedia =
              m.mediaUrl && (m.type === "image" || m.type === "sticker");
            return (
              <Box
                key={m.id}
                style={{
                  alignSelf: outbound ? "flex-end" : "flex-start",
                  maxWidth: "78%",
                }}
              >
                <Paper
                  p={isMedia ? 4 : "xs"}
                  px={isMedia ? 4 : "sm"}
                  radius="lg"
                  shadow="xs"
                  bg={outbound ? "teal.1" : "white"}
                >
                  {isMedia ? (
                    <Image
                      src={m.mediaUrl as string}
                      alt={m.type === "sticker" ? "Figurinha" : "Imagem"}
                      w={m.type === "sticker" ? 120 : 220}
                      fit="contain"
                      radius="md"
                    />
                  ) : (
                    <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                      {m.content || mediaLabel(m.type)}
                    </Text>
                  )}
                </Paper>
              </Box>
            );
          })}
        </Stack>
      </ScrollArea>

      {/* Campo de envio */}
      <Group
        p="sm"
        gap="xs"
        wrap="nowrap"
        style={{ borderTop: "1px solid var(--mantine-color-gray-2)" }}
      >
        <TextInput
          style={{ flex: 1 }}
          radius="xl"
          placeholder="Escreva uma mensagem…"
          value={text}
          onChange={(e) => setText(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <ActionIcon
          size={38}
          radius="xl"
          color="teal"
          onClick={handleSend}
          loading={sendMessage.isPending}
          aria-label="Enviar"
        >
          <IconSend size={18} />
        </ActionIcon>
      </Group>

      <ClientPickerModal
        opened={linkOpened}
        onClose={closeLink}
        title="Vincular a um cliente"
        confirmLabel="Vincular"
        allowCreate
        defaultPhone={conversation.phoneNormalized}
        defaultName={conversation.contactName ?? undefined}
        loading={linkConversation.isPending}
        onSelect={handleLink}
      />
    </Stack>
  );
}
