import { Stack, Text } from "@mantine/core";
import {
  IconSettings,
  IconPalette,
  IconCalendarStats,
} from "@tabler/icons-react";
import {
  ArticleLayout,
  Callout,
  FeatureGrid,
  ManualHero,
  SectionTitle,
  Shot,
} from "../../../components/manual";

export function SettingsArticle() {
  return (
    <ArticleLayout>
      <ManualHero
        icon={<IconSettings size={32} />}
        title="Configurações"
        subtitle="Personalize a identidade do estabelecimento e as regras de período."
        color="gray"
      />

      <Shot
        src="/manual/configuracoes.png"
        alt="Tela de configurações"
        caption="Identidade visual e regras de período e pagamento."
      />

      <Stack gap="xs">
        <SectionTitle>Identidade visual</SectionTitle>
        <Text c="dimmed" size="sm">
          Defina o nome do estabelecimento e as cores (primária e de destaque).
          Elas aparecem no menu, na tela de login e nos relatórios — com
          pré-visualização em tempo real.
        </Text>
      </Stack>

      <Stack gap="xs">
        <SectionTitle>Período e pagamentos</SectionTitle>
        <Text c="dimmed" size="sm">
          Escolha o regime <strong>quinzenal</strong> ou <strong>mensal</strong>
          . Ele define o padrão do filtro de período no app e o vencimento das
          comissões (usado nos alertas de atraso). Opcionalmente, você pode
          customizar os dias de pagamento.
        </Text>
      </Stack>

      <FeatureGrid
        features={[
          {
            icon: <IconPalette size={20} />,
            title: "Marca do salão",
            description: "Nome e cores aplicados em todo o app.",
            color: "pink",
          },
          {
            icon: <IconCalendarStats size={20} />,
            title: "Regime de período",
            description: "Quinzenal ou mensal, refletido em todo o sistema.",
            color: "grape",
          },
        ]}
      />

      <Callout variant="warning">
        As cores usam o formato hexadecimal (ex.: <code>#bc5675</code>). A
        pré-visualização ajuda a validar antes de salvar.
      </Callout>
    </ArticleLayout>
  );
}
