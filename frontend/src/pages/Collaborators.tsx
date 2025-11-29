import {
  ActionIcon,
  Badge,
  Button,
  Container,
  Group,
  Table,
  Text,
  TextInput,
  Title,
  Avatar,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconEdit,
  IconPlus,
  IconSearch,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useState } from "react";
import { ConfirmModal } from "../components/ConfirmModal";
import { CollaboratorCreateModal } from "../components/collaborator/CollaboratorCreateModal";
import { CollaboratorEditModal } from "../components/collaborator/CollaboratorEditModal";
import {
  useCollaborators,
  useDeleteCollaborator,
  useUpdateCollaborator,
} from "../hooks/useCollaborators";
import type { Collaborator } from "../types";

export function Collaborators() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 500);
  const { data: collaborators, isLoading } = useCollaborators(
    debouncedSearchTerm.trim() || undefined
  );
  const deleteMutation = useDeleteCollaborator();
  const updateMutation = useUpdateCollaborator();

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
      notifications.show({
        title: "Sucesso",
        message: "Colaborador excluído com sucesso!",
        color: "green",
      });
    } catch {
      notifications.show({
        title: "Erro",
        message: "Erro ao excluir colaborador",
        color: "red",
      });
    }
  };

  const confirmDeactivate = async () => {
    if (!selectedCollaborator) return;

    try {
      await updateMutation.mutateAsync({
        id: selectedCollaborator.id,
        data: { isActive: false },
      });
      notifications.show({
        title: "Sucesso",
        message: "Colaborador desativado com sucesso!",
        color: "green",
      });
    } catch {
      notifications.show({
        title: "Erro",
        message: "Erro ao desativar colaborador",
        color: "red",
      });
    }
  };

  return (
    <Container size="xl">
      <Group justify="space-between" mb="xl">
        <Group gap="md">
          <Avatar src="/logo.png" size={48} radius="md" />
          <Title order={1} c="pink">Colaboradores</Title>
        </Group>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setCreateModalOpened(true)}
          color="pink"
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
        mb="md"
        style={{ maxWidth: 400 }}
      />

      {isLoading ? (
        <Text>Carregando...</Text>
      ) : !collaborators || collaborators.length === 0 ? (
        <Text c="dimmed">Nenhum colaborador encontrado.</Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nome</Table.Th>
              <Table.Th>Área de Atuação</Table.Th>
              <Table.Th>Telefone</Table.Th>
              <Table.Th>Comissão</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Ações</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {collaborators.map((collaborator) => (
              <Table.Tr key={collaborator.id}>
                <Table.Td>{collaborator.name}</Table.Td>
                <Table.Td>{collaborator.area}</Table.Td>
                <Table.Td>{collaborator.phone}</Table.Td>
                <Table.Td>{collaborator.commissionPercentage}%</Table.Td>
                <Table.Td>
                  <Badge color={collaborator.isActive ? "green" : "red"}>
                    {collaborator.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Button
                      variant="light"
                      size="xs"
                      leftSection={<IconEdit size={14} />}
                      onClick={() => handleEdit(collaborator)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="light"
                      color="red"
                      size="xs"
                      leftSection={<IconTrash size={14} />}
                      disabled
                      onClick={() => handleDelete(collaborator)}
                    >
                      Excluir
                    </Button>
                  </Group>
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
    </Container>
  );
}
