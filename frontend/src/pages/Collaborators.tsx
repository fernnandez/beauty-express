import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import {
  IconAlertTriangle,
  IconInfoCircle,
  IconPlus,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfirmModal } from "../components/ConfirmModal";
import { RowActions } from "../components/RowActions";
import { TablePage } from "../components/TablePage";
import { CommissionAlertBadge } from "../components/commission/CommissionAlertBadge";
import { CollaboratorCreateModal } from "../components/collaborator/CollaboratorCreateModal";
import { CollaboratorEditModal } from "../components/collaborator/CollaboratorEditModal";
import {
  useCollaborators,
  useDeleteCollaborator,
  useUpdateCollaborator,
} from "../hooks/useCollaborators";
import { useCommissionAlerts } from "../hooks/useCommissions";
import { useOperationalBranding } from "../hooks/useOperationalBranding";
import { useNotifications } from "../hooks/useNotifications";
import { MESSAGES } from "../constants/messages.constants";
import { formatPrice } from "../utils/money.util";
import type { Collaborator } from "../types";

export function Collaborators() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 500);
  const { data: collaborators, isLoading } = useCollaborators(
    debouncedSearchTerm.trim() || undefined
  );
  const { commissionsEnabled } = useOperationalBranding();
  const { data: alerts } = useCommissionAlerts(commissionsEnabled);
  const alertByCollaborator = new Map(
    (alerts ?? []).map((alert) => [alert.collaboratorId, alert]),
  );
  const overdueTotal = (alerts ?? [])
    .filter((a) => a.status === "overdue")
    .reduce((sum, a) => sum + a.overdueAmount, 0);
  const overdueCollaborators = (alerts ?? []).filter(
    (a) => a.status === "overdue",
  ).length;
  const deleteMutation = useDeleteCollaborator();
  const updateMutation = useUpdateCollaborator();
  const { showSuccess, showError } = useNotifications();

  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [deactivateModalOpened, setDeactivateModalOpened] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] =
    useState<Collaborator | null>(null);

  const handleEdit = (collaborator: Collaborator) => {
    setSelectedCollaborator(collaborator);
    setEditModalOpened(true);
  };

  const handleDelete = (collaborator: Collaborator) => {
    setSelectedCollaborator(collaborator);
    setDeleteModalOpened(true);
  };

  const confirmDelete = async () => {
    if (!selectedCollaborator) return;

    try {
      await deleteMutation.mutateAsync(selectedCollaborator.id);
      showSuccess(MESSAGES.SUCCESS.DELETE.COLLABORATOR);
    } catch (error) {
      showError(error, MESSAGES.ERROR.DELETE.COLLABORATOR);
    }
  };

  const confirmDeactivate = async () => {
    if (!selectedCollaborator) return;

    try {
      await updateMutation.mutateAsync({
        id: selectedCollaborator.id,
        data: { isActive: false },
      });
      showSuccess(MESSAGES.SUCCESS.DEACTIVATE.COLLABORATOR);
    } catch (error) {
      showError(error, MESSAGES.ERROR.DEACTIVATE.COLLABORATOR);
    }
  };

  return (
    <TablePage
      header={
        <Stack gap="md" mb="md">
          <Group justify="space-between" wrap="wrap">
            <Title order={1} c="brand">
              Colaboradores
            </Title>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => setCreateModalOpened(true)}
              color="brand"
              size="md"
            >
              Novo Colaborador
            </Button>
          </Group>

          <TextInput
            placeholder="Buscar por nome..."
            leftSection={<IconSearch size={16} />}
            rightSection={
              searchTerm && (
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => setSearchTerm("")}
                  size="sm"
                >
                  <IconX size={16} />
                </ActionIcon>
              )
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.currentTarget.value)}
            style={{ maxWidth: "100%" }}
          />

          <Alert
            icon={<IconInfoCircle size={16} />}
            title="Informação"
            color="blue"
            variant="light"
          >
            A exclusão de colaboradores está desabilitada por hora. Para
            desativar um colaborador, utilize a opção de edição.
          </Alert>

          {commissionsEnabled && overdueCollaborators > 0 && (
            <Alert
              icon={<IconAlertTriangle size={16} />}
              title="Comissões atrasadas"
              color="red"
              variant="light"
            >
              {overdueCollaborators} colaborador(es) com comissões vencidas não
              pagas, totalizando {formatPrice(overdueTotal)}. Verifique a coluna
              "Comissões" para conciliar os pagamentos.
            </Alert>
          )}
        </Stack>
      }
    >
      {isLoading ? (
        <Text>Carregando...</Text>
      ) : !collaborators || collaborators.length === 0 ? (
        <Text c="dimmed">Nenhum colaborador encontrado.</Text>
      ) : (
        <Table striped highlightOnHover miw={720}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nome</Table.Th>
              <Table.Th>Área de Atuação</Table.Th>
              <Table.Th>Telefone</Table.Th>
              <Table.Th>Status</Table.Th>
              {commissionsEnabled && <Table.Th>Comissões</Table.Th>}
              <Table.Th>Ações</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {collaborators.map((collaborator) => (
              <Table.Tr
                key={collaborator.id}
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/collaborators/${collaborator.id}`)}
              >
                <Table.Td>{collaborator.name}</Table.Td>
                <Table.Td>{collaborator.area}</Table.Td>
                <Table.Td>{collaborator.phone}</Table.Td>
                <Table.Td>
                  <Badge color={collaborator.isActive ? "green" : "red"}>
                    {collaborator.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </Table.Td>
                {commissionsEnabled && (
                  <Table.Td>
                    <CommissionAlertBadge
                      alert={alertByCollaborator.get(collaborator.id)}
                    />
                  </Table.Td>
                )}
                <Table.Td onClick={(e) => e.stopPropagation()}>
                  <RowActions
                    onView={() =>
                      navigate(`/collaborators/${collaborator.id}`)
                    }
                    onEdit={() => handleEdit(collaborator)}
                    onDelete={() => handleDelete(collaborator)}
                    deleteDisabled
                    deleteDisabledLabel="Exclusão desabilitada. Use a edição para desativar."
                  />
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <CollaboratorCreateModal
        opened={createModalOpened}
        onClose={() => setCreateModalOpened(false)}
      />

      <CollaboratorEditModal
        opened={editModalOpened}
        onClose={() => {
          setEditModalOpened(false);
          setSelectedCollaborator(null);
        }}
        collaborator={selectedCollaborator}
      />

      <ConfirmModal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setSelectedCollaborator(null);
        }}
        onConfirm={confirmDelete}
        title="Excluir Colaborador"
        message={`Tem certeza que deseja excluir o colaborador "${selectedCollaborator?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        confirmColor="red"
        loading={deleteMutation.isPending}
      />

      <ConfirmModal
        opened={deactivateModalOpened}
        onClose={() => {
          setDeactivateModalOpened(false);
          setSelectedCollaborator(null);
        }}
        onConfirm={confirmDeactivate}
        title="Desativar Colaborador"
        message={`Tem certeza que deseja desativar o colaborador "${selectedCollaborator?.name}"? Ele não poderá ser atribuído a novos agendamentos.`}
        confirmLabel="Desativar"
        confirmColor="orange"
        loading={updateMutation.isPending}
      />
    </TablePage>
  );
}
