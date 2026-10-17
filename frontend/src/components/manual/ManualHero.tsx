import { Group, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import type { ReactNode } from "react";

interface ManualHeroProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  color?: string;
}

/** Cabeçalho de artigo do manual: ícone grande + título + resumo. */
export function ManualHero({
  icon,
  title,
  subtitle,
  color = "brand",
}: ManualHeroProps) {
  return (
    <Group gap="lg" align="center" wrap="nowrap">
      <ThemeIcon size={64} radius="lg" variant="light" color={color}>
        {icon}
      </ThemeIcon>
      <Stack gap={4}>
        <Title order={1} fz={{ base: 26, sm: 32 }}>
          {title}
        </Title>
        <Text c="dimmed" size="lg">
          {subtitle}
        </Text>
      </Stack>
    </Group>
  );
}
