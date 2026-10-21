import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button, Center, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Captura erros de renderização em qualquer tela e mostra uma mensagem
 * recuperável em vez de deixar a aplicação em branco.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log local para diagnóstico; em produção pode ir para um coletor.
    console.error("ErrorBoundary capturou um erro:", error, info);
  }

  private handleReload = (): void => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <Center h="100vh" p="md">
        <Stack align="center" gap="md" maw={420}>
          <ThemeIcon size={64} radius="xl" variant="light" color="red">
            <IconAlertTriangle size={32} />
          </ThemeIcon>
          <Title order={3} ta="center">
            Algo deu errado
          </Title>
          <Text c="dimmed" ta="center" size="sm">
            Ocorreu um erro inesperado nesta tela. Você pode recarregar para
            continuar de onde parou.
          </Text>
          <Button color="brand" onClick={this.handleReload}>
            Recarregar
          </Button>
        </Stack>
      </Center>
    );
  }
}
