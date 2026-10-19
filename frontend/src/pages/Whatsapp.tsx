import { useEffect, useRef, useState } from "react";
import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Center,
  Divider,
  Group,
  Image,
  Loader,
  Menu,
  Modal,
  Paper,
  ScrollArea,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconArrowLeft,
  IconAlertCircle,
  IconBrandWhatsapp,
  IconCalendarCheck,
  IconCheck,
  IconChecks,
  IconClock,
  IconLink,
  IconMessagePlus,
  IconMessage2,
  IconMoodSmile,
  IconPlugConnectedX,
  IconReportMoney,
  IconSearch,
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
  useReactToMessage,
  useSendMessage,
  useStartConversation,
  useWhatsappInstance,
  useWhatsappQr,
  useWhatsappSocket,
} from "../hooks/useWhatsapp";
import type {
  Client,
  Conversation,
  ConversationCategory,
  MessageStatus,
  MessageType,
  WhatsappQr,
} from "../types";
import { ClientPickerModal } from "../components/client/ClientPickerModal";
import { TodayAppointmentsModal } from "../components/whatsapp/TodayAppointmentsModal";
import { WhatsappConfigPanel } from "../components/whatsapp/WhatsappConfigPanel";
import { UnofficialApiNotice } from "../components/whatsapp/UnofficialApiNotice";
import { useSettings } from "../hooks/useSettings";
import { formatBrazilianPhone } from "../utils/phone.util";

const WA_GREEN = "#25D366";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

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

/** Hora no formato HH:MM a partir do timestamp ISO da mensagem. */
function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Tiquinhos de status de entrega para mensagens enviadas (outbound). */
function MessageStatusIcon({ status }: { status: MessageStatus }) {
  if (status === "failed") {
    return <IconAlertCircle size={13} color="var(--mantine-color-red-6)" />;
  }
  if (status === "pending") {
    return <IconClock size={12} color="var(--mantine-color-gray-5)" />;
  }
  if (status === "read") {
    return <IconChecks size={14} color="var(--mantine-color-blue-5)" />;
  }
  if (status === "delivered") {
    return <IconChecks size={14} color="var(--mantine-color-gray-5)" />;
  }
  // sent
  return <IconCheck size={13} color="var(--mantine-color-gray-5)" />;
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

          <UnofficialApiNotice variant="full" />

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
      size="lg"
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

        <UnofficialApiNotice variant="compact" />

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

        <Divider />

        <WhatsappConfigPanel />
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
  const [search, setSearch] = useState("");
  useWhatsappSocket(true);
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

  const term = search.trim().toLowerCase();
  const termDigits = term.replace(/\D/g, "");
  const filtered = conversations.filter((c) => {
    if (bucket !== "all" && c.category !== bucket) return false;
    if (!term) return true;
    const name = (c.contactName ?? "").toLowerCase();
    const preview = (c.lastMessagePreview ?? "").toLowerCase();
    const phoneMatch =
      termDigits.length >= 3 && c.phoneNormalized.includes(termDigits);
    return name.includes(term) || preview.includes(term) || phoneMatch;
  });

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
              <TextInput
                size="xs"
                radius="xl"
                mb="xs"
                placeholder="Buscar conversa…"
                leftSection={<IconSearch size={14} />}
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
              />
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
  const linkConversation = useLinkConversation();
  const reactToMessage = useReactToMessage(conversation.id);
  const { data: settings } = useSettings();
  const quickReplies = settings?.features?.quickReplies ?? [];
  const priceList = settings?.features?.priceList;
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
        {quickReplies.length > 0 && (
          <Menu shadow="md" position="bottom-end" withArrow>
            <Menu.Target>
              <Tooltip label="Respostas rápidas" withArrow>
                <ActionIcon
                  variant="light"
                  color="gray"
                  aria-label="Respostas rápidas"
                >
                  <IconMessage2 size={20} />
                </ActionIcon>
              </Tooltip>
            </Menu.Target>
            <Menu.Dropdown style={{ maxWidth: 280 }}>
              <Menu.Label>Respostas rápidas</Menu.Label>
              {quickReplies.map((qr, i) => (
                <Menu.Item
                  key={qr.id ?? i}
                  onClick={() => setText(qr.message)}
                >
                  {qr.title}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
        )}
        {priceList?.enabled && priceList.message && (
          <Tooltip label="Catálogo de preços" withArrow>
            <ActionIcon
              variant="light"
              color="teal"
              onClick={() => setText(priceList.message)}
              aria-label="Catálogo de preços"
            >
              <IconReportMoney size={20} />
            </ActionIcon>
          </Tooltip>
        )}
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
              <Group
                key={m.id}
                gap={4}
                wrap="nowrap"
                align="center"
                style={{
                  alignSelf: outbound ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  flexDirection: outbound ? "row-reverse" : "row",
                }}
                className="wa-msg-row"
              >
                <Box
                  style={{
                    position: "relative",
                    marginBottom: m.reaction ? 10 : 0,
                    minWidth: 0,
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
                  <Group gap={4} justify="flex-end" align="center" mt={2}>
                    <Text span fz={10} c="dimmed">
                      {formatTime(m.timestamp)}
                    </Text>
                    {outbound && <MessageStatusIcon status={m.status} />}
                  </Group>
                </Paper>
                {m.reaction && (
                  <Box
                    style={{
                      position: "absolute",
                      bottom: -12,
                      [outbound ? "right" : "left"]: 8,
                      backgroundColor: "white",
                      border: "1px solid var(--mantine-color-gray-2)",
                      borderRadius: 999,
                      padding: "0 4px",
                      fontSize: 13,
                      lineHeight: "18px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                    }}
                  >
                    {m.reaction}
                  </Box>
                )}
                </Box>

                <Menu shadow="md" position="top" withArrow>
                  <Menu.Target>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="gray"
                      className="wa-react-btn"
                      aria-label="Reagir"
                    >
                      <IconMoodSmile size={16} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Group gap={2} wrap="nowrap" px={4}>
                      {QUICK_REACTIONS.map((emoji) => (
                        <ActionIcon
                          key={emoji}
                          variant="subtle"
                          size="lg"
                          onClick={() =>
                            reactToMessage.mutate({
                              messageId: m.id,
                              emoji: m.reaction === emoji ? "" : emoji,
                            })
                          }
                          aria-label={`Reagir ${emoji}`}
                        >
                          <span style={{ fontSize: 18 }}>{emoji}</span>
                        </ActionIcon>
                      ))}
                    </Group>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            );
          })}
        </Stack>
      </ScrollArea>

      {/* Campo de envio */}
      <Group
        p="sm"
        gap="xs"
        wrap="nowrap"
        align="flex-end"
        style={{ borderTop: "1px solid var(--mantine-color-gray-2)" }}
      >
        <Textarea
          style={{ flex: 1 }}
          radius="lg"
          autosize
          minRows={1}
          maxRows={5}
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
