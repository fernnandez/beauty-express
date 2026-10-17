import { Card, SimpleGrid, Stack, Text, ThemeIcon } from "@mantine/core";
import type { ReactNode } from "react";

export interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
  color?: string;
}

interface FeatureGridProps {
  features: Feature[];
}

/** Grade de cards destacando recursos de uma funcionalidade. */
export function FeatureGrid({ features }: FeatureGridProps) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
      {features.map((feature, index) => (
        <Card key={index} withBorder radius="md" padding="md">
          <Stack gap="xs">
            <ThemeIcon
              size={40}
              radius="md"
              variant="light"
              color={feature.color ?? "brand"}
            >
              {feature.icon}
            </ThemeIcon>
            <Text fw={600}>{feature.title}</Text>
            <Text size="sm" c="dimmed">
              {feature.description}
            </Text>
          </Stack>
        </Card>
      ))}
    </SimpleGrid>
  );
}
