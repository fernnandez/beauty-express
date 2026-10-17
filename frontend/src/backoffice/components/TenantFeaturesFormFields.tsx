import { Select, Stack, Switch, Text } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import {
  backofficeSelectStyles,
  backofficeSwitchStyles,
} from '../utils/backoffice-theme.util';

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
        styles={backofficeSwitchStyles}
        {...form.getInputProps(`${prefix}.commissionsEnabled`, { type: 'checkbox' })}
      />
      <Select
        label="Modo de relatórios financeiros"
        styles={backofficeSelectStyles}
        data={[
          { value: 'full', label: 'Completo (receita + comissões + líquido)' },
          { value: 'revenue_only', label: 'Somente receita' },
        ]}
        {...form.getInputProps(`${prefix}.financialReportsMode`)}
      />
      <Select
        label="Regime de período"
        description="Define o padrão de período no app (quinzenal mostra 1ª/2ª quinzena) e o vencimento das comissões"
        styles={backofficeSelectStyles}
        data={[
          { value: 'biweekly', label: 'Quinzenal (pagamentos dia 15 e fim do mês)' },
          { value: 'monthly', label: 'Mensal (pagamento no fim do mês)' },
        ]}
        {...form.getInputProps(`${prefix}.periodMode`)}
      />
    </Stack>
  );
}
