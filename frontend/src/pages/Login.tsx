import {
  Alert,
  Box,
  Button,
  Center,
  Image,
  Loader,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';
import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../utils/error.util';
import {
  DEV_BANNER_HEIGHT,
  DevEnvironmentBanner,
} from '../components/DevEnvironmentBanner';
import { createLoginBackground, DEFAULT_LOGIN_BRANDING } from '../utils/theme.util';
import type { LoginDto } from '../types/auth.types';

export function Login() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const branding = DEFAULT_LOGIN_BRANDING;
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginDto>({
    initialValues: {
      // Em dev, pré-preenche com o admin do seed para agilizar os testes.
      email: import.meta.env.DEV ? 'admin@paulista.mariaborboleta.com' : '',
      password: import.meta.env.DEV ? 'Senha123!' : '',
    },
    validate: {
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

  if (isLoading) {
    return (
      <Center
        mih="100vh"
        style={{
          background: createLoginBackground(
            branding.primaryColor,
            branding.accentColor,
          ),
        }}
      >
        <Loader color="brand" />
      </Center>
    );
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

  const devBannerOffset = import.meta.env.DEV ? DEV_BANNER_HEIGHT : 0;

  return (
    <>
      <DevEnvironmentBanner />
      <Center
      mih="100vh"
      pt={devBannerOffset}
      style={{
        background: createLoginBackground(
          branding.primaryColor,
          branding.accentColor,
        ),
      }}
    >
      <Paper shadow="md" radius="lg" p="xl" w={420} withBorder>
        <Stack gap="lg">
          <Stack gap="xs" align="center">
            <Image
              src="/logo-ageendoo.svg"
              alt="Ageendoo"
              w={200}
              fit="contain"
            />
            <Text c="dimmed" size="sm" ta="center">
              Entre com seu e-mail e senha
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
                placeholder="seu@email.com"
                autoComplete="username"
                {...form.getInputProps('email')}
              />
              <PasswordInput
                label="Senha"
                placeholder="Sua senha"
                autoComplete="current-password"
                {...form.getInputProps('password')}
              />
              <Button type="submit" loading={submitting} fullWidth color="brand">
                Entrar
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Center>
    </>
  );
}
