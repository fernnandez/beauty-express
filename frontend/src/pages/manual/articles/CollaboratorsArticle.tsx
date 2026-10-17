import { Stack, Text } from "@mantine/core";
import {
  IconDeviceMobile,
  IconKey,
  IconUserPlus,
  IconUsers,
} from "@tabler/icons-react";
import {
  ArticleLayout,
  Callout,
  FeatureGrid,
  ManualHero,
  SectionTitle,
  Shot,
  StepList,
} from "../../../components/manual";

export function CollaboratorsArticle() {
  return (
    <ArticleLayout>
      <ManualHero
        icon={<IconUsers size={32} />}
        title="Colaboradores e acesso"
        subtitle="Cadastre a equipe, associe serviços e dê acesso ao app para cada profissional."
      />

      <Shot
        src="/manual/colaboradores.png"
        alt="Lista de colaboradores"
        caption="Lista de colaboradores com status e selos de comissão."
      />

      <Stack gap="xs">
        <SectionTitle>Cadastrando um colaborador</SectionTitle>
        <StepList
          steps={[
            {
              title: 'Clique em "Novo Colaborador"',
              description: "Informe nome, telefone e área de atuação.",
            },
            {
              title: "Associe os serviços",
              description:
                "Defina quais serviços o profissional realiza (usado nos agendamentos).",
            },
            {
              title: "Salve",
              description: "O colaborador passa a aparecer na lista e na agenda.",
            },
          ]}
        />
      </Stack>

      <Stack gap="xs">
        <SectionTitle>Dando acesso ao app</SectionTitle>
        <Text c="dimmed" size="sm">
          No perfil do colaborador, use o controle{" "}
          <strong>Acesso do colaborador</strong> (no topo) para criar um login.
          Com acesso, o profissional entra pelo celular e vê apenas a própria
          agenda e as próprias comissões — sem acesso à gestão da filial.
        </Text>
        <StepList
          steps={[
            {
              title: "Abra o perfil do colaborador",
              description: "Clique no colaborador na lista.",
            },
            {
              title: 'Clique em "Conceder acesso"',
              description: "Informe um e-mail e uma senha inicial.",
            },
            {
              title: "Pronto",
              description:
                "Depois você pode trocar a senha, desativar ou revogar o acesso.",
            },
          ]}
        />
      </Stack>

      <FeatureGrid
        features={[
          {
            icon: <IconUserPlus size={20} />,
            title: "Ativar/desativar",
            description:
              "Desative um colaborador para que ele não entre em novos agendamentos.",
            color: "blue",
          },
          {
            icon: <IconKey size={20} />,
            title: "Acesso controlado",
            description:
              "Conceda, redefina senha ou revogue o login quando precisar.",
            color: "grape",
          },
          {
            icon: <IconDeviceMobile size={20} />,
            title: "Visão mobile",
            description:
              "O colaborador usa uma tela enxuta, pensada para o celular.",
            color: "teal",
          },
        ]}
      />

      <Callout variant="warning">
        A exclusão de colaboradores fica desabilitada para preservar o
        histórico. Para tirar alguém de operação, use a opção de desativar.
      </Callout>
    </ArticleLayout>
  );
}
