import { Stack, Text } from "@mantine/core";
import {
  IconAlertTriangle,
  IconCalendarStats,
  IconCash,
  IconCurrencyDollar,
  IconReceipt,
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

export function CommissionsArticle() {
  return (
    <ArticleLayout>
      <ManualHero
        icon={<IconCurrencyDollar size={32} />}
        title="Comissões"
        subtitle="Cálculo automático, controle de pagamento e alertas de atraso por colaborador."
        color="orange"
      />

      <Stack gap="xs">
        <SectionTitle>Como as comissões surgem</SectionTitle>
        <StepList
          color="orange"
          steps={[
            {
              title: "O atendimento é concluído",
              description:
                "Ao concluir um agendamento, cada serviço com profissional gera uma comissão.",
            },
            {
              title: "O valor é calculado automaticamente",
              description:
                "A comissão usa o percentual configurado no serviço sobre o valor cobrado.",
            },
            {
              title: "Você controla o pagamento",
              description:
                "No perfil do colaborador, marque as comissões como pagas quando quitar.",
            },
          ]}
        />
      </Stack>

      <Shot
        src="/manual/perfil-colaborador.png"
        alt="Comissões no perfil do colaborador"
        caption="As comissões são acessadas pelo perfil de cada colaborador."
      />

      <Stack gap="xs">
        <SectionTitle>Regime de período: quinzenal ou mensal</SectionTitle>
        <Text c="dimmed" size="sm">
          Em <strong>Configurações</strong> você define o regime do
          estabelecimento. No <strong>quinzenal</strong>, os pagamentos vencem
          no dia 15 e no fim do mês; no <strong>mensal</strong>, apenas no fim
          do mês. O regime também ajusta o filtro de período no app (mês inteiro
          ou 1ª/2ª quinzena).
        </Text>
      </Stack>

      <Stack gap="xs">
        <SectionTitle>Alertas de comissão atrasada</SectionTitle>
        <Text c="dimmed" size="sm">
          Na lista de colaboradores, cada profissional mostra um selo de
          conciliação: <strong>em dia</strong>, <strong>pendente</strong> (ainda
          no prazo) ou <strong>atrasado</strong> (venceu e não foi pago). Uma
          comissão vira atrasada no dia seguinte ao vencimento.
        </Text>
      </Stack>

      <Shot
        src="/manual/colaboradores.png"
        alt="Selos de comissão na lista de colaboradores"
        caption="Selos de atraso/pendência ajudam a conciliar os pagamentos."
      />

      <FeatureGrid
        features={[
          {
            icon: <IconCash size={20} />,
            title: "Cálculo automático",
            description:
              "Percentual por serviço aplicado no momento da conclusão.",
            color: "green",
          },
          {
            icon: <IconReceipt size={20} />,
            title: "Pagamento em lote",
            description:
              "Marque várias comissões como pagas de uma só vez.",
            color: "blue",
          },
          {
            icon: <IconCalendarStats size={20} />,
            title: "Regime configurável",
            description: "Quinzenal (15 e fim do mês) ou mensal.",
            color: "grape",
          },
          {
            icon: <IconAlertTriangle size={20} />,
            title: "Alertas de atraso",
            description:
              "Veja na hora quem tem comissões vencidas a pagar.",
            color: "red",
          },
        ]}
      />

      <Callout variant="tip">
        O colaborador com acesso ao app vê as próprias comissões em modo
        somente-leitura — ele acompanha, mas quem marca como pago é o
        administrador.
      </Callout>
    </ArticleLayout>
  );
}
