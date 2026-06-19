import {
  ActionIcon,
  Badge,
  Button,
  Container,
  Divider,
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
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconPlus } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { BrandingFormFields } from '../components/BrandingFormFields';
import {
  useAdminPortals,
  useCreatePortal,
  useUpdatePortal,
} from '../hooks/useAdminPortals';
import { normalizeBranding } from '../utils/settings.util';
import { getErrorMessage } from '../../utils/error.util';
import type { CreatePortalDto, Portal, UpdatePortalDto } from '../../types/admin.types';
import type { LoginBranding } from '../../types/branding.types';

type PortalFormValues = {
  slug: string;
  host: string;
  isActive: boolean;
  loginBranding: LoginBranding;
};

function toFormValues(portal?: Portal | null): PortalFormValues {
  return {
    slug: portal?.slug ?? '',
    host: portal?.host ?? '',
    isActive: portal?.isActive ?? true,
    loginBranding: normalizeBranding(portal?.loginBranding, portal?.slug),
  };
}

export function BackofficePortals() {
  const { data: portals, isLoading } = useAdminPortals();
  const createMutation = useCreatePortal();
  const updateMutation = useUpdatePortal();
  const [createOpened, setCreateOpened] = useState(false);
  const [editOpened, setEditOpened] = useState(false);
  const [selectedPortal, setSelectedPortal] = useState<Portal | null>(null);

  const createForm = useForm<PortalFormValues>({
    initialValues: toFormValues(),
    validate: {
      slug: (value) =>
        /^[a-z0-9-]+$/.test(value)
          ? null
          : 'Use apenas letras minúsculas, números e hífens',
      host: (value) =>
        /^[a-z0-9.-]+$/.test(value)
          ? null
          : 'Host inválido (sem http://)',
      loginBranding: {
        displayName: (value) =>
          value.trim().length > 0 ? null : 'Nome exibido obrigatório',
      },
    },
  });

  const editForm = useForm<PortalFormValues>({
    initialValues: toFormValues(),
    validate: {
      slug: (value) =>
        /^[a-z0-9-]+$/.test(value)
          ? null
          : 'Use apenas letras minúsculas, números e hífens',
      host: (value) =>
        /^[a-z0-9.-]+$/.test(value)
          ? null
          : 'Host inválido (sem http://)',
      loginBranding: {
        displayName: (value) =>
          value.trim().length > 0 ? null : 'Nome exibido obrigatório',
      },
    },
  });

  useEffect(() => {
    if (selectedPortal && editOpened) {
      editForm.setValues(toFormValues(selectedPortal));
    }
  }, [selectedPortal, editOpened]);

  const handleCreate = createForm.onSubmit(async (values) => {
    try {
      const payload: CreatePortalDto = {
        slug: values.slug,
        host: values.host,
        isActive: values.isActive,
        loginBranding: values.loginBranding,
      };
      await createMutation.mutateAsync(payload);
      notifications.show({
        title: 'Portal criado',
        message: `${values.loginBranding.displayName} disponível em ${values.host}`,
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
    if (!selectedPortal) return;

    try {
      const payload: UpdatePortalDto = {
        slug: values.slug,
        host: values.host,
        isActive: values.isActive,
        loginBranding: values.loginBranding,
      };
      await updateMutation.mutateAsync({ id: selectedPortal.id, data: payload });
      notifications.show({
        title: 'Portal atualizado',
        message: `${values.loginBranding.displayName} salvo com sucesso`,
        color: 'green',
      });
      setEditOpened(false);
      setSelectedPortal(null);
    } catch (error) {
      notifications.show({
        title: 'Erro',
        message: getErrorMessage(error),
        color: 'red',
      });
    }
  });

  const handleToggleActive = async (portal: Portal) => {
    try {
      await updateMutation.mutateAsync({
        id: portal.id,
        data: { isActive: !portal.isActive },
      });
      notifications.show({
        title: 'Portal atualizado',
        message: portal.isActive ? 'Portal desativado' : 'Portal ativado',
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

  return (
    <Container style={{ maxWidth: '95%' }} px={{ base: 'xs', sm: 'md' }}>
      <Stack gap="md" mb="xl">
        <Group justify="space-between" wrap="wrap">
          <Stack gap={4}>
            <Title order={1} c="indigo.3">
              Portais de login
            </Title>
            <Text c="dimmed" size="sm">
              Subdomínios que definem o visual da tela de login
            </Text>
          </Stack>
          <Button
            leftSection={<IconPlus size={16} />}
            color="indigo"
            onClick={() => {
              createForm.setValues(toFormValues());
              setCreateOpened(true);
            }}
          >
            Novo portal
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
                  <Table.Th>Nome (login)</Table.Th>
                  <Table.Th>Slug</Table.Th>
                  <Table.Th>Host</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th w={120}>Ativo</Table.Th>
                  <Table.Th w={60} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {portals?.map((portal) => (
                  <Table.Tr key={portal.id}>
                    <Table.Td>{portal.loginBranding.displayName}</Table.Td>
                    <Table.Td>
                      <Text ff="monospace" size="sm">
                        {portal.slug}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text ff="monospace" size="sm">
                        {portal.host}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={portal.isActive ? 'green' : 'gray'}>
                        {portal.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Switch
                        checked={portal.isActive}
                        color="indigo"
                        disabled={updateMutation.isPending}
                        onChange={() => handleToggleActive(portal)}
                      />
                    </Table.Td>
                    <Table.Td>
                      <Tooltip label="Editar portal">
                        <ActionIcon
                          variant="subtle"
                          color="indigo"
                          onClick={() => {
                            setSelectedPortal(portal);
                            setEditOpened(true);
                          }}
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
        title="Novo portal de login"
        centered
        size="lg"
      >
        <form onSubmit={handleCreate}>
          <Stack gap="md">
            <TextInput
              label="Slug"
              placeholder="mariaborboleta"
              description="Identificador interno"
              {...createForm.getInputProps('slug')}
            />
            <TextInput
              label="Host (subdomínio)"
              placeholder="mariaborboleta.fernnandez.com"
              description="Domínio completo, sem https://"
              {...createForm.getInputProps('host')}
            />
            <Divider label="Branding do login" labelPosition="center" />
            <BrandingFormFields form={createForm} prefix="loginBranding" />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setCreateOpened(false)}>
                Cancelar
              </Button>
              <Button type="submit" color="indigo" loading={createMutation.isPending}>
                Criar portal
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={editOpened}
        onClose={() => {
          setEditOpened(false);
          setSelectedPortal(null);
        }}
        title="Editar portal de login"
        centered
        size="lg"
      >
        <form onSubmit={handleUpdate}>
          <Stack gap="md">
            <TextInput label="Slug" {...editForm.getInputProps('slug')} />
            <TextInput label="Host" {...editForm.getInputProps('host')} />
            <Switch
              label="Portal ativo"
              {...editForm.getInputProps('isActive', { type: 'checkbox' })}
            />
            <Divider label="Branding do login" labelPosition="center" />
            <BrandingFormFields form={editForm} prefix="loginBranding" />
            <Group justify="flex-end">
              <Button
                variant="default"
                onClick={() => {
                  setEditOpened(false);
                  setSelectedPortal(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" color="indigo" loading={updateMutation.isPending}>
                Salvar portal
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
