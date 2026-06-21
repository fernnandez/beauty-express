import {
  ActionIcon,
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
  Switch,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconPlus } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { OPERATIONAL_ROLES, ROLE_LABELS } from '../constants/roles';
import { useAdminTenants } from '../hooks/useAdminTenants';
import {
  useAdminUsers,
  useCreateAdminUser,
  useUpdateAdminUser,
} from '../hooks/useAdminUsers';
import { getErrorMessage } from '../../utils/error.util';
import { backofficeAccent } from '../utils/backoffice-theme.util';
import type {
  AdminUser,
  CreateAdminUserDto,
  UpdateAdminUserDto,
} from '../../types/admin.types';
import type { UserRole } from '../../types/auth.types';

interface UserEditFormValues {
  email: string;
  password: string;
  role: Exclude<UserRole, 'super_admin'>;
  tenantId: string;
  isActive: boolean;
}

export function BackofficeUsers() {
  const { data: users, isLoading } = useAdminUsers();
  const { data: tenants } = useAdminTenants();
  const createMutation = useCreateAdminUser();
  const updateMutation = useUpdateAdminUser();
  const [createOpened, setCreateOpened] = useState(false);
  const [editOpened, setEditOpened] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const createForm = useForm<CreateAdminUserDto>({
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

  const editForm = useForm<UserEditFormValues>({
    initialValues: {
      email: '',
      password: '',
      role: 'admin',
      tenantId: '',
      isActive: true,
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'E-mail inválido'),
      password: (value) =>
        value.length === 0 || value.length >= 6
          ? null
          : 'Senha deve ter ao menos 6 caracteres',
      tenantId: (value) => {
        if (selectedUser?.role === 'super_admin') return null;
        return value ? null : 'Selecione uma filial';
      },
    },
  });

  useEffect(() => {
    if (selectedUser && editOpened) {
      editForm.setValues({
        email: selectedUser.email,
        password: '',
        role:
          selectedUser.role === 'super_admin'
            ? 'admin'
            : (selectedUser.role as Exclude<UserRole, 'super_admin'>),
        tenantId: selectedUser.tenantId ?? '',
        isActive: selectedUser.isActive,
      });
    }
  }, [selectedUser, editOpened]);

  const tenantOptions =
    tenants?.map((t) => ({ value: t.id, label: t.name })) ?? [];

  const activeTenantOptions =
    tenants
      ?.filter((t) => t.isActive)
      .map((t) => ({ value: t.id, label: t.name })) ?? [];

  const handleEdit = (user: AdminUser) => {
    setSelectedUser(user);
    setEditOpened(true);
  };

  const handleCreate = createForm.onSubmit(async (values) => {
    try {
      await createMutation.mutateAsync(values);
      notifications.show({
        title: 'Usuário criado',
        message: `${values.email} cadastrado com sucesso`,
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
    if (!selectedUser) return;

    const payload: UpdateAdminUserDto = {
      email: values.email,
      isActive: values.isActive,
    };

    if (values.password.trim()) {
      payload.password = values.password;
    }

    if (selectedUser.role !== 'super_admin') {
      payload.role = values.role;
      payload.tenantId = values.tenantId;
    }

    try {
      await updateMutation.mutateAsync({ id: selectedUser.id, data: payload });
      notifications.show({
        title: 'Usuário atualizado',
        message: `${values.email} salvo com sucesso`,
        color: 'green',
      });
      setEditOpened(false);
      setSelectedUser(null);
    } catch (error) {
      notifications.show({
        title: 'Erro',
        message: getErrorMessage(error),
        color: 'red',
      });
    }
  });

  const isSuperAdmin = selectedUser?.role === 'super_admin';

  return (
    <Container style={{ maxWidth: '95%' }} px={{ base: 'xs', sm: 'md' }}>
      <Stack gap="md" mb="xl">
        <Group justify="space-between" wrap="wrap">
          <Title order={1} c="gray.3">
            Usuários
          </Title>
          <Button
            leftSection={<IconPlus size={16} />}
            color={backofficeAccent}
            onClick={() => setCreateOpened(true)}
            disabled={activeTenantOptions.length === 0}
          >
            Novo usuário
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
                  <Table.Th>E-mail</Table.Th>
                  <Table.Th>Papel</Table.Th>
                  <Table.Th>Filial</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th w={60} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {users?.map((user) => (
                  <Table.Tr key={user.id}>
                    <Table.Td>{user.email}</Table.Td>
                    <Table.Td>
                      <Badge color={user.role === 'super_admin' ? 'gray' : 'blue'}>
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
                    <Table.Td>
                      <Tooltip label="Editar">
                        <ActionIcon
                          variant="subtle"
                          color={backofficeAccent}
                          onClick={() => handleEdit(user)}
                        >
                          <IconEdit size={18} />
                        </ActionIcon>
                      </Tooltip>
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
              {...createForm.getInputProps('email')}
            />
            <PasswordInput
              label="Senha"
              placeholder="Senha inicial"
              {...createForm.getInputProps('password')}
            />
            <Select
              label="Papel"
              data={OPERATIONAL_ROLES}
              {...createForm.getInputProps('role')}
            />
            <Select
              label="Filial"
              placeholder="Selecione a filial"
              data={activeTenantOptions}
              searchable
              {...createForm.getInputProps('tenantId')}
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setCreateOpened(false)}>
                Cancelar
              </Button>
              <Button type="submit" color={backofficeAccent} loading={createMutation.isPending}>
                Criar usuário
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={editOpened}
        onClose={() => {
          setEditOpened(false);
          setSelectedUser(null);
        }}
        title="Editar usuário"
        centered
      >
        <form onSubmit={handleUpdate}>
          <Stack gap="md">
            <TextInput label="E-mail" {...editForm.getInputProps('email')} />
            <PasswordInput
              label="Nova senha"
              placeholder="Deixe em branco para não alterar"
              {...editForm.getInputProps('password')}
            />

            {!isSuperAdmin && (
              <>
                <Select
                  label="Papel"
                  data={OPERATIONAL_ROLES}
                  {...editForm.getInputProps('role')}
                />
                <Select
                  label="Filial"
                  data={tenantOptions}
                  searchable
                  {...editForm.getInputProps('tenantId')}
                />
              </>
            )}

            <Switch
              label="Usuário ativo"
              color={backofficeAccent}
              {...editForm.getInputProps('isActive', { type: 'checkbox' })}
            />

            <Group justify="flex-end">
              <Button
                variant="default"
                onClick={() => {
                  setEditOpened(false);
                  setSelectedUser(null);
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
