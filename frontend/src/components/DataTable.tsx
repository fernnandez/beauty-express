import { Card, Group, Stack, Table, Text } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import type { ReactNode } from "react";

export interface DataTableColumn<T> {
  /** Identificador único da coluna. */
  key: string;
  /** Cabeçalho (desktop) e rótulo do campo (mobile). */
  header: ReactNode;
  /** Conteúdo da célula. */
  render: (row: T) => ReactNode;
  /** Largura opcional da coluna (desktop). */
  width?: number | string;
  /** Oculta este campo no card mobile (ex.: colunas secundárias). */
  hideOnMobile?: boolean;
  /** Trata esta coluna como o título do card no mobile (sem rótulo). */
  primary?: boolean;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  /** Ações por linha (ícones). Vão para a última coluna / rodapé do card. */
  actions?: (row: T) => ReactNode;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  /** Largura mínima da tabela no desktop (scroll só se necessário). */
  minWidth?: number;
}

/**
 * Tabela responsiva: usa <Table> no desktop e uma lista de cards empilhados no
 * mobile (sem scroll horizontal). Mantém um único ponto de definição de colunas.
 */
export function DataTable<T>({
  columns,
  data,
  rowKey,
  actions,
  onRowClick,
  loading,
  emptyMessage = "Nenhum registro encontrado",
  minWidth = 640,
}: DataTableProps<T>) {
  const isMobile = useMediaQuery("(max-width: 48em)");

  if (loading) {
    return (
      <Text ta="center" c="dimmed" py="xl">
        Carregando...
      </Text>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Text ta="center" c="dimmed" py="xl">
        {emptyMessage}
      </Text>
    );
  }

  // ---- MOBILE: cards empilhados ----
  if (isMobile) {
    return (
      <Stack gap="sm">
        {data.map((row) => {
          const primaryCol = columns.find((c) => c.primary);
          const fieldCols = columns.filter((c) => !c.primary && !c.hideOnMobile);
          return (
            <Card
              key={rowKey(row)}
              withBorder
              radius="md"
              padding="md"
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={onRowClick ? { cursor: "pointer" } : undefined}
            >
              <Stack gap={8}>
                {primaryCol && (
                  <Text fw={600} fz="md">
                    {primaryCol.render(row)}
                  </Text>
                )}
                {fieldCols.map((col) => (
                  <Group key={col.key} justify="space-between" gap="sm" wrap="nowrap">
                    <Text size="sm" c="dimmed">
                      {col.header}
                    </Text>
                    <Text size="sm" ta="right">
                      {col.render(row)}
                    </Text>
                  </Group>
                ))}
                {actions && (
                  <Group
                    justify="flex-end"
                    gap="xs"
                    mt={4}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {actions(row)}
                  </Group>
                )}
              </Stack>
            </Card>
          );
        })}
      </Stack>
    );
  }

  // ---- DESKTOP: tabela ----
  return (
    <Table striped highlightOnHover miw={minWidth}>
      <Table.Thead>
        <Table.Tr>
          {columns.map((col) => (
            <Table.Th key={col.key} w={col.width}>
              {col.header}
            </Table.Th>
          ))}
          {actions && <Table.Th w={120}>Ações</Table.Th>}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {data.map((row) => (
          <Table.Tr
            key={rowKey(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            style={onRowClick ? { cursor: "pointer" } : undefined}
          >
            {columns.map((col) => (
              <Table.Td key={col.key}>{col.render(row)}</Table.Td>
            ))}
            {actions && (
              <Table.Td onClick={(e) => e.stopPropagation()}>
                {actions(row)}
              </Table.Td>
            )}
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
