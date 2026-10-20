import { ActionIcon, Group, Tooltip } from "@mantine/core";
import {
  IconCheck,
  IconEdit,
  IconEye,
  IconTrash,
  IconX,
} from "@tabler/icons-react";

interface RowActionsProps {
  /** Handler do "Ver detalhes" (ícone de olho). Omitir para esconder. */
  onView?: () => void;
  /** Handler do "Editar" (ícone de lápis). Omitir para esconder. */
  onEdit?: () => void;
  /** Handler do "Concluir" (ícone de check). Omitir para esconder. */
  onComplete?: () => void;
  /** Handler do "Cancelar" (ícone de x). Omitir para esconder. */
  onCancel?: () => void;
  /** Handler do "Excluir" (ícone de lixeira). Omitir para esconder. */
  onDelete?: () => void;
  /** Desabilita o botão de excluir. */
  deleteDisabled?: boolean;
  /** Tooltip exibido no botão de excluir quando desabilitado. */
  deleteDisabledLabel?: string;
}

const ICON_SIZE = 19;

/**
 * Ações padronizadas de linha de tabela (ver detalhes, editar, excluir).
 * Usado nas tabelas de CRUD da área operacional para manter consistência visual.
 */
export function RowActions({
  onView,
  onEdit,
  onComplete,
  onCancel,
  onDelete,
  deleteDisabled = false,
  deleteDisabledLabel,
}: RowActionsProps) {
  return (
    <Group gap={6} wrap="nowrap">
      {onView && (
        <Tooltip label="Ver detalhes" withArrow>
          <ActionIcon variant="subtle" size="lg" color="gray"
          onClick={onView}
          aria-label="Ver detalhes">
            <IconEye size={ICON_SIZE} />
          </ActionIcon>
        </Tooltip>
      )}
      {onEdit && (
        <Tooltip label="Editar" withArrow>
          <ActionIcon variant="subtle" size="lg" color="blue"
          onClick={onEdit}
          aria-label="Editar">
            <IconEdit size={ICON_SIZE} />
          </ActionIcon>
        </Tooltip>
      )}
      {onComplete && (
        <Tooltip label="Concluir" withArrow>
          <ActionIcon variant="subtle" size="lg" color="green"
          onClick={onComplete}
          aria-label="Concluir">
            <IconCheck size={ICON_SIZE} />
          </ActionIcon>
        </Tooltip>
      )}
      {onCancel && (
        <Tooltip label="Cancelar" withArrow>
          <ActionIcon variant="subtle" size="lg" color="red"
          onClick={onCancel}
          aria-label="Cancelar">
            <IconX size={ICON_SIZE} />
          </ActionIcon>
        </Tooltip>
      )}
      {onDelete && (
        <Tooltip
          label={
            deleteDisabled && deleteDisabledLabel
              ? deleteDisabledLabel
              : "Excluir"
          }
          withArrow
        >
          <ActionIcon variant="subtle" size="lg" color="red"
          onClick={onDelete}
          disabled={deleteDisabled}
          aria-label="Excluir">
            <IconTrash size={ICON_SIZE} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );
}
