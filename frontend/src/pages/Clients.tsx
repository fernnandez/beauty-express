import {
  Button,
  Group,
  Stack,
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
import { DataTable } from "../components/DataTable";
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
      <DataTable<Client>
        data={clients ?? []}
        loading={isLoading}
        rowKey={(c) => c.id}
        emptyMessage="Nenhum cliente encontrado"
        columns={[
          { key: "name", header: "Nome", primary: true, render: (c) => c.name },
          { key: "phone", header: "Telefone", render: (c) => c.phone },
        ]}
        actions={(client) => (
          <RowActions
            onEdit={() => handleEdit(client)}
            onDelete={() => handleDelete(client)}
          />
        )}
      />

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
