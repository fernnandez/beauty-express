import {
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
  IconPlus,
  IconSearch,
} from "@tabler/icons-react";
import { useState } from "react";
import { ConfirmModal } from "../components/ConfirmModal";
import { RowActions } from "../components/RowActions";
import { TablePage } from "../components/TablePage";
import { ClientCreateModal } from "../components/client/ClientCreateModal";
import { ClientEditModal } from "../components/client/ClientEditModal";
import { MESSAGES } from "../constants/messages.constants";
import {
  useClients,
  useDeleteClient,
} from "../hooks/useClients";
import { useNotifications } from "../hooks/useNotifications";
import type { Client } from "../types";

export function Clients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 500);
  const { data: clients, isLoading } = useClients(
    debouncedSearchTerm.trim() || undefined
  );
  const deleteMutation = useDeleteClient();
  const { showSuccess, showError } = useNotifications();

  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setEditModalOpened(true);
  };

  const handleDelete = (client: Client) => {
    setSelectedClient(client);
    setDeleteModalOpened(true);
  };

  const confirmDelete = async () => {
    if (!selectedClient) return;

    try {
      await deleteMutation.mutateAsync(selectedClient.id);
      showSuccess(MESSAGES.SUCCESS.DELETE.CLIENT);
    } catch (error) {
      showError(error, MESSAGES.ERROR.DELETE.CLIENT);
    }
  };

  return (
    <TablePage
      header={
        <Stack gap="md" mb="md">
          <Group justify="space-between">
            <Title order={1} c="brand">
              Clientes
            </Title>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => setCreateModalOpened(true)}
              size="md"
            >
              Novo Cliente
            </Button>
          </Group>

          <TextInput
            placeholder="Buscar por nome ou telefone..."
            leftSection={<IconSearch size={16} />}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.currentTarget.value)}
          />
        </Stack>
      }
    >
      <Table striped highlightOnHover miw={720}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nome</Table.Th>
            <Table.Th>Telefone</Table.Th>
            <Table.Th w={100}>Ações</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {isLoading ? (
            <Table.Tr>
              <Table.Td colSpan={3}>
                <Text ta="center" c="dimmed">
                  Carregando...
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : clients && clients.length > 0 ? (
            clients.map((client) => (
              <Table.Tr key={client.id}>
                <Table.Td>{client.name}</Table.Td>
                <Table.Td>{client.phone}</Table.Td>
                <Table.Td>
                  <RowActions
                    onEdit={() => handleEdit(client)}
                    onDelete={() => handleDelete(client)}
                  />
                </Table.Td>
              </Table.Tr>
            ))
          ) : (
            <Table.Tr>
              <Table.Td colSpan={3}>
                <Text ta="center" c="dimmed">
                  Nenhum cliente encontrado
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      <ClientCreateModal
        opened={createModalOpened}
        onClose={() => setCreateModalOpened(false)}
      />

      <ClientEditModal
        opened={editModalOpened}
        onClose={() => {
          setEditModalOpened(false);
          setSelectedClient(null);
        }}
        client={selectedClient}
      />

      <ConfirmModal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setSelectedClient(null);
        }}
        onConfirm={confirmDelete}
        title="Excluir Cliente"
        message={`Tem certeza que deseja excluir ${selectedClient?.name}?`}
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
      />
    </TablePage>
  );
}
