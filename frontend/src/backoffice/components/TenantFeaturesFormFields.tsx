import { Select, Stack, Switch, Text } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';

interface TenantFeaturesFormFieldsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturnType<any>;
  prefix?: string;
}

export function TenantFeaturesFormFields({
  form,
  prefix = 'features',
}: TenantFeaturesFormFieldsProps) {
  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        Funcionalidades disponíveis na área operacional desta filial.
      </Text>
      <Switch
        label="Comissões habilitadas"
        description="Exibe menu e fluxo de comissões para colaboradores"
        {...form.getInputProps(`${prefix}.commissionsEnabled`, { type: 'checkbox' })}
      />
      <Select
        label="Modo de relatórios financeiros"
        data={[
          { value: 'full', label: 'Completo (receita + comissões + líquido)' },
          { value: 'revenue_only', label: 'Somente receita' },
        ]}
        {...form.getInputProps(`${prefix}.financialReportsMode`)}
      />
    </Stack>
  );
}
