import {
  Avatar,
  Box,
  Center,
  ColorInput,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { useEffect, useState } from 'react';
import type { LoginBranding } from '../../types/branding.types';
import { createLoginBackground } from '../../utils/theme.util';
import {
  backofficeColorInputStyles,
  backofficeColors,
  backofficeInputStyles,
} from '../utils/backoffice-theme.util';
import { OperationalAreaPreview } from './OperationalAreaPreview';

interface BrandingFormFieldsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturnType<any>;
  prefix?: string;
  showPreview?: boolean;
  /** login = tela de login do portal; operational = área logada da filial */
  previewVariant?: 'login' | 'operational';
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

  useEffect(() => {
    setLogoFailed(false);
  }, [logoSrc]);

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

export function BrandingFormFields({
  form,
  prefix,
  showPreview = true,
  previewVariant = 'login',
}: BrandingFormFieldsProps) {
  const displayNamePath = getFieldPath(prefix, 'displayName');
  const logoUrlPath = getFieldPath(prefix, 'logoUrl');
  const primaryColorPath = getFieldPath(prefix, 'primaryColor');
  const accentColorPath = getFieldPath(prefix, 'accentColor');

  const branding = getNestedBranding(form.values, prefix);
  const logoUrlValue = (form.getInputProps(logoUrlPath).value as string | null) ?? '';

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
        </Stack>
      </Group>
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
