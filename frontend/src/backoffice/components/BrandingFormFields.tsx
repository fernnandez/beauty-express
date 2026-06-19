import {
  Box,
  ColorInput,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import type { LoginBranding } from '../../types/branding.types';
import { createLoginBackground } from '../../utils/theme.util';

interface BrandingFormFieldsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturnType<any>;
  prefix?: string;
  showPreview?: boolean;
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

export function BrandingFormFields({
  form,
  prefix,
  showPreview = true,
}: BrandingFormFieldsProps) {
  const displayNamePath = getFieldPath(prefix, 'displayName');
  const logoUrlPath = getFieldPath(prefix, 'logoUrl');
  const faviconUrlPath = getFieldPath(prefix, 'faviconUrl');
  const primaryColorPath = getFieldPath(prefix, 'primaryColor');
  const accentColorPath = getFieldPath(prefix, 'accentColor');

  const branding = getNestedBranding(form.values, prefix);

  return (
    <Stack gap="md">
      <TextInput
        label="Nome exibido"
        placeholder="Maria Borboleta"
        {...form.getInputProps(displayNamePath)}
      />
      <TextInput
        label="URL do logo"
        placeholder="/logo.png ou https://..."
        description="Caminho relativo ou URL absoluta"
        {...form.getInputProps(logoUrlPath)}
      />
      <TextInput
        label="URL do favicon"
        placeholder="Opcional"
        {...form.getInputProps(faviconUrlPath)}
      />
      <Group grow align="flex-start">
        <ColorInput
          label="Cor primária"
          format="hex"
          swatches={['#e64980', '#7950f2', '#1a1a2e', '#228be6', '#12b886']}
          {...form.getInputProps(primaryColorPath)}
        />
        <ColorInput
          label="Cor de destaque"
          format="hex"
          swatches={['#faf5ff', '#f3f0ff', '#f5f5f5', '#edf2ff', '#e6fcf5']}
          {...form.getInputProps(accentColorPath)}
        />
      </Group>

      {showPreview && branding && (
        <Paper withBorder p="md" radius="md" style={{ borderColor: '#334155' }}>
          <Stack gap="xs">
            <Title order={5} c="dimmed">
              Pré-visualização
            </Title>
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
              <Text fw={700} size="lg" c={branding.primaryColor}>
                {branding.displayName || 'Nome da marca'}
              </Text>
              <Text size="sm" c="dimmed">
                Exemplo de tela de login / área logada
              </Text>
            </Box>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
