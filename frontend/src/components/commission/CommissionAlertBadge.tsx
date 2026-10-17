import { Badge, Tooltip } from "@mantine/core";
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconClock,
} from "@tabler/icons-react";
import type { CollaboratorCommissionAlert } from "../../types";
import { formatPrice } from "../../utils/money.util";

interface CommissionAlertBadgeProps {
  alert?: CollaboratorCommissionAlert;
}

/**
 * Badge de conciliação de comissões por colaborador:
 * - vermelho: há comissões vencidas não pagas (mostra valor atrasado)
 * - amarelo: só há pendentes dentro do prazo
 * - verde: em dia (sem não pagas)
 */
export function CommissionAlertBadge({ alert }: CommissionAlertBadgeProps) {
  if (!alert || alert.status === "ok") {
    return (
      <Tooltip label="Sem comissões pendentes" withArrow>
        <Badge
          color="green"
          variant="light"
          leftSection={<IconCircleCheck size={13} />}
        >
          Em dia
        </Badge>
      </Tooltip>
    );
  }

  if (alert.status === "overdue") {
    return (
      <Tooltip
        label={`${alert.overdueCount} comissão(ões) atrasada(s)${
          alert.pendingCount > 0
            ? ` · ${formatPrice(alert.pendingAmount)} ainda no prazo`
            : ""
        }`}
        withArrow
      >
        <Badge
          color="red"
          variant="light"
          leftSection={<IconAlertTriangle size={13} />}
        >
          Atrasado · {formatPrice(alert.overdueAmount)}
        </Badge>
      </Tooltip>
    );
  }

  return (
    <Tooltip
      label={`${alert.pendingCount} comissão(ões) a pagar dentro do prazo`}
      withArrow
    >
      <Badge
        color="yellow"
        variant="light"
        leftSection={<IconClock size={13} />}
      >
        Pendente · {formatPrice(alert.pendingAmount)}
      </Badge>
    </Tooltip>
  );
}
