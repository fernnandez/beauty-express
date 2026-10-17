import {
  Avatar,
  Box,
  Button,
  Card,
  ColorInput,
  Group,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSettings, useUpdateSettings } from "../hooks/useSettings";
import { useNotifications } from "../hooks/useNotifications";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

interface BrandingFormValues {
  displayName: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  periodMode: "biweekly" | "monthly";
  payoutDays: string;
}

function resolveLogoSrc(logoUrl: string): string {
  const trimmed = logoUrl.trim();
  return trimmed || "/logo.png";
}

export function Settings() {
  const { data: settings, isLoading } = useSettings();
  const updateMutation = useUpdateSettings();
  const { refreshUser } = useAuth();
  const { showSuccess, showError } = useNotifications();

  const form = useForm<BrandingFormValues>({
    initialValues: {
      displayName: "",
      logoUrl: "",
      primaryColor: "#e64980",
      accentColor: "#faf5ff",
      periodMode: "biweekly",
      payoutDays: "",
    },
    validate: {
      displayName: (value) =>
        value.trim().length === 0 ? "Informe o nome do estabelecimento" : null,
      primaryColor: (value) =>
        HEX_COLOR.test(value) ? null : "Cor inválida (use #RRGGBB)",
      accentColor: (value) =>
        HEX_COLOR.test(value) ? null : "Cor inválida (use #RRGGBB)",
    },
  });

  // Preenche o formulário quando as settings carregam.
  useEffect(() => {
    if (settings) {
      form.setValues({
        displayName: settings.branding.displayName ?? "",
        logoUrl: settings.branding.logoUrl ?? "",
        primaryColor: settings.branding.primaryColor ?? "#e64980",
        accentColor: settings.branding.accentColor ?? "#faf5ff",
        periodMode: settings.features?.periodMode ?? "biweekly",
        payoutDays: (settings.features?.commissionPayoutDays ?? []).join(", "),
      });
      form.resetDirty();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const handleSubmit = form.onSubmit(async (values) => {
    try {
      const parsedDays = values.payoutDays
        .split(/[,\s]+/)
        .map((d) => parseInt(d, 10))
        .filter((d) => Number.isInteger(d) && d >= 1 && d <= 31);

      await updateMutation.mutateAsync({
        branding: {
          displayName: values.displayName.trim(),
          // logoUrl ainda não é editável por aqui — não enviado no payload.
          primaryColor: values.primaryColor,
          accentColor: values.accentColor,
        },
        features: {
          periodMode: values.periodMode,
          commissionPayoutDays: parsedDays,
        },
      });
      // Atualiza o usuário para refletir o branding no menu/favicon.
      await refreshUser();
      form.resetDirty();
      showSuccess("Configurações salvas com sucesso!");
    } catch {
      showError("Erro ao salvar as configurações");
    }
  });

  if (isLoading) {
    return (
      <Box style={{ width: "100%", padding: "var(--mantine-spacing-md)" }}>
        <Text>Carregando...</Text>
      </Box>
    );
  }

  const values = form.getValues();

  return (
    <Box
      style={{ width: "100%", paddingInline: "var(--mantine-spacing-md)" }}
      pb="xl"
    >
      <Stack gap={2} mb="xl">
        <Title order={1} c="brand">
          Configurações
        </Title>
        <Text c="dimmed">
          Personalize a identidade do seu estabelecimento.
        </Text>
      </Stack>

      <form onSubmit={handleSubmit}>
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
          {/* Formulário */}
          <Card padding="xl" radius="lg" shadow="sm">
            <Stack gap="md">
              <Title order={4}>Identidade visual</Title>

              <TextInput
                label="Nome do estabelecimento"
                placeholder="Ex.: Espaço Bella"
                withAsterisk
                {...form.getInputProps("displayName")}
              />

              <TextInput
                label="URL do logo"
                placeholder="/logo.png ou https://..."
                description="Em breve: edição do logo estará disponível"
                disabled
                {...form.getInputProps("logoUrl")}
              />

              <Group grow align="flex-start">
                <ColorInput
                  label="Cor primária"
                  format="hex"
                  swatches={[
                    "#e64980",
                    "#bc5675",
                    "#7950f2",
                    "#228be6",
                    "#12b886",
                  ]}
                  {...form.getInputProps("primaryColor")}
                />
                <ColorInput
                  label="Cor de destaque"
                  format="hex"
                  swatches={[
                    "#faf5ff",
                    "#fdf2f8",
                    "#f3f0ff",
                    "#edf2ff",
                    "#e6fcf5",
                  ]}
                  {...form.getInputProps("accentColor")}
                />
              </Group>

              <Group justify="flex-end" mt="sm">
                <Button
                  type="submit"
                  color="brand"
                  loading={updateMutation.isPending}
                  disabled={!form.isDirty()}
                >
                  Salvar alterações
                </Button>
              </Group>
            </Stack>
          </Card>

          {/* Pré-visualização */}
          <Card padding="xl" radius="lg" shadow="sm">
            <Stack gap="md">
              <Title order={4}>Pré-visualização</Title>
              <Box
                p="xl"
                style={{
                  borderRadius: 16,
                  background: `linear-gradient(135deg, ${values.primaryColor} 0%, ${values.accentColor} 100%)`,
                }}
              >
                <Group gap="md" align="center">
                  <Avatar
                    src={resolveLogoSrc(values.logoUrl)}
                    alt="Logo"
                    size={64}
                    radius="md"
                    bg="white"
                  >
                    {(values.displayName || "?").slice(0, 1).toUpperCase()}
                  </Avatar>
                  <Title order={3} c="white">
                    {values.displayName || "Nome do estabelecimento"}
                  </Title>
                </Group>
              </Box>
              <Text size="sm" c="dimmed">
                As cores e o logo aparecem no menu lateral, na tela de login e
                nos relatórios do seu estabelecimento.
              </Text>
            </Stack>
          </Card>

          {/* Período e pagamentos */}
          <Card padding="xl" radius="lg" shadow="sm">
            <Stack gap="md">
              <Title order={4}>Período e pagamentos</Title>
              <Text size="sm" c="dimmed">
                Define como o período aparece no app e quando as comissões
                vencem (usado nos alertas de atraso).
              </Text>

              <Stack gap={6}>
                <Text size="sm" fw={500}>
                  Regime de período
                </Text>
                <SegmentedControl
                  value={values.periodMode}
                  onChange={(v) =>
                    form.setFieldValue(
                      "periodMode",
                      v as "biweekly" | "monthly",
                    )
                  }
                  data={[
                    { value: "biweekly", label: "Quinzenal" },
                    { value: "monthly", label: "Mensal" },
                  ]}
                />
                <Text size="xs" c="dimmed">
                  {values.periodMode === "biweekly"
                    ? "Pagamentos no dia 15 e no fim do mês."
                    : "Pagamento no fim do mês."}
                </Text>
              </Stack>

              <TextInput
                label="Dias de pagamento (opcional)"
                placeholder={
                  values.periodMode === "biweekly" ? "15, 30" : "30"
                }
                description="Deixe vazio para usar o padrão do regime. Ex.: 15, 30"
                {...form.getInputProps("payoutDays")}
              />

              <Group justify="flex-end" mt="sm">
                <Button
                  type="submit"
                  color="brand"
                  loading={updateMutation.isPending}
                  disabled={!form.isDirty()}
                >
                  Salvar alterações
                </Button>
              </Group>
            </Stack>
          </Card>
        </SimpleGrid>
      </form>
    </Box>
  );
}
