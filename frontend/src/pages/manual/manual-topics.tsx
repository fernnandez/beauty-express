import type { ComponentType, ReactNode } from "react";
import {
  IconCalendar,
  IconChartBar,
  IconCurrencyDollar,
  IconReceipt2,
  IconScissors,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";
import { AppointmentsArticle } from "./articles/AppointmentsArticle";
import { CommissionsArticle } from "./articles/CommissionsArticle";
import { CollaboratorsArticle } from "./articles/CollaboratorsArticle";
import { ServicesArticle } from "./articles/ServicesArticle";
import { ExpensesArticle } from "./articles/ExpensesArticle";
import { ReportsArticle } from "./articles/ReportsArticle";
import { SettingsArticle } from "./articles/SettingsArticle";

export interface ManualTopic {
  slug: string;
  title: string;
  summary: string;
  icon: ReactNode;
  color: string;
  Article: ComponentType;
}

export const MANUAL_TOPICS: ManualTopic[] = [
  {
    slug: "agendamentos",
    title: "Agendamentos",
    summary: "Marque, conclua e acompanhe os atendimentos do salão.",
    icon: <IconCalendar size={24} />,
    color: "blue",
    Article: AppointmentsArticle,
  },
  {
    slug: "comissoes",
    title: "Comissões",
    summary: "Cálculo automático, pagamentos e alertas de atraso.",
    icon: <IconCurrencyDollar size={24} />,
    color: "orange",
    Article: CommissionsArticle,
  },
  {
    slug: "colaboradores",
    title: "Colaboradores e acesso",
    summary: "Cadastre a equipe e dê acesso ao app para cada profissional.",
    icon: <IconUsers size={24} />,
    color: "teal",
    Article: CollaboratorsArticle,
  },
  {
    slug: "servicos",
    title: "Serviços",
    summary: "Monte o catálogo com preços e comissão.",
    icon: <IconScissors size={24} />,
    color: "violet",
    Article: ServicesArticle,
  },
  {
    slug: "despesas",
    title: "Despesas",
    summary: "Registre custos fixos e esporádicos.",
    icon: <IconReceipt2 size={24} />,
    color: "red",
    Article: ExpensesArticle,
  },
  {
    slug: "relatorios",
    title: "Relatórios",
    summary: "Receita, comissões, despesas e lucro líquido.",
    icon: <IconChartBar size={24} />,
    color: "green",
    Article: ReportsArticle,
  },
  {
    slug: "configuracoes",
    title: "Configurações",
    summary: "Identidade visual e regras de período e pagamento.",
    icon: <IconSettings size={24} />,
    color: "gray",
    Article: SettingsArticle,
  },
];

export function getManualTopic(slug: string): ManualTopic | undefined {
  return MANUAL_TOPICS.find((topic) => topic.slug === slug);
}
