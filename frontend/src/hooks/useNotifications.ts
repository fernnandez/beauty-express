import { notifications } from "@mantine/notifications";
import { MESSAGES } from "../constants/messages.constants";
import { getErrorMessage, isNetworkError } from "../utils/error.util";

/**
 * Hook customizado para exibir notificações de forma consistente
 */
export function useNotifications() {
  const showSuccess = (message: string, title: string = "Sucesso") => {
    notifications.show({
      title,
      message,
      color: "green",
    });
  };

  const showError = (error: unknown, fallbackMessage?: string) => {
    const message = error
      ? getErrorMessage(error)
      : fallbackMessage || MESSAGES.ERROR.GENERIC;

    notifications.show({
      title: "Erro",
      message: isNetworkError(error) ? MESSAGES.ERROR.NETWORK : message,
      color: "red",
    });
  };

  const showInfo = (message: string, title: string = "Informação") => {
    notifications.show({
      title,
      message,
      color: "blue",
    });
  };

  const showWarning = (message: string, title: string = "Atenção") => {
    notifications.show({
      title,
      message,
      color: "orange",
    });
  };

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };
}
