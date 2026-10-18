import {
  ActionIcon,
  Button,
  Card,
  Group,
  List,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconBrandAndroid,
  IconBrandApple,
  IconDeviceDesktop,
  IconDownload,
  IconShare2,
  IconSquarePlus,
  IconX,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";

type Platform = "ios" | "android" | "desktop";

const DISMISS_KEY = "ageendoo_pwa_prompt_dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function detectPlatform(): Platform {
  const ua = window.navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "desktop";
}

/**
 * No iOS, só o Safari instala PWA. Chrome/Firefox/Edge no iPhone (crios/fxios/
 * edgios) não conseguem — e usam o Safari como engine, mas sem o fluxo de
 * "Adicionar à Tela de Início".
 */
function isIosSafari(): boolean {
  const ua = window.navigator.userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(ua);
  const isOtherBrowser = /crios|fxios|edgios|opios/.test(ua);
  return isIos && !isOtherBrowser;
}

/** True quando o app já está rodando instalado (standalone). */
function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

const platformConfig: Record<
  Platform,
  { icon: typeof IconBrandAndroid; label: string }
> = {
  ios: { icon: IconBrandApple, label: "iPhone / iPad" },
  android: { icon: IconBrandAndroid, label: "Android" },
  desktop: { icon: IconDeviceDesktop, label: "Computador" },
};

/**
 * Card dismissível que ajuda a instalar o app como PWA.
 * - Android/Desktop: botão que dispara o prompt nativo (beforeinstallprompt).
 * - iOS: instruções passo a passo (Compartilhar → Adicionar à Tela de Início).
 */
export function PwaInstallPrompt() {
  const [platform] = useState<Platform>(detectPlatform);
  const [iosSafari] = useState<boolean>(isIosSafari);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISS_KEY) === "1") {
      return;
    }

    const current = detectPlatform();

    // iOS não emite beforeinstallprompt: mostramos as instruções direto.
    if (current === "ios") {
      setVisible(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installed = () => {
      notifications.show({
        title: "App instalado",
        message: "O Ageendoo foi adicionado ao seu dispositivo.",
        color: "green",
      });
      setVisible(false);
    };
    window.addEventListener("appinstalled", installed);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) {
      notifications.show({
        title: "Instalação indisponível",
        message:
          "Abra pelo Chrome em uma conexão segura (HTTPS) para instalar.",
        color: "yellow",
      });
      return;
    }
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      notifications.show({
        title: "Instalando...",
        message: "O Ageendoo está sendo adicionado à sua tela inicial.",
        color: "green",
      });
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!visible) return null;

  const PlatformIcon = platformConfig[platform].icon;

  return (
    <Card
      withBorder
      radius="md"
      shadow="md"
      padding="md"
      style={{
        position: "fixed",
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: 2000,
        maxWidth: 420,
        marginInline: "auto",
      }}
    >
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Group gap="sm" wrap="nowrap" align="flex-start">
          <ThemeIcon size={42} radius="md" variant="light" color="brand">
            <PlatformIcon size={24} />
          </ThemeIcon>
          <Stack gap={2}>
            <Text fw={700}>Instalar o Ageendoo</Text>
            <Text size="sm" c="dimmed">
              Tenha o app na tela inicial, abrindo em tela cheia.
            </Text>
          </Stack>
        </Group>
        <ActionIcon variant="subtle" color="gray" onClick={dismiss} aria-label="Fechar">
          <IconX size={18} />
        </ActionIcon>
      </Group>

      {platform === "ios" ? (
        iosSafari ? (
          <Stack gap={6} mt="md">
            <List spacing={6} size="sm" center>
              <List.Item
                icon={
                  <ThemeIcon size={22} radius="xl" variant="light" color="blue">
                    <IconShare2 size={14} />
                  </ThemeIcon>
                }
              >
                Toque em <strong>Compartilhar</strong> na barra do Safari.
              </List.Item>
              <List.Item
                icon={
                  <ThemeIcon size={22} radius="xl" variant="light" color="grape">
                    <IconSquarePlus size={14} />
                  </ThemeIcon>
                }
              >
                Escolha <strong>Adicionar à Tela de Início</strong>.
              </List.Item>
            </List>
          </Stack>
        ) : (
          <Stack gap={6} mt="md">
            <Text size="sm">
              No iPhone, a instalação só funciona pelo <strong>Safari</strong>.
              Abra este mesmo endereço no Safari e toque em{" "}
              <strong>Compartilhar → Adicionar à Tela de Início</strong>.
            </Text>
          </Stack>
        )
      ) : (
        <Button
          mt="md"
          fullWidth
          leftSection={<IconDownload size={18} />}
          onClick={handleAndroidInstall}
        >
          Instalar app
        </Button>
      )}
    </Card>
  );
}
