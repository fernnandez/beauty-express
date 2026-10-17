import { Stack } from "@mantine/core";
import { IconScissors, IconPercentage, IconTag } from "@tabler/icons-react";
import {
  ArticleLayout,
  Callout,
  FeatureGrid,
  ManualHero,
  SectionTitle,
  Shot,
  StepList,
} from "../../../components/manual";

export function ServicesArticle() {
  return (
    <ArticleLayout>
      <ManualHero
        icon={<IconScissors size={32} />}
        title="Serviços"
        subtitle="Monte o catálogo do salão com preços e percentual de comissão."
        color="violet"
      />

      <Shot
        src="/manual/servicos.png"
        alt="Catálogo de serviços"
        caption="Catálogo de serviços do estabelecimento."
      />

      <Stack gap="xs">
        <SectionTitle>Cadastrando um serviço</SectionTitle>
        <StepList
          color="violet"
          steps={[
            {
              title: 'Clique em "Novo Serviço"',
              description: "Informe o nome e uma descrição opcional.",
            },
            {
              title: "Defina o preço padrão",
              description:
                "Esse valor é sugerido no agendamento e pode ser ajustado por atendimento.",
            },
            {
              title: "Informe a comissão (%)",
              description:
                "Percentual aplicado para calcular a comissão do profissional.",
            },
          ]}
        />
      </Stack>

      <FeatureGrid
        features={[
          {
            icon: <IconTag size={20} />,
            title: "Preço flexível",
            description:
              "O preço padrão pode ser alterado na hora do agendamento.",
            color: "violet",
          },
          {
            icon: <IconPercentage size={20} />,
            title: "Comissão por serviço",
            description:
              "Cada serviço tem seu próprio percentual de comissão.",
            color: "orange",
          },
        ]}
      />

      <Callout variant="tip">
        Se o seu estabelecimento não trabalha com comissões, o campo de
        percentual fica oculto — basta desativar comissões nas configurações.
      </Callout>
    </ArticleLayout>
  );
}
