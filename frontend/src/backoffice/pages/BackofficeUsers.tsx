import {
  Badge,
  Button,
  Container,
  Group,
  Loader,
  Modal,
  PasswordInput,
  ScrollArea,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { OPERATIONAL_ROLES, ROLE_LABELS } from '../constants/roles';
import { useAdminTenants } from '../hooks/useAdminTenants';
import { useAdminUsers, useCreateAdminUser } from '../hooks/useAdminUsers';
import { getErrorMessage } from '../../utils/error.util';
import type { CreateAdminUserDto } from '../../types/admin.types';

export function BackofficeUsers() {
  const { data: users, isLoading } = useAdminUsers();
  const { data: tenants } = useAdminTenants();
  const createMutation = useCreateAdminUser();
  const [createOpened, setCreateOpened] = useState(false);

  const form = useForm<CreateAdminUserDto>({
    initialValues: {
      email: '',
      password: '',
      role: 'admin',
      tenantId: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'E-mail inválido'),
      password: (value) =>
        value.length >= 6 ? null : 'Senha deve ter ao menos 6 caracteres',
      tenantId: (value) => (value ? null : 'Selecione uma filial'),
    },
  });

  const tenantOptions =
    tenants
      ?.filter((t) => t.isActive)
      .map((t) => ({ value: t.id, label: t.name })) ?? [];

  const handleCreate = form.onSubmit(async (values) => {
    try {
      await createMutation.mutateAsync(values);
      notifications.show({
        title: 'Usuário criado',
        message: `${values.email} cadastrado com sucesso`,
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
            Usuários
          </Title>
          <Button
            leftSection={<IconPlus size={16} />}
            color="indigo"
            onClick={() => setCreateOpened(true)}
            disabled={tenantOptions.length === 0}
          >
            Novo usuário
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
                  <Table.Th>E-mail</Table.Th>
                  <Table.Th>Papel</Table.Th>
                  <Table.Th>Filial</Table.Th>
                  <Table.Th>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {users?.map((user) => (
                  <Table.Tr key={user.id}>
                    <Table.Td>{user.email}</Table.Td>
                    <Table.Td>
                      <Badge color={user.role === 'super_admin' ? 'indigo' : 'blue'}>
                        {ROLE_LABELS[user.role]}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {user.tenant?.name ?? (
                        <Text c="dimmed" size="sm">
                          —
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Badge color={user.isActive ? 'green' : 'gray'}>
                        {user.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
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
        title="Novo usuário operacional"
        centered
      >
        <form onSubmit={handleCreate}>
          <Stack gap="md">
            <TextInput
              label="E-mail"
              placeholder="gerente@paulista.mariaborboleta.com"
              {...form.getInputProps('email')}
            />
            <PasswordInput
              label="Senha"
              placeholder="Senha inicial"
              {...form.getInputProps('password')}
            />
            <Select
              label="Papel"
              data={OPERATIONAL_ROLES}
              {...form.getInputProps('role')}
            />
            <Select
              label="Filial"
              placeholder="Selecione a filial"
              data={tenantOptions}
              searchable
              {...form.getInputProps('tenantId')}
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setCreateOpened(false)}>
                Cancelar
              </Button>
              <Button type="submit" color="indigo" loading={createMutation.isPending}>
                Criar usuário
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
