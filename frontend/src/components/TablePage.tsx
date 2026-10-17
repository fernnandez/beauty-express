import { Box, ScrollArea } from "@mantine/core";
import type { ReactNode } from "react";

interface TablePageProps {
  /** Cabeçalho fixo: título, botões, filtros, alertas. */
  header: ReactNode;
  /** Conteúdo rolável (a tabela). */
  children: ReactNode;
}

/**
 * Layout padrão para páginas com tabela.
 * A página ocupa a altura disponível da tela; o cabeçalho/filtros ficam fixos
 * e apenas o corpo da tabela rola (scroll interno), nunca a página inteira.
 */
export function TablePage({ header, children }: TablePageProps) {
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
