import {
  Badge,
  Button,
  Container,
  Group,
  Loader,
  Modal,
  ScrollArea,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import {
  useAdminTenants,
  useCreateTenant,
  useUpdateTenant,
} from '../hooks/useAdminTenants';
import { getErrorMessage } from '../../utils/error.util';
import type { CreateTenantDto, Tenant } from '../../types/admin.types';

export function BackofficeTenants() {
  const { data: tenants, isLoading } = useAdminTenants();
  const createMutation = useCreateTenant();
  const updateMutation = useUpdateTenant();
  const [createOpened, setCreateOpened] = useState(false);

  const form = useForm<CreateTenantDto>({
    initialValues: {
      slug: '',
      name: '',
      isActive: true,
    },
    validate: {
      slug: (value) =>
        /^[a-z0-9-]+$/.test(value)
          ? null
          : 'Use apenas letras minúsculas, números e hífens',
      name: (value) => (value.trim().length > 0 ? null : 'Nome obrigatório'),
    },
  });

  const handleToggleActive = async (tenant: Tenant) => {
    try {
      await updateMutation.mutateAsync({
        id: tenant.id,
        data: { isActive: !tenant.isActive },
      });
      notifications.show({
        title: 'Filial atualizada',
        message: tenant.isActive ? 'Filial desativada' : 'Filial ativada',
        color: 'indigo',
      });
    } catch (error) {
      notifications.show({
        title: 'Erro',
        message: getErrorMessage(error),
        color: 'red',
      });
    }
  };

  const handleCreate = form.onSubmit(async (values) => {
    try {
      await createMutation.mutateAsync(values);
      notifications.show({
        title: 'Filial criada',
        message: `${values.name} cadastrada com sucesso`,
        color: 'green',
      });
      form.reset();
      setCreateOpened(false);
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
          <Title order={1} c="indigo.3">
            Filiais
          </Title>
          <Button
            leftSection={<IconPlus size={16} />}
            color="indigo"
            onClick={() => setCreateOpened(true)}
          >
            Nova filial
          </Button>
        </Group>

        {isLoading ? (
          <Group justify="center" py="xl">
            <Loader color="indigo" />
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
                  <Table.Th>Status</Table.Th>
                  <Table.Th w={120}>Ativa</Table.Th>
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
                      <Badge color={tenant.isActive ? 'green' : 'gray'}>
                        {tenant.isActive ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Switch
                        checked={tenant.isActive}
                        color="indigo"
                        disabled={updateMutation.isPending}
                        onChange={() => handleToggleActive(tenant)}
                      />
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
              placeholder="Maria Borboleta — Nova Unidade"
              {...form.getInputProps('name')}
            />
            <TextInput
              label="Slug"
              placeholder="nova-unidade"
              description="Identificador único (minúsculas, números e hífens)"
              {...form.getInputProps('slug')}
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setCreateOpened(false)}>
                Cancelar
              </Button>
              <Button type="submit" color="indigo" loading={createMutation.isPending}>
                Criar filial
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
