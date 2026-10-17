import { Group, Stack, Text, ThemeIcon } from "@mantine/core";
import type { ReactNode } from "react";

export interface Step {
  title: string;
  description?: ReactNode;
}

interface StepListProps {
  steps: Step[];
  color?: string;
}

/** Passo a passo visual com marcadores numerados e linha conectora. */
export function StepList({ steps, color = "brand" }: StepListProps) {
  return (
    <Stack gap={0}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <Group
            key={index}
            align="flex-start"
            gap="md"
            wrap="nowrap"
            style={{ position: "relative" }}
          >
            <Stack gap={0} align="center" style={{ alignSelf: "stretch" }}>
              <ThemeIcon size={32} radius="xl" color={color} variant="filled">
                <Text fw={700} size="sm">
                  {index + 1}
                </Text>
              </ThemeIcon>
              {!isLast && (
                <div
                  style={{
                    width: 2,
                    flex: 1,
                    minHeight: 16,
                    backgroundColor: "var(--mantine-color-gray-3)",
                    marginBlock: 4,
                  }}
                />
              )}
            </Stack>
            <Stack gap={2} pb={isLast ? 0 : "lg"} style={{ flex: 1 }}>
              <Text fw={600}>{step.title}</Text>
              {step.description && (
                <Text c="dimmed" size="sm">
                  {step.description}
                </Text>
              )}
            </Stack>
          </Group>
        );
      })}
    </Stack>
  );
}
