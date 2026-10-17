import {
  Box,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { IconArrowRight, IconBook2, IconSearch } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MANUAL_TOPICS } from "./manual-topics";

export function ManualIndex() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const topics = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MANUAL_TOPICS;
    return MANUAL_TOPICS.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <Box
      style={{ width: "100%", paddingInline: "var(--mantine-spacing-md)" }}
      pb="xl"
    >
      <Box style={{ maxWidth: 980, marginInline: "auto" }}>
        <Group gap="md" align="center" mb="xs">
          <ThemeIcon size={56} radius="lg" variant="light" color="brand">
            <IconBook2 size={30} />
          </ThemeIcon>
          <Stack gap={2}>
            <Title order={1} c="brand">
              Manual
            </Title>
            <Text c="dimmed">
              Aprenda a usar cada funcionalidade do sistema.
            </Text>
          </Stack>
        </Group>

        <TextInput
          mt="md"
          mb="xl"
          size="md"
          placeholder="O que você quer aprender?"
          leftSection={<IconSearch size={18} />}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
        />

        {topics.length === 0 ? (
          <Text c="dimmed">Nenhum tópico encontrado para "{query}".</Text>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            {topics.map((topic) => (
              <Card
                key={topic.slug}
                withBorder
                radius="lg"
                padding="lg"
                style={{ cursor: "pointer", height: "100%" }}
                onClick={() => navigate(`/manual/${topic.slug}`)}
              >
                <Stack gap="sm" h="100%">
                  <ThemeIcon
                    size={48}
                    radius="md"
                    variant="light"
                    color={topic.color}
                  >
                    {topic.icon}
                  </ThemeIcon>
                  <Text fw={700} fz="lg">
                    {topic.title}
                  </Text>
                  <Text size="sm" c="dimmed" style={{ flex: 1 }}>
                    {topic.summary}
                  </Text>
                  <Group gap={4} c={topic.color}>
                    <Text size="sm" fw={500}>
                      Abrir
                    </Text>
                    <IconArrowRight size={16} />
                  </Group>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Box>
    </Box>
  );
}
