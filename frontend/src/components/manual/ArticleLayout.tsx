import { Anchor, Box, Group, Stack, Text, Title } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";

/** Título de seção dentro de um artigo. */
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Title order={3} mt="md">
      {children}
    </Title>
  );
}

/** Container do artigo do manual, com largura confortável de leitura e voltar. */
export function ArticleLayout({ children }: { children: ReactNode }) {
  return (
    <Box
      style={{ width: "100%", paddingInline: "var(--mantine-spacing-md)" }}
      pb="xl"
    >
      <Box style={{ maxWidth: 820, marginInline: "auto" }}>
        <Group mb="lg">
          <Anchor component={Link} to="/manual" c="dimmed" size="sm">
            <Group gap={4}>
              <IconArrowLeft size={16} />
              <Text size="sm">Voltar ao manual</Text>
            </Group>
          </Anchor>
        </Group>
        <Stack gap="xl">{children}</Stack>
      </Box>
    </Box>
  );
}
