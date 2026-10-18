import { Box, ScrollArea } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import type { ReactNode } from "react";

interface TablePageProps {
  /** Cabeçalho fixo (desktop): título, botões, filtros, alertas. */
  header: ReactNode;
  /** Conteúdo (tabela no desktop; cards no mobile). */
  children: ReactNode;
}

/**
 * Layout de páginas de listagem.
 * - Desktop: cabeçalho/filtros fixos e apenas o corpo rola (scroll interno).
 * - Mobile: sem tabelas (são cards), a página inteira rola normalmente —
 *   nada fica preso, nenhum conteúdo some atrás de um scroll interno.
 */
export function TablePage({ header, children }: TablePageProps) {
  const isMobile = useMediaQuery("(max-width: 48em)");

  if (isMobile) {
    return (
      <Box
        style={{
          width: "100%",
          paddingInline: "var(--mantine-spacing-md)",
          paddingBottom: "var(--mantine-spacing-md)",
        }}
      >
        <Box>{header}</Box>
        <Box>{children}</Box>
      </Box>
    );
  }

  return (
    <Box
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        width: "100%",
        paddingInline: "var(--mantine-spacing-md)",
        paddingBottom: "var(--mantine-spacing-md)",
      }}
    >
      <Box style={{ flexShrink: 0 }}>{header}</Box>
      <ScrollArea
        className="app-table-scroll"
        type="auto"
        style={{
          flex: 1,
          minHeight: 0,
          background: "#ffffff",
          borderRadius: 16,
          boxShadow: "0 2px 10px rgba(16, 24, 40, 0.06)",
        }}
        styles={{ viewport: { padding: "4px 10px" } }}
      >
        {children}
      </ScrollArea>
    </Box>
  );
}
