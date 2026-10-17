import { Badge, Tooltip } from "@mantine/core";
import { IconAlertTriangle, IconCircleCheck } from "@tabler/icons-react";
import type { CollaboratorCommissionAlert } from "../../types";
import { formatPrice } from "../../utils/money.util";

interface CommissionAlertBadgeProps {
  alert?: CollaboratorCommissionAlert;
}

/**
 * Badge de conciliação de comissões por colaborador. Dois estados:
 * - vermelho "Atrasado": há comissões vencidas não pagas (mostra o valor)
 * - verde "Em dia": todo o resto (inclui pendências ainda no prazo)
 */
export function CommissionAlertBadge({ alert }: CommissionAlertBadgeProps) {
  if (alert?.status === "overdue") {
    return (
      <Tooltip
        label={`${alert.overdueCount} comissão(ões) vencida(s) não paga(s)`}
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
    <Tooltip label="Sem comissões vencidas" withArrow>
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
