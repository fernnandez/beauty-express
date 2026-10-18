import {
  ActionIcon,
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
  IconX,
} from "@tabler/icons-react";
import { useState } from "react";
import { ConfirmModal } from "../components/ConfirmModal";
import { RowActions } from "../components/RowActions";
import { TablePage } from "../components/TablePage";
import { DataTable } from "../components/DataTable";
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
        </Stack>
      }
    >
      <DataTable
        data={services ?? []}
        loading={isLoading}
        rowKey={(s) => s.id}
        emptyMessage="Nenhum serviço encontrado."
        columns={[
          { key: "name", header: "Nome", primary: true, render: (s) => s.name },
          {
            key: "price",
            header: "Preço Padrão",
            render: (s) => formatPrice(s.defaultPrice),
          },
          ...(commissionsEnabled
            ? [
                {
                  key: "commission",
                  header: "Comissão",
                  render: (s: Service) => `${toMoney(s.commissionPercentage)}%`,
                },
              ]
            : []),
          {
            key: "description",
            header: "Descrição",
            hideOnMobile: true,
            render: (s) => s.description || "-",
          },
        ]}
        actions={(service) => (
          <RowActions
            onEdit={() => handleEdit(service)}
            onDelete={() => handleDelete(service)}
          />
        )}
      />

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
