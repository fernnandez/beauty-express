import { Stack, Text, Title } from "@mantine/core";
import { CommissionsPanel } from "../../components/commission/CommissionsPanel";
import { useAuth } from "../../contexts/AuthContext";

/**
 * Comissões do próprio colaborador, somente-leitura (sem ações de pagamento).
 * O backend também escopa /commissions ao colaborador autenticado.
 */
export function CollaboratorCommissions() {
  const { user } = useAuth();
  const collaboratorId = user?.collaboratorId ?? undefined;

  return (
    <Stack gap="md" pb={80}>
      <Stack gap={2}>
        <Title order={3} c="brand">
          Minhas comissões
        </Title>
        <Text size="sm" c="dimmed">
          Acompanhe os valores e o status de pagamento.
        </Text>
      </Stack>

      <CommissionsPanel
        fixedCollaboratorId={collaboratorId}
        canManagePayments={false}
        withTablePageLayout={false}
      />
    </Stack>
  );
}
