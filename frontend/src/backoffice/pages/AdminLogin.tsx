import {
  Alert,
  Anchor,
  Box,
  Button,
  Center,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCalendarEvent } from '@tabler/icons-react';
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { getErrorMessage } from '../../utils/error.util';
import type { AdminLoginDto } from '../../types/auth.types';
import {
  BACKOFFICE_NAME,
  BACKOFFICE_TAGLINE,
  backofficeAccent,
  backofficeCardStyle,
  backofficeInputStyles,
  backofficeLoginGradient,
} from '../utils/backoffice-theme.util';

export function AdminLogin() {
  const { login, isAuthenticated, isLoading } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AdminLoginDto>({
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
        title: BACKOFFICE_NAME,
        message: 'Login realizado com sucesso',
        color: backofficeAccent,
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
        background: backofficeLoginGradient,
      }}
    >
      <Paper
        shadow="md"
        radius="lg"
        p="xl"
        w={420}
        withBorder
        style={backofficeCardStyle}
      >
        <Stack gap="lg">
          <Stack gap="xs" align="center">
            <ThemeIcon size={64} radius="md" color={backofficeAccent} variant="light">
              <IconCalendarEvent size={34} stroke={1.5} />
            </ThemeIcon>
            <Title order={2} ta="center" c="white">
              {BACKOFFICE_NAME}
            </Title>
            <Text c="dimmed" size="sm" ta="center">
              {BACKOFFICE_TAGLINE}
            </Text>
            <Text c="dimmed" size="xs" ta="center">
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
                placeholder="admin@exemplo.com"
                autoComplete="username"
                styles={backofficeInputStyles}
                {...form.getInputProps('email')}
              />
              <PasswordInput
                label="Senha"
                placeholder="Sua senha"
                autoComplete="current-password"
                styles={backofficeInputStyles}
                {...form.getInputProps('password')}
              />
              <Button
                type="submit"
                loading={submitting}
                fullWidth
                color={backofficeAccent}
              >
                Entrar no backoffice
              </Button>
            </Stack>
          </Box>

          <Text size="sm" ta="center" c="dimmed">
            App operacional?{' '}
            <Anchor component={Link} to="/login" c="gray.4">
              Fazer login na filial
            </Anchor>
          </Text>
        </Stack>
      </Paper>
    </Center>
  );
}
