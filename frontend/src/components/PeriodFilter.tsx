import { ActionIcon, Group, SegmentedControl, Text } from "@mantine/core";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import {
  monthLabel,
  shiftMonth,
  type Fortnight,
  type Period,
} from "../utils/period.util";

interface PeriodFilterProps {
  value: Period;
  onChange: (period: Period) => void;
}

/**
 * Navegação de período por mês (setas) + quinzena (mês inteiro / 1ª / 2ª).
 */
export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return (
    <Group gap="sm" wrap="wrap">
      <Group gap={4} wrap="nowrap">
        <ActionIcon
          variant="light"
          color="gray"
          onClick={() => onChange(shiftMonth(value, -1))}
          aria-label="Mês anterior"
        >
          <IconChevronLeft size={18} />
        </ActionIcon>
        <Text
          fw={500}
          style={{ minWidth: 130, textAlign: "center" }}
          tt="capitalize"
        >
          {monthLabel(value)}
        </Text>
        <ActionIcon
          variant="light"
          color="gray"
          onClick={() => onChange(shiftMonth(value, 1))}
          aria-label="Próximo mês"
        >
          <IconChevronRight size={18} />
        </ActionIcon>
      </Group>

      <SegmentedControl
        size="sm"
        value={value.fortnight}
        onChange={(f) => onChange({ ...value, fortnight: f as Fortnight })}
        data={[
          { value: "full", label: "Mês" },
          { value: "first", label: "1ª quinzena" },
          { value: "second", label: "2ª quinzena" },
        ]}
      />
    </Group>
  );
}
