import {
  Badge,
  Container,
  Group,
  Loader,
  ScrollArea,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { DateTime } from "luxon";
import { useAdminAuditLogs } from "../hooks/useAdminAuditLogs";
import type { AdminAuditLog } from "../../types/admin.types";
import {
  backofficeAccent,
  backofficeTableStyles,
} from "../utils/backoffice-theme.util";

/** Rótulos amigáveis para as ações registradas. */
const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  "tenant.create": { label: "Criou filial", color: "green" },
  "tenant.update": { label: "Atualizou filial", color: "blue" },
  "user.create": { label: "Criou usuário", color: "green" },
  "user.update": { label: "Atualizou usuário", color: "blue" },
};

function actionBadge(action: string) {
  return ACTION_LABELS[action] ?? { label: action, color: "gray" };
}

/** Resumo legível do metadata (ex.: slug, nome, e-mail alterado). */
function describeMetadata(metadata: Record<string, unknown> | null): string {
  if (!metadata) return "—";
  const parts = Object.entries(metadata)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${k}: ${String(v)}`);
  return parts.length ? parts.join(" · ") : "—";
}

export function BackofficeAuditLogs() {
  const { data: logs, isLoading } = useAdminAuditLogs(100);

  return (
    <Container style={{ maxWidth: "95%" }} px={{ base: "xs", sm: "md" }}>
      <Stack gap="md" mb="xl">
        <Stack gap="xs">
          <Title order={1} c="gray.8">
            Ações recentes
          </Title>
          <Text c="dimmed">
            Registro de auditoria das operações do backoffice (filiais e
            usuários).
          </Text>
        </Stack>

        {isLoading ? (
          <Group justify="center" py="xl">
            <Loader color={backofficeAccent} />
          </Group>
        ) : !logs?.length ? (
          <Text c="dimmed" ta="center" py="xl">
            Nenhuma ação registrada ainda.
          </Text>
        ) : (
          <ScrollArea>
            <Table
              highlightOnHover
              withTableBorder
              withColumnBorders
              styles={backofficeTableStyles}
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Quando</Table.Th>
                  <Table.Th>Quem</Table.Th>
                  <Table.Th>Ação</Table.Th>
                  <Table.Th>Detalhes</Table.Th>
                  <Table.Th>IP</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {logs.map((log: AdminAuditLog) => {
                  const badge = actionBadge(log.action);
                  const when = DateTime.fromISO(log.createdAt).setLocale(
                    "pt-BR",
                  );
                  return (
                    <Table.Tr key={log.id}>
                      <Table.Td>
                        <Stack gap={0}>
                          <Text size="sm">
                            {when.toFormat("dd/MM/yyyy HH:mm")}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {when.toRelative()}
                          </Text>
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{log.actorEmail ?? "—"}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={badge.color} variant="light">
                          {badge.label}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {describeMetadata(log.metadata)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" ff="monospace" c="dimmed">
                          {log.ipAddress ?? "—"}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        )}
      </Stack>
    </Container>
  );
}
