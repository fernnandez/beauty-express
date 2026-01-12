import {
  ActionIcon,
  Alert,
  Button,
  Container,
  Group,
  ScrollArea,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import {
  IconEdit,
  IconInfoCircle,
  IconPlus,
  IconSearch,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useState } from "react";
import { ConfirmModal } from "../components/ConfirmModal";
import { ServiceCreateModal } from "../components/service/ServiceCreateModal";
import { ServiceEditModal } from "../components/service/ServiceEditModal";
import { useDeleteService, useServices } from "../hooks/useServices";
import { useNotifications } from "../hooks/useNotifications";
import { MESSAGES } from "../constants/messages.constants";
import type { Service } from "../types";
import { formatPrice } from "../utils/appointment.utils";

export function Services() {
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
    <Container style={{ maxWidth: "95%" }} px={{ base: "xs", sm: "md" }}>
      <Stack gap="md" mb="xl">
        <Group justify="space-between" wrap="wrap">
          <Group gap="md">
            <Title order={1} c="pink">
              Serviços
            </Title>
          </Group>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setCreateModalOpened(true)}
            color="pink"
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
          mb="md"
          style={{ maxWidth: "100%" }}
        />

        <Alert
          icon={<IconInfoCircle size={16} />}
          title="Informação"
          color="blue"
          variant="light"
        >
          Não é possível excluir serviços que estão em uso em algum agendamento.
          Para excluir um serviço, é necessário cancelar ou concluir todos os
          agendamentos relacionados primeiro.
        </Alert>
      </Stack>

      {isLoading ? (
        <Text>Carregando...</Text>
      ) : !services || services.length === 0 ? (
        <Text c="dimmed">Nenhum serviço encontrado.</Text>
      ) : (
        <ScrollArea>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nome</Table.Th>
                <Table.Th>Preço Padrão</Table.Th>
                <Table.Th>Descrição</Table.Th>
                <Table.Th>Ações</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {services.map((service) => (
                <Table.Tr key={service.id}>
                  <Table.Td>{service.name}</Table.Td>
                  <Table.Td>{formatPrice(service.defaultPrice)}</Table.Td>
                  <Table.Td>{service.description || "-"}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Button
                        variant="light"
                        size="xs"
                        leftSection={<IconEdit size={14} />}
                        onClick={() => handleEdit(service)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="light"
                        color="red"
                        size="xs"
                        leftSection={<IconTrash size={14} />}
                        onClick={() => handleDelete(service)}
                      >
                        Excluir
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
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
    </Container>
  );
}
