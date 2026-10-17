import { Stack } from "@mantine/core";
import { IconReceipt2, IconRepeat, IconCalendarEvent } from "@tabler/icons-react";
import {
  ArticleLayout,
  Callout,
  FeatureGrid,
  ManualHero,
  SectionTitle,
  Shot,
  StepList,
} from "../../../components/manual";

export function ExpensesArticle() {
  return (
    <ArticleLayout>
      <ManualHero
        icon={<IconReceipt2 size={32} />}
        title="Despesas"
        subtitle="Registre os custos do salão para enxergar o lucro real nos relatórios."
        color="red"
      />

      <Shot
        src="/manual/despesas.png"
        alt="Tela de despesas"
        caption="Despesas do mês com cards de resumo."
      />

      <Stack gap="xs">
        <SectionTitle>Registrando uma despesa</SectionTitle>
        <StepList
          color="red"
          steps={[
            {
              title: 'Clique em "Nova Despesa"',
              description: "Informe a descrição, a categoria e o valor.",
            },
            {
              title: "Escolha o tipo",
              description:
                "Esporádica (uma data específica) ou recorrente (todo mês).",
            },
            {
              title: "Salve",
              description:
                "A despesa passa a compor o resultado financeiro do período.",
            },
          ]}
        />
      </Stack>

      <FeatureGrid
        features={[
          {
            icon: <IconCalendarEvent size={20} />,
            title: "Despesa esporádica",
            description: "Um gasto pontual, lançado em uma data específica.",
            color: "red",
          },
          {
            icon: <IconRepeat size={20} />,
            title: "Despesa recorrente",
            description:
              "Custos fixos (aluguel, salários) que se repetem todo mês.",
            color: "orange",
          },
        ]}
      />

      <Callout variant="tip">
        As despesas entram no cálculo do <strong>lucro líquido</strong> dos
        relatórios: receita menos comissões menos despesas.
      </Callout>
    </ArticleLayout>
  );
}
