import {
  ActionIcon,
  Alert,
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
  IconInfoCircle,
  IconPlus,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { useState } from "react";
import { ConfirmModal } from "../components/ConfirmModal";
import { RowActions } from "../components/RowActions";
import { TablePage } from "../components/TablePage";
import { ServiceCreateModal } from "../components/service/ServiceCreateModal";
import { ServiceEditModal } from "../components/service/ServiceEditModal";
import { useDeleteService, useServices } from "../hooks/useServices";
import { useNotifications } from "../hooks/useNotifications";
import { useOperationalBranding } from "../hooks/useOperationalBranding";
import { MESSAGES } from "../constants/messages.constants";
import type { Service } from "../types";
import { formatPrice } from "../utils/appointment.utils";
import { toMoney } from "../utils/money.util";

export function Services() {
  const { commissionsEnabled } = useOperationalBranding();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 500);
  const { data: services, isLoading } = useServices(
    debouncedSearchTerm.trim() || undefined
  );
  const deleteMutation = useDeleteService();
  const { showSuccess, showError } = useNotifications();

  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setEditModalOpened(true);
  };

  const handleDelete = (service: Service) => {
    setSelectedService(service);
    setDeleteModalOpened(true);
  };

  const confirmDelete = async () => {
    if (!selectedService) return;

    try {
      await deleteMutation.mutateAsync(selectedService.id);
      showSuccess(MESSAGES.SUCCESS.DELETE.SERVICE);
      setDeleteModalOpened(false);
      setSelectedService(null);
    } catch (error) {
      showError(error, MESSAGES.ERROR.DELETE.SERVICE);
    }
  };

  return (
    <TablePage
      header={
        <Stack gap="md" mb="md">
          <Group justify="space-between" wrap="wrap">
            <Title order={1} c="brand">
              Serviços
            </Title>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => setCreateModalOpened(true)}
              color="brand"
              size="md"
            >
              Novo Serviço
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
            Não é possível excluir serviços que estão em uso em algum
            agendamento. Para excluir um serviço, é necessário cancelar ou
            concluir todos os agendamentos relacionados primeiro.
          </Alert>
        </Stack>
      }
    >
      {isLoading ? (
        <Text>Carregando...</Text>
      ) : !services || services.length === 0 ? (
        <Text c="dimmed">Nenhum serviço encontrado.</Text>
      ) : (
        <Table striped highlightOnHover miw={720}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nome</Table.Th>
              <Table.Th>Preço Padrão</Table.Th>
              {commissionsEnabled && <Table.Th>Comissão</Table.Th>}
              <Table.Th>Descrição</Table.Th>
              <Table.Th>Ações</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {services.map((service) => (
              <Table.Tr key={service.id}>
                <Table.Td>{service.name}</Table.Td>
                <Table.Td>{formatPrice(service.defaultPrice)}</Table.Td>
                {commissionsEnabled && (
                  <Table.Td>{toMoney(service.commissionPercentage)}%</Table.Td>
                )}
                <Table.Td>{service.description || "-"}</Table.Td>
                <Table.Td>
                  <RowActions
                    onEdit={() => handleEdit(service)}
                    onDelete={() => handleDelete(service)}
                  />
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <ServiceCreateModal
        opened={createModalOpened}
        onClose={() => setCreateModalOpened(false)}
      />

      <ServiceEditModal
        opened={editModalOpened}
        onClose={() => {
          setEditModalOpened(false);
          setSelectedService(null);
        }}
        service={selectedService}
      />

      <ConfirmModal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setSelectedService(null);
        }}
        onConfirm={confirmDelete}
        title="Excluir Serviço"
        message={`Tem certeza que deseja excluir o serviço "${selectedService?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        confirmColor="red"
        loading={deleteMutation.isPending}
      />
    </TablePage>
  );
}
