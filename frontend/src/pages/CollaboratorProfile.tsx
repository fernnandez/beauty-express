import {
  Accordion,
  ActionIcon,
  Badge,
  Box,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconBriefcase,
  IconCash,
  IconClock,
  IconPhone,
  IconScissors,
  IconUsers,
} from "@tabler/icons-react";
import { useNavigate, useParams } from "react-router-dom";
import { CommissionsPanel } from "../components/commission/CommissionsPanel";
import { CollaboratorAccessControl } from "../components/collaborator/CollaboratorAccessControl";
import { useCollaborator } from "../hooks/useCollaborators";
import { useCollaboratorCommissionSummary } from "../hooks/useCommissions";
import { useOperationalBranding } from "../hooks/useOperationalBranding";
import { formatPrice } from "../utils/money.util";
import {
  currentMonthPeriod,
  monthLabel,
  periodToDateRange,
} from "../utils/period.util";

export function CollaboratorProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { commissionsEnabled } = useOperationalBranding();
  const { data: collaborator, isLoading, isError } = useCollaborator(id);

  // Cards sempre refletem o mês atual.
  const currentMonth = currentMonthPeriod();
  const { startDate, endDate } = periodToDateRange(currentMonth);
  const { data: summary } = useCollaboratorCommissionSummary(
    id,
    { startDate, endDate },
    commissionsEnabled,
  );

  const backButton = (
    <ActionIcon
      variant="subtle"
      color="gray"
      size="lg"
      onClick={() => navigate("/collaborators")}
      title="Voltar para colaboradores"
    >
      <IconArrowLeft size={20} />
    </ActionIcon>
  );

  const profileInfo = (
    <Stack gap="xs">
      <Group gap="sm" wrap="nowrap" align="center">
        {backButton}
        <Title order={1} c="brand" fz={{ base: 24, sm: 32 }} lineClamp={2}>
          {collaborator?.name ?? "Colaborador"}
        </Title>
      </Group>
      {collaborator && (
        <Group gap="sm" wrap="wrap" pl={44}>
          <Badge color={collaborator.isActive ? "green" : "red"}>
            {collaborator.isActive ? "Ativo" : "Inativo"}
          </Badge>
          <CollaboratorAccessControl collaboratorId={collaborator.id} />
        </Group>
      )}
      {collaborator && (
        <Group gap="lg" wrap="wrap" pl={44}>
          {collaborator.area && (
            <Group gap={6}>
              <IconBriefcase size={15} color="var(--mantine-color-gray-6)" />
              <Text size="sm" c="dimmed">
                {collaborator.area}
              </Text>
            </Group>
          )}
          {collaborator.phone && (
            <Group gap={6}>
              <IconPhone size={15} color="var(--mantine-color-gray-6)" />
              <Text size="sm" c="dimmed">
                {collaborator.phone}
              </Text>
            </Group>
          )}
        </Group>
      )}
    </Stack>
  );

  const summaryCards = commissionsEnabled && (
    <Accordion
      variant="separated"
      radius="md"
      defaultValue="resumo"
      styles={{ content: { paddingInline: 0 } }}
    >
      <Accordion.Item value="resumo">
        <Accordion.Control>
          <Text size="sm" fw={600}>
            Resumo de {monthLabel(currentMonth)}
          </Text>
        </Accordion.Control>
        <Accordion.Panel>
          <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
            <SummaryCard
              icon={<IconScissors size={20} />}
              color="blue"
              label="Serviços feitos"
              value={String(summary?.servicesCount ?? 0)}
            />
            <SummaryCard
              icon={<IconCash size={20} />}
              color="green"
              label="Comissão recebida"
              value={formatPrice(summary?.paidAmount ?? 0)}
            />
            <SummaryCard
              icon={<IconClock size={20} />}
              color="yellow"
              label="Comissão pendente"
              value={formatPrice(summary?.pendingAmount ?? 0)}
            />
            <SummaryCard
              icon={<IconUsers size={20} />}
              color="grape"
              label="Clientes únicos"
              value={String(summary?.uniqueClients ?? 0)}
            />
          </SimpleGrid>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );

  if (isLoading) {
    return (
      <Box style={{ width: "100%", padding: "var(--mantine-spacing-md)" }}>
        <Text>Carregando...</Text>
      </Box>
    );
  }

  if (isError || !collaborator) {
    return (
      <Box style={{ width: "100%", padding: "var(--mantine-spacing-md)" }}>
        <Stack gap="md">
          <Group gap="sm">
            {backButton}
            <Title order={2}>Colaborador não encontrado</Title>
          </Group>
          <Text c="dimmed">
            Não foi possível carregar os dados deste colaborador.
          </Text>
        </Stack>
      </Box>
    );
  }

  // Sem comissões habilitadas: cabeçalho + serviços do colaborador.
  if (!commissionsEnabled) {
    return (
      <Box
        style={{ width: "100%", paddingInline: "var(--mantine-spacing-md)" }}
        pb="xl"
      >
        <Stack gap="lg">
          {profileInfo}
          <Stack gap="xs">
            <Title order={3}>Serviços</Title>
            {collaborator.services && collaborator.services.length > 0 ? (
              <Group gap="xs">
                {collaborator.services.map((s) => (
                  <Badge key={s.id} variant="light" color="brand">
                    {s.name}
                  </Badge>
                ))}
              </Group>
            ) : (
              <Text c="dimmed" size="sm">
                Nenhum serviço associado.
              </Text>
            )}
          </Stack>
        </Stack>
      </Box>
    );
  }

  return (
    <CommissionsPanel
      fixedCollaboratorId={collaborator.id}
      showTotals={false}
      headerTop={
        <Stack gap="lg">
          {profileInfo}
          {summaryCards}
        </Stack>
      }
    />
  );
}

interface SummaryCardProps {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: string;
}

function SummaryCard({ icon, color, label, value }: SummaryCardProps) {
  return (
    <Card padding="md" radius="lg" shadow="sm">
      <Stack gap="xs">
        <ThemeIcon color={color} size={38} radius="md" variant="light">
          {icon}
        </ThemeIcon>
        <Text size="xs" c="dimmed" tt="uppercase" fw={600} lineClamp={2}>
          {label}
        </Text>
        <Text fz={{ base: 20, sm: 24 }} fw={800} lh={1.1}>
          {value}
        </Text>
      </Stack>
    </Card>
  );
}
