import {
  Button,
  Card,
  Divider,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useEffect } from 'react';
import { BrandingFormFields } from '../components/BrandingFormFields';
import { TenantFeaturesFormFields } from '../components/TenantFeaturesFormFields';
import { useAdminPortals } from '../hooks/useAdminPortals';
import { useUpdateTenant } from '../hooks/useAdminTenants';
import {
  DEFAULT_TENANT_SETTINGS,
  normalizeTenantSettings,
} from '../utils/settings.util';
import { getErrorMessage } from '../../utils/error.util';
import type { TenantDetail, UpdateTenantDto } from '../../types/admin.types';
import type { TenantSettings } from '../../types/tenant-settings.types';

type TenantConfigFormValues = {
  name: string;
  slug: string;
  portalId: string;
  settings: TenantSettings;
};

function toFormValues(tenant: TenantDetail): TenantConfigFormValues {
  return {
    name: tenant.name,
    slug: tenant.slug,
    portalId: tenant.portalId,
    settings: normalizeTenantSettings(tenant.settings, tenant.name),
  };
}

export function TenantConfigTab({ tenant }: { tenant: TenantDetail }) {
  const { data: portals } = useAdminPortals();
  const updateMutation = useUpdateTenant();

  const form = useForm<TenantConfigFormValues>({
    initialValues: toFormValues(tenant),
    validate: {
      name: (value) => (value.trim().length > 0 ? null : 'Nome obrigatório'),
      slug: (value) =>
        /^[a-z0-9-]+$/.test(value)
          ? null
          : 'Use apenas letras minúsculas, números e hífens',
      portalId: (value) => (value ? null : 'Selecione um portal'),
    },
  });

  useEffect(() => {
    form.setValues(toFormValues(tenant));
  }, [tenant.id, tenant.name, tenant.slug, tenant.portalId, tenant.settings]);

  const handleSubmit = form.onSubmit(async (values) => {
    try {
      const payload: UpdateTenantDto = {
        name: values.name,
        slug: values.slug,
        portalId: values.portalId,
        settings: values.settings,
      };
      await updateMutation.mutateAsync({ id: tenant.id, data: payload });
      notifications.show({
        title: 'Configurações salvas',
        message: 'Branding e funcionalidades da filial atualizados',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Erro',
        message: getErrorMessage(error),
        color: 'red',
      });
    }
  });

  return (
    <Card padding="lg" radius="md" withBorder style={{ borderColor: '#334155', backgroundColor: '#1e293b' }}>
      <form onSubmit={handleSubmit}>
        <Stack gap="lg">
          <Stack gap="xs">
            <Title order={3} c="indigo.3">
              Configuração da filial
            </Title>
            <Text size="sm" c="dimmed">
              Visual e funcionalidades usados na área logada (após o login).
            </Text>
          </Stack>

          <Group grow align="flex-start">
            <TextInput label="Nome" {...form.getInputProps('name')} />
            <TextInput label="Slug" {...form.getInputProps('slug')} />
          </Group>

          <Select
            label="Portal de login"
            description="Subdomínio por onde os usuários desta filial fazem login"
            data={(portals ?? []).map((portal) => ({
              value: portal.id,
              label: `${portal.loginBranding.displayName} (${portal.host})`,
            }))}
            {...form.getInputProps('portalId')}
          />

          <Divider label="Branding da área logada" labelPosition="center" />

          <BrandingFormFields form={form} prefix="settings.branding" />

          <Divider label="Funcionalidades" labelPosition="center" />

          <TenantFeaturesFormFields form={form} prefix="settings.features" />

          <Group justify="flex-end">
            <Button
              type="button"
              variant="default"
              onClick={() => form.setValues(toFormValues(tenant))}
            >
              Desfazer
            </Button>
            <Button type="submit" color="indigo" loading={updateMutation.isPending}>
              Salvar configurações
            </Button>
          </Group>
        </Stack>
      </form>
    </Card>
  );
}

export { DEFAULT_TENANT_SETTINGS };
