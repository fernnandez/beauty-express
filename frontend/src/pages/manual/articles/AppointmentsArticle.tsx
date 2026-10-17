import { Stack, Text } from "@mantine/core";
import {
  IconCalendar,
  IconCheck,
  IconClock,
  IconHistory,
  IconLayoutGrid,
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

export function AppointmentsArticle() {
  return (
    <ArticleLayout>
      <ManualHero
        icon={<IconCalendar size={32} />}
        title="Agendamentos"
        subtitle="Organize a agenda do salão: marque, conclua e acompanhe os atendimentos."
      />

      <Shot
        src="/manual/agendamentos.png"
        alt="Tela de agendamentos"
        caption="Visão de lista dos agendamentos do dia."
      />

      <Stack gap="xs">
        <SectionTitle>Como criar um agendamento</SectionTitle>
        <StepList
          steps={[
            {
              title: "Abra Agendamentos no menu",
              description: "Você verá os atendimentos do dia selecionado.",
            },
            {
              title: 'Clique em "Novo Agendamento"',
              description:
                "Informe o cliente, a data e o horário de início.",
            },
            {
              title: "Adicione um ou mais serviços",
              description:
                "Para cada serviço escolha o profissional e, se precisar, ajuste o preço.",
            },
            {
              title: "Salve",
              description:
                "O agendamento aparece na agenda com status Agendado.",
            },
          ]}
        />
      </Stack>

      <Stack gap="xs">
        <SectionTitle>Concluir e cancelar</SectionTitle>
        <Text c="dimmed" size="sm">
          Ao finalizar o atendimento, use o botão de concluir (ícone de check).
          A conclusão gera automaticamente as comissões dos profissionais. Se
          precisar, é possível cancelar ou reabrir um atendimento — desde que a
          comissão ainda não tenha sido paga.
        </Text>
      </Stack>

      <Callout variant="tip">
        Você pode alternar entre a visão de <strong>lista</strong> e a visão de{" "}
        <strong>calendário</strong>, e navegar entre os dias pelas setas ou pelo
        seletor de data.
      </Callout>

      <Stack gap="xs">
        <SectionTitle>Recursos</SectionTitle>
        <FeatureGrid
          features={[
            {
              icon: <IconLayoutGrid size={20} />,
              title: "Múltiplos serviços",
              description:
                "Um agendamento pode ter vários serviços, cada um com seu profissional.",
              color: "blue",
            },
            {
              icon: <IconHistory size={20} />,
              title: "Registro retroativo",
              description:
                "Datas passadas são concluídas automaticamente e já geram comissão.",
              color: "grape",
            },
            {
              icon: <IconCheck size={20} />,
              title: "Conclusão rápida",
              description:
                "Conclua o atendimento em um clique direto pela agenda.",
              color: "green",
            },
            {
              icon: <IconClock size={20} />,
              title: "Agenda por horário",
              description:
                "Visualize os atendimentos ordenados pelo horário de início.",
              color: "orange",
            },
          ]}
        />
      </Stack>

      <Callout variant="warning">
        Um atendimento com comissão já paga não pode ser editado nem reaberto —
        isso protege a conciliação financeira.
      </Callout>
    </ArticleLayout>
  );
}
