import {
  ActionIcon,
  Button,
  Group,
  SegmentedControl,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconPlus, IconSearch, IconX } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfirmModal } from "../components/ConfirmModal";
import { RowActions } from "../components/RowActions";
import { TablePage } from "../components/TablePage";
import { DataTable } from "../components/DataTable";
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
import type { Collaborator } from "../types";

export function Collaborators() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 500);
  const { data: collaborators, isLoading } = useCollaborators(
    debouncedSearchTerm.trim() || undefined
  );
  const [statusTab, setStatusTab] = useState<"active" | "inactive">("active");

  // Separa a lista pela aba selecionada (ativos x inativos).
  const filteredCollaborators = useMemo(
    () =>
      (collaborators ?? []).filter((c) =>
        statusTab === "active" ? c.isActive : !c.isActive,
      ),
    [collaborators, statusTab],
  );
  const { commissionsEnabled } = useOperationalBranding();
  const { data: alerts } = useCommissionAlerts(commissionsEnabled);
  const alertByCollaborator = new Map(
    (alerts ?? []).map((alert) => [alert.collaboratorId, alert]),
  );
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

          <SegmentedControl
            value={statusTab}
            onChange={(v) => setStatusTab(v as "active" | "inactive")}
            data={[
              {
                value: "active",
                label: `Ativos (${
                  (collaborators ?? []).filter((c) => c.isActive).length
                })`,
              },
              {
                value: "inactive",
                label: `Inativos (${
                  (collaborators ?? []).filter((c) => !c.isActive).length
                })`,
              },
            ]}
          />
        </Stack>
      }
    >
      <DataTable
        data={filteredCollaborators}
        loading={isLoading}
        rowKey={(c) => c.id}
        emptyMessage={
          statusTab === "active"
            ? "Nenhum colaborador ativo."
            : "Nenhum colaborador inativo."
        }
        onRowClick={(c) => navigate(`/collaborators/${c.id}`)}
        columns={[
          { key: "name", header: "Nome", primary: true, render: (c) => c.name },
          { key: "area", header: "Área de Atuação", render: (c) => c.area },
          { key: "phone", header: "Telefone", render: (c) => c.phone },
          ...(commissionsEnabled
            ? [
                {
                  key: "commissions",
                  header: "Comissões",
                  render: (c: Collaborator) => (
                    <CommissionAlertBadge
                      alert={alertByCollaborator.get(c.id)}
                    />
                  ),
                },
              ]
            : []),
        ]}
        actions={(collaborator) => (
          <RowActions
            onView={() => navigate(`/collaborators/${collaborator.id}`)}
            onEdit={() => handleEdit(collaborator)}
            onDelete={() => handleDelete(collaborator)}
            deleteDisabled
            deleteDisabledLabel="Exclusão desabilitada. Use a edição para desativar."
          />
        )}
      />

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
