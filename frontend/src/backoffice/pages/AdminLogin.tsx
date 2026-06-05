import {
  Alert,
  Anchor,
  Avatar,
  Box,
  Button,
  Center,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { getErrorMessage } from '../../utils/error.util';
import type { LoginDto } from '../../types/auth.types';

export function AdminLogin() {
  const { login, isAuthenticated, isLoading } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginDto>({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'E-mail inválido'),
      password: (value) =>
        value.length >= 6 ? null : 'Senha deve ter ao menos 6 caracteres',
    },
  });

  if (!isLoading && isAuthenticated) {
    const redirectTo =
      (location.state as { from?: string } | null)?.from || '/backoffice';
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = form.onSubmit(async (values) => {
    setSubmitting(true);
    setError(null);

    try {
      await login(values);
      notifications.show({
        title: 'Backoffice',
        message: 'Login realizado com sucesso',
        color: 'indigo',
      });
      const redirectTo =
        (location.state as { from?: string } | null)?.from || '/backoffice';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Center
      mih="100vh"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
      }}
    >
      <Paper
        shadow="md"
        radius="lg"
        p="xl"
        w={420}
        withBorder
        style={{ borderColor: '#334155', backgroundColor: '#1e293b' }}
      >
        <Stack gap="lg">
          <Stack gap="xs" align="center">
            <Avatar src="/logo.png" size={64} radius="md" />
            <Title order={2} ta="center" c="white">
              Backoffice
            </Title>
            <Text c="dimmed" size="sm" ta="center">
              Acesso exclusivo para super admin
            </Text>
          </Stack>

          {error && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              color="red"
              variant="light"
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack gap="md">
              <TextInput
                label="E-mail"
                placeholder="owner@beautyexpress.com"
                autoComplete="username"
                {...form.getInputProps('email')}
              />
              <PasswordInput
                label="Senha"
                placeholder="Sua senha"
                autoComplete="current-password"
                {...form.getInputProps('password')}
              />
              <Button
                type="submit"
                loading={submitting}
                fullWidth
                color="indigo"
              >
                Entrar no backoffice
              </Button>
            </Stack>
          </Box>

          <Text size="sm" ta="center" c="dimmed">
            App operacional?{' '}
            <Anchor component={Link} to="/login" c="indigo">
              Fazer login na filial
            </Anchor>
          </Text>
        </Stack>
      </Paper>
    </Center>
  );
}
