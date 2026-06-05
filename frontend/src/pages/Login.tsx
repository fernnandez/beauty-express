import {
  Alert,
  Avatar,
  Box,
  Button,
  Center,
  Paper,
  PasswordInput,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';
import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../utils/error.util';
import type { LoginDto } from '../types/auth.types';

const TENANT_OPTIONS = [
  { value: 'paulista', label: 'Maria Borboleta - Paulista' },
  { value: 'recife', label: 'Maria Borboleta - Recife' },
  { value: 'boaviagem', label: 'Maria Borboleta - Boa Viagem' },
];

export function Login() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginDto>({
    initialValues: {
      tenantSlug: 'paulista',
      email: '',
      password: '',
    },
    validate: {
      tenantSlug: (value) => (value ? null : 'Selecione a filial'),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'E-mail inválido'),
      password: (value) =>
        value.length >= 6 ? null : 'Senha deve ter ao menos 6 caracteres',
    },
  });

  if (!isLoading && isAuthenticated) {
    const redirectTo =
      (location.state as { from?: string } | null)?.from || '/';
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = form.onSubmit(async (values) => {
    setSubmitting(true);
    setError(null);

    try {
      await login(values);
      notifications.show({
        title: 'Bem-vindo',
        message: 'Login realizado com sucesso',
        color: 'green',
      });
      const redirectTo =
        (location.state as { from?: string } | null)?.from || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Center
      mih="100vh"
      style={{
        background: 'linear-gradient(135deg, #fdf2f8 0%, #faf5ff 50%, #fefefe 100%)',
      }}
    >
      <Paper shadow="md" radius="lg" p="xl" w={420} withBorder>
        <Stack gap="lg">
          <Stack gap="xs" align="center">
            <Avatar src="/logo.png" size={64} radius="md" />
            <Title order={2} ta="center">
              Beauty Express
            </Title>
            <Text c="dimmed" size="sm" ta="center">
              Acesse o sistema da sua filial
            </Text>
          </Stack>

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack gap="md">
              <Select
                label="Filial"
                data={TENANT_OPTIONS}
                searchable
                {...form.getInputProps('tenantSlug')}
              />
              <TextInput
                label="E-mail"
                placeholder="admin@paulista.mariaborboleta.com"
                autoComplete="username"
                {...form.getInputProps('email')}
              />
              <PasswordInput
                label="Senha"
                placeholder="Sua senha"
                autoComplete="current-password"
                {...form.getInputProps('password')}
              />
              <Button type="submit" loading={submitting} fullWidth color="pink">
                Entrar
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Center>
  );
}
