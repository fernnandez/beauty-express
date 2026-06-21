import {
  ActionIcon,
  Badge,
  Button,
  Container,
  Group,
  Loader,
  Modal,
  ScrollArea,
  Select,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconEye, IconPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  useAdminTenants,
  useCreateTenant,
  useUpdateTenant,
} from '../hooks/useAdminTenants';
import { useAdminPortals } from '../hooks/useAdminPortals';
import { getErrorMessage } from '../../utils/error.util';
import { backofficeAccent } from '../utils/backoffice-theme.util';
import type { CreateTenantDto, Tenant, UpdateTenantDto } from '../../types/admin.types';

export function BackofficeTenants() {
  const navigate = useNavigate();
  const { data: tenants, isLoading } = useAdminTenants();
  const { data: portals } = useAdminPortals();
  const createMutation = useCreateTenant();
  const updateMutation = useUpdateTenant();
  const [createOpened, setCreateOpened] = useState(false);
  const [editOpened, setEditOpened] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  const createForm = useForm<CreateTenantDto>({
    initialValues: { slug: '', name: '', portalId: '', isActive: true },
    validate: {
      slug: (value) =>
        /^[a-z0-9-]+$/.test(value)
          ? null
          : 'Use apenas letras minúsculas, números e hífens',
      name: (value) => (value.trim().length > 0 ? null : 'Nome obrigatório'),
      portalId: (value) => (value ? null : 'Selecione um portal'),
    },
  });

  const editForm = useForm<UpdateTenantDto & { name: string; slug: string }>({
    initialValues: { name: '', slug: '' },
    validate: {
      slug: (value) =>
        /^[a-z0-9-]+$/.test(value)
          ? null
          : 'Use apenas letras minúsculas, números e hífens',
      name: (value) => (value.trim().length > 0 ? null : 'Nome obrigatório'),
    },
  });

  useEffect(() => {
    if (selectedTenant && editOpened) {
      editForm.setValues({
        name: selectedTenant.name,
        slug: selectedTenant.slug,
      });
    }
  }, [selectedTenant, editOpened]);

  const handleEdit = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setEditOpened(true);
  };

  const handleToggleActive = async (tenant: Tenant) => {
    try {
      await updateMutation.mutateAsync({
        id: tenant.id,
        data: { isActive: !tenant.isActive },
      });
      notifications.show({
        title: 'Filial atualizada',
        message: tenant.isActive ? 'Filial desativada' : 'Filial ativada',
        color: backofficeAccent,
      });
    } catch (error) {
      notifications.show({
        title: 'Erro',
        message: getErrorMessage(error),
        color: 'red',
      });
    }
  };

  const handleCreate = createForm.onSubmit(async (values) => {
    try {
      await createMutation.mutateAsync(values);
      notifications.show({
        title: 'Filial criada',
        message: `${values.name} cadastrada com sucesso`,
        color: 'green',
      });
      createForm.reset();
      setCreateOpened(false);
    } catch (error) {
      notifications.show({
        title: 'Erro',
        message: getErrorMessage(error),
        color: 'red',
      });
    }
  });

  const handleUpdate = editForm.onSubmit(async (values) => {
    if (!selectedTenant) return;

    try {
      await updateMutation.mutateAsync({
        id: selectedTenant.id,
        data: { name: values.name, slug: values.slug },
      });
      notifications.show({
        title: 'Filial atualizada',
        message: `${values.name} salva com sucesso`,
        color: 'green',
      });
      setEditOpened(false);
      setSelectedTenant(null);
    } catch (error) {
      notifications.show({
        title: 'Erro',
        message: getErrorMessage(error),
        color: 'red',
      });
    }
  });

  return (
    <Container style={{ maxWidth: '95%' }} px={{ base: 'xs', sm: 'md' }}>
      <Stack gap="md" mb="xl">
        <Group justify="space-between" wrap="wrap">
          <Title order={1} c="gray.3">
            Filiais
          </Title>
          <Button
            leftSection={<IconPlus size={16} />}
            color={backofficeAccent}
            onClick={() => setCreateOpened(true)}
          >
            Nova filial
          </Button>
        </Group>

        {isLoading ? (
          <Group justify="center" py="xl">
            <Loader color={backofficeAccent} />
          </Group>
        ) : (
          <ScrollArea>
            <Table
              highlightOnHover
              withTableBorder
              withColumnBorders
              styles={{
                th: { backgroundColor: '#1e293b', color: '#e2e8f0' },
                td: { backgroundColor: '#0f172a', color: '#f1f5f9' },
              }}
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nome</Table.Th>
                  <Table.Th>Slug</Table.Th>
                  <Table.Th>Portal</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th w={120}>Ativa</Table.Th>
                  <Table.Th w={90} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {tenants?.map((tenant) => (
                  <Table.Tr key={tenant.id}>
                    <Table.Td>{tenant.name}</Table.Td>
                    <Table.Td>
                      <Text ff="monospace" size="sm">
                        {tenant.slug}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {tenant.portal?.host ?? '—'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={tenant.isActive ? 'green' : 'gray'}>
                        {tenant.isActive ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Switch
                        checked={tenant.isActive}
                        color={backofficeAccent}
                        disabled={updateMutation.isPending}
                        onChange={() => handleToggleActive(tenant)}
                      />
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} wrap="nowrap">
                        <Tooltip label="Ver detalhes">
                          <ActionIcon
                            variant="subtle"
                            color={backofficeAccent}
                            onClick={() => navigate(`/backoffice/tenants/${tenant.id}`)}
                          >
                            <IconEye size={18} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Editar">
                          <ActionIcon
                            variant="subtle"
                            color={backofficeAccent}
                            onClick={() => handleEdit(tenant)}
                          >
                            <IconEdit size={18} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        )}
      </Stack>

      <Modal
        opened={createOpened}
        onClose={() => setCreateOpened(false)}
        title="Nova filial"
        centered
      >
        <form onSubmit={handleCreate}>
          <Stack gap="md">
            <TextInput
              label="Nome"
              placeholder="Nova filial — ex: Unidade Centro"
              {...createForm.getInputProps('name')}
            />
            <TextInput
              label="Slug"
              placeholder="nova-unidade"
              description="Identificador único (minúsculas, números e hífens)"
              {...createForm.getInputProps('slug')}
            />
            <Select
              label="Portal de login"
              placeholder="Selecione o subdomínio"
              data={(portals ?? []).map((portal) => ({
                value: portal.id,
                label: `${portal.slug} (${portal.host})`,
              }))}
              {...createForm.getInputProps('portalId')}
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setCreateOpened(false)}>
                Cancelar
              </Button>
              <Button type="submit" color={backofficeAccent} loading={createMutation.isPending}>
                Criar filial
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={editOpened}
        onClose={() => {
          setEditOpened(false);
          setSelectedTenant(null);
        }}
        title="Editar filial"
        centered
      >
        <form onSubmit={handleUpdate}>
          <Stack gap="md">
            <TextInput
              label="Nome"
              {...editForm.getInputProps('name')}
            />
            <TextInput
              label="Slug"
              description="Identificador único (minúsculas, números e hífens)"
              {...editForm.getInputProps('slug')}
            />
            <Group justify="flex-end">
              <Button
                variant="default"
                onClick={() => {
                  setEditOpened(false);
                  setSelectedTenant(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" color={backofficeAccent} loading={updateMutation.isPending}>
                Salvar
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
