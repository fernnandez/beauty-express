import {
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
import { useCollaborator } from "../hooks/useCollaborators";
import { useCollaboratorCommissionSummary } from "../hooks/useCommissions";
import { useOperationalBranding } from "../hooks/useOperationalBranding";
import { formatPrice } from "../utils/money.util";

export function CollaboratorProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { commissionsEnabled } = useOperationalBranding();
  const { data: collaborator, isLoading, isError } = useCollaborator(id);
  const { data: summary } = useCollaboratorCommissionSummary(
    id,
    undefined,
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
      <Group gap="sm" wrap="nowrap">
        {backButton}
        <Title order={1} c="brand">
          {collaborator?.name ?? "Colaborador"}
        </Title>
        {collaborator && (
          <Badge color={collaborator.isActive ? "green" : "red"}>
            {collaborator.isActive ? "Ativo" : "Inativo"}
          </Badge>
        )}
      </Group>
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
    <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
      <SummaryCard
        icon={<IconScissors size={22} />}
        color="blue"
        label="Serviços feitos"
        value={String(summary?.servicesCount ?? 0)}
      />
      <SummaryCard
        icon={<IconCash size={22} />}
        color="green"
        label="Comissão recebida"
        value={formatPrice(summary?.paidAmount ?? 0)}
      />
      <SummaryCard
        icon={<IconClock size={22} />}
        color="yellow"
        label="Comissão pendente"
        value={formatPrice(summary?.pendingAmount ?? 0)}
      />
      <SummaryCard
        icon={<IconUsers size={22} />}
        color="grape"
        label="Clientes únicos"
        value={String(summary?.uniqueClients ?? 0)}
      />
    </SimpleGrid>
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
    <Card padding="lg" radius="lg" shadow="sm">
      <Group gap="md" wrap="nowrap" align="center">
        <ThemeIcon color={color} size={48} radius="md" variant="light">
          {icon}
        </ThemeIcon>
        <Stack gap={2}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            {label}
          </Text>
          <Text fz={24} fw={800} lh={1}>
            {value}
          </Text>
        </Stack>
      </Group>
    </Card>
  );
}
