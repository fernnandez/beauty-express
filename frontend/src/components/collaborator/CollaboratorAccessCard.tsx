import {
  Badge,
  Button,
  Card,
  Group,
  PasswordInput,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconKey, IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import {
  useCollaboratorAccess,
  useGrantCollaboratorAccess,
  useRevokeCollaboratorAccess,
  useUpdateCollaboratorAccess,
} from "../../hooks/useCollaboratorAccess";
import { useNotifications } from "../../hooks/useNotifications";
import { ConfirmModal } from "../ConfirmModal";

export function CollaboratorAccessCard({
  collaboratorId,
}: {
  collaboratorId: string;
}) {
  const { data: status, isLoading } = useCollaboratorAccess(collaboratorId);
  const grantMutation = useGrantCollaboratorAccess(collaboratorId);
  const updateMutation = useUpdateCollaboratorAccess(collaboratorId);
  const revokeMutation = useRevokeCollaboratorAccess(collaboratorId);
  const { showSuccess, showError } = useNotifications();
  const [revokeOpened, setRevokeOpened] = useState(false);

  const grantForm = useForm({
    initialValues: { email: "", password: "" },
    validate: {
      email: (v) => (/^\S+@\S+$/.test(v) ? null : "E-mail inválido"),
      password: (v) => (v.length >= 6 ? null : "Mínimo de 6 caracteres"),
    },
  });

  const resetForm = useForm({
    initialValues: { password: "" },
    validate: {
      password: (v) => (v.length >= 6 ? null : "Mínimo de 6 caracteres"),
    },
  });

  const handleGrant = grantForm.onSubmit(async (values) => {
    try {
      await grantMutation.mutateAsync(values);
      grantForm.reset();
      showSuccess("Acesso concedido com sucesso!");
    } catch (error) {
      showError(error, "Erro ao conceder acesso");
    }
  });

  const handleResetPassword = resetForm.onSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync({ password: values.password });
      resetForm.reset();
      showSuccess("Senha atualizada!");
    } catch (error) {
      showError(error, "Erro ao atualizar a senha");
    }
  });

  const handleToggleActive = async () => {
    try {
      await updateMutation.mutateAsync({ isActive: !status?.isActive });
      showSuccess(status?.isActive ? "Acesso desativado" : "Acesso ativado");
    } catch (error) {
      showError(error, "Erro ao alterar o acesso");
    }
  };

  const handleRevoke = async () => {
    try {
      await revokeMutation.mutateAsync();
      showSuccess("Acesso revogado");
    } catch (error) {
      showError(error, "Erro ao revogar o acesso");
    }
  };

  return (
    <Card padding="lg" radius="lg" shadow="sm">
      <Stack gap="md">
        <Group justify="space-between">
          <Group gap="xs">
            <IconKey size={18} />
            <Title order={4}>Acesso do colaborador</Title>
          </Group>
          {status?.hasAccess && (
            <Badge color={status.isActive ? "green" : "gray"}>
              {status.isActive ? "Ativo" : "Inativo"}
            </Badge>
          )}
        </Group>

        {isLoading ? (
          <Text c="dimmed" size="sm">
            Carregando...
          </Text>
        ) : status?.hasAccess ? (
          <Stack gap="md">
            <Text size="sm">
              Login: <strong>{status.email}</strong>
            </Text>

            <Switch
              label="Acesso ativo"
              checked={Boolean(status.isActive)}
              onChange={handleToggleActive}
              disabled={updateMutation.isPending}
            />

            <form onSubmit={handleResetPassword}>
              <Group align="flex-end" gap="sm">
                <PasswordInput
                  label="Nova senha"
                  placeholder="Redefinir senha"
                  style={{ flex: 1 }}
                  {...resetForm.getInputProps("password")}
                />
                <Button
                  type="submit"
                  variant="light"
                  loading={updateMutation.isPending}
                >
                  Atualizar
                </Button>
              </Group>
            </form>

            <Group justify="flex-end">
              <Button
                color="red"
                variant="subtle"
                leftSection={<IconTrash size={16} />}
                onClick={() => setRevokeOpened(true)}
              >
                Revogar acesso
              </Button>
            </Group>
          </Stack>
        ) : (
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Este colaborador ainda não tem acesso ao app. Conceda um login
              para que ele veja a própria agenda e comissões.
            </Text>
            <form onSubmit={handleGrant}>
              <Stack gap="sm">
                <TextInput
                  label="E-mail"
                  placeholder="colaborador@salao.com"
                  {...grantForm.getInputProps("email")}
                />
                <PasswordInput
                  label="Senha"
                  placeholder="Senha inicial"
                  {...grantForm.getInputProps("password")}
                />
                <Group justify="flex-end">
                  <Button type="submit" loading={grantMutation.isPending}>
                    Conceder acesso
                  </Button>
                </Group>
              </Stack>
            </form>
          </Stack>
        )}
      </Stack>

      <ConfirmModal
        opened={revokeOpened}
        onClose={() => setRevokeOpened(false)}
        onConfirm={handleRevoke}
        title="Revogar acesso"
        message="Tem certeza? O colaborador perderá o login e não poderá mais acessar o app."
        confirmLabel="Revogar"
        confirmColor="red"
        loading={revokeMutation.isPending}
      />
    </Card>
  );
}
