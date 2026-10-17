import { Stack, Text } from "@mantine/core";
import {
  IconChartBar,
  IconChartLine,
  IconCoin,
  IconFilter,
} from "@tabler/icons-react";
import {
  ArticleLayout,
  Callout,
  FeatureGrid,
  ManualHero,
  SectionTitle,
  Shot,
} from "../../../components/manual";

export function ReportsArticle() {
  return (
    <ArticleLayout>
      <ManualHero
        icon={<IconChartBar size={32} />}
        title="Relatórios"
        subtitle="Acompanhe receita, comissões, despesas e o lucro líquido do seu salão."
      />

      <Shot
        src="/manual/relatorios.png"
        alt="Relatórios financeiros"
        caption="Resumo financeiro com gráficos e cards agrupados."
      />

      <Stack gap="xs">
        <SectionTitle>O que você encontra</SectionTitle>
        <Text c="dimmed" size="sm">
          Os relatórios consolidam o período selecionado em cards de resumo e
          gráficos de evolução. Use o filtro de período para alternar entre mês
          inteiro e quinzenas (quando o regime quinzenal está ativo).
        </Text>
      </Stack>

      <FeatureGrid
        features={[
          {
            icon: <IconCoin size={20} />,
            title: "Receita e lucro",
            description:
              "Receita, comissões, despesas e lucro líquido do período.",
            color: "green",
          },
          {
            icon: <IconChartLine size={20} />,
            title: "Evolução mensal",
            description: "Gráficos de linha mostram a tendência ao longo do tempo.",
            color: "blue",
          },
          {
            icon: <IconFilter size={20} />,
            title: "Filtro de período",
            description: "Navegue por mês ou quinzena conforme o seu regime.",
            color: "grape",
          },
        ]}
      />

      <Callout variant="tip">
        Estabelecimentos sem comissões podem usar o modo "somente receita", que
        simplifica os relatórios ocultando as métricas de comissão.
      </Callout>
    </ArticleLayout>
  );
}
