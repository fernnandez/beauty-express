import { Alert } from "@mantine/core";
import {
  IconAlertTriangle,
  IconBulb,
  IconCircleCheck,
} from "@tabler/icons-react";
import type { ReactNode } from "react";

type CalloutVariant = "tip" | "warning" | "success";

const config: Record<
  CalloutVariant,
  { color: string; icon: ReactNode; defaultTitle: string }
> = {
  tip: { color: "blue", icon: <IconBulb size={18} />, defaultTitle: "Dica" },
  warning: {
    color: "yellow",
    icon: <IconAlertTriangle size={18} />,
    defaultTitle: "Atenção",
  },
  success: {
    color: "green",
    icon: <IconCircleCheck size={18} />,
    defaultTitle: "Boas práticas",
  },
};

interface CalloutProps {
  variant?: CalloutVariant;
  title?: string;
  children: ReactNode;
}

/** Caixa de destaque para dicas, avisos e boas práticas. */
export function Callout({ variant = "tip", title, children }: CalloutProps) {
  const cfg = config[variant];
  return (
    <Alert
      color={cfg.color}
      variant="light"
      icon={cfg.icon}
      title={title ?? cfg.defaultTitle}
      radius="md"
    >
      {children}
    </Alert>
  );
}
