import {
  Avatar,
  Box,
  Button,
  Center,
  ColorInput,
  FileButton,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { useState } from 'react';
import { IconUpload } from '@tabler/icons-react';
import type { LoginBranding } from '../../types/branding.types';
import { adminService } from '../../services/admin.service';
import { getErrorMessage } from '../../utils/error.util';
import { createLoginBackground } from '../../utils/theme.util';
import {
  backofficeColorInputStyles,
  backofficeColors,
  backofficeInputStyles,
} from '../utils/backoffice-theme.util';
import { OperationalAreaPreview } from './OperationalAreaPreview';

interface BrandingFormFieldsProps<T> {
  form: UseFormReturnType<T>;
  prefix?: string;
  showPreview?: boolean;
  /** login = tela de login; operational = área logada da filial */
  previewVariant?: 'login' | 'operational';
  /** Quando presente, habilita o upload da logo para o S3 desta filial. */
  tenantId?: string;
}

function getFieldPath(prefix: string | undefined, field: string): string {
  return prefix ? `${prefix}.${field}` : field;
}

function getNestedBranding(
  values: unknown,
  prefix?: string,
): LoginBranding | null {
  if (!prefix) {
    return values as LoginBranding;
  }

  const resolved = prefix.split('.').reduce<unknown>(
    (acc, key) =>
      acc && typeof acc === 'object'
        ? (acc as Record<string, unknown>)[key]
        : undefined,
    values,
  );

  if (!resolved || typeof resolved !== 'object') {
    return null;
  }

  const branding = resolved as LoginBranding;
  if (!branding.primaryColor || !branding.accentColor) {
    return null;
  }

  return branding;
}

function resolveLogoSrc(logoUrl?: string | null): string {
  const trimmed = logoUrl?.trim();
  return trimmed || '/logo.png';
}

function LoginBrandingPreview({ branding }: { branding: LoginBranding }) {
  const logoSrc = resolveLogoSrc(branding.logoUrl);
  const [logoFailed, setLogoFailed] = useState(false);
  // Ajusta estado derivado durante o render ao trocar o logo, sem useEffect
  // (padrão recomendado pelo React para "resetar estado quando a prop muda").
  const [lastLogoSrc, setLastLogoSrc] = useState(logoSrc);
  if (logoSrc !== lastLogoSrc) {
    setLastLogoSrc(logoSrc);
    setLogoFailed(false);
  }

  return (
    <Center>
      <Paper
        shadow="sm"
        radius="lg"
        p="lg"
        w="100%"
        maw={320}
        withBorder
        style={{
          borderColor: '#e9ecef',
          backgroundColor: '#ffffff',
        }}
      >
        <Stack gap="sm" align="center">
          <Avatar
            src={logoFailed ? undefined : logoSrc}
            alt={branding.displayName}
            size={64}
            radius="md"
            imageProps={{
              onError: () => setLogoFailed(true),
            }}
          >
            {(branding.displayName || '?').slice(0, 1).toUpperCase()}
          </Avatar>
          <Title order={3} ta="center" c={branding.primaryColor}>
            {branding.displayName || 'Nome da marca'}
          </Title>
          <Text size="sm" c="dimmed" ta="center">
            Entre com seu e-mail e senha
          </Text>
          {logoFailed && branding.logoUrl?.trim() && (
            <Text size="xs" c="red" ta="center">
              Não foi possível carregar o logo desta URL
            </Text>
          )}
        </Stack>
      </Paper>
    </Center>
  );
}

export function BrandingFormFields<T>({
  form,
  prefix,
  showPreview = true,
  previewVariant = "login",
  tenantId,
}: BrandingFormFieldsProps<T>) {
  const displayNamePath = getFieldPath(prefix, 'displayName');
  const logoUrlPath = getFieldPath(prefix, 'logoUrl');
  const primaryColorPath = getFieldPath(prefix, 'primaryColor');
  const accentColorPath = getFieldPath(prefix, 'accentColor');

  const branding = getNestedBranding(form.values, prefix);
  const logoUrlValue = (form.getInputProps(logoUrlPath).value as string | null) ?? '';

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleLogoUpload = async (file: File | null) => {
    if (!file || !tenantId) return;
    setUploadError(null);
    setUploading(true);
    try {
      const { url } = await adminService.uploadTenantLogo(tenantId, file);
      form.setFieldValue(
        logoUrlPath as never,
        url as never,
      );
    } catch (err) {
      setUploadError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Stack gap="md">
      <TextInput
        label="Nome exibido"
        placeholder="Nome da filial ou marca"
        styles={backofficeInputStyles}
        {...form.getInputProps(displayNamePath)}
      />
      <Group align="flex-end" wrap="nowrap" gap="md">
        <TextInput
          label="URL do logo"
          placeholder="/logo.png ou https://..."
          description="Usado na interface e como favicon da aba do navegador"
          style={{ flex: 1 }}
          styles={backofficeInputStyles}
          {...form.getInputProps(logoUrlPath)}
        />
        <Stack gap={4} align="center" pb={4}>
          <Text size="xs" c="dimmed">
            Logo
          </Text>
          <Avatar
            src={resolveLogoSrc(logoUrlValue)}
            alt="Pré-visualização do logo"
            size={52}
            radius="md"
          />
          {tenantId && (
            <FileButton
              onChange={handleLogoUpload}
              accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
            >
              {(props) => (
                <Button
                  {...props}
                  size="xs"
                  variant="light"
                  color="violet"
                  loading={uploading}
                  leftSection={<IconUpload size={14} />}
                >
                  Enviar
                </Button>
              )}
            </FileButton>
          )}
        </Stack>
      </Group>
      {uploadError && (
        <Text size="xs" c="red">
          {uploadError}
        </Text>
      )}
      <Group grow align="flex-start">
        <ColorInput
          label="Cor primária"
          format="hex"
          swatches={['#e64980', '#7950f2', '#1a1a2e', '#228be6', '#12b886']}
          styles={backofficeColorInputStyles}
          {...form.getInputProps(primaryColorPath)}
        />
        <ColorInput
          label="Cor de destaque"
          format="hex"
          swatches={['#faf5ff', '#f3f0ff', '#f5f5f5', '#edf2ff', '#e6fcf5']}
          styles={backofficeColorInputStyles}
          {...form.getInputProps(accentColorPath)}
        />
      </Group>

      {showPreview && branding && (
        <Paper
          withBorder
          p="md"
          radius="md"
          style={{
            borderColor: backofficeColors.border,
            backgroundColor: backofficeColors.surfaceMuted,
          }}
        >
          <Stack gap="md">
            <Title order={5} c={backofficeColors.textMuted}>
              {previewVariant === 'operational'
                ? 'Pré-visualização da área logada'
                : 'Pré-visualização da tela de login'}
            </Title>
            {previewVariant === 'operational' ? (
              <OperationalAreaPreview branding={branding} />
            ) : (
              <Box
                p="lg"
                style={{
                  borderRadius: 8,
                  background: createLoginBackground(
                    branding.primaryColor,
                    branding.accentColor,
                  ),
                }}
              >
                <LoginBrandingPreview branding={branding} />
              </Box>
            )}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
