import {
  Badge,
  Button,
  Card,
  Container,
  Group,
  Loader,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { DatePickerInput, MonthPickerInput } from '@mantine/dates';
import {
  IconArrowLeft,
  IconCalendar,
  IconCash,
  IconCurrencyDollar,
  IconReceipt,
  IconTrendingDown,
  IconTrendingUp,
} from '@tabler/icons-react';
import { DateTime } from 'luxon';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppointmentStatus, type Appointment } from '../../types';
import { formatDate } from '../../utils/appointment.utils';
import { formatPrice, sumMoney, toMoney } from '../../utils/money.util';
import {
  useAdminTenantAppointments,
  useAdminTenantCommissions,
  useAdminTenantDetail,
  useAdminTenantSummary,
} from '../hooks/useAdminTenantDetail';
import { TenantConfigTab } from '../components/TenantConfigTab';

const tableStyles = {
  th: { backgroundColor: '#1e293b', color: '#e2e8f0' },
  td: { backgroundColor: '#0f172a', color: '#f1f5f9' },
};

const cardStyle = {
  borderColor: '#334155',
  backgroundColor: '#1e293b',
};

const statusColors: Record<AppointmentStatus, string> = {
  agendado: 'blue',
  concluido: 'green',
  cancelado: 'red',
};

const statusLabels: Record<AppointmentStatus, string> = {
  agendado: 'Agendado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

function getMonthName(month: number): string {
  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  return months[month - 1];
}

function TenantSummaryTab({ tenantId }: { tenantId: string }) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const { year, month } = useMemo(() => {
    const currentDate = selectedDate
      ? DateTime.fromJSDate(selectedDate, { zone: 'America/Sao_Paulo' })
      : DateTime.now().setZone('America/Sao_Paulo');

    return {
      year: currentDate.year,
      month: currentDate.month,
    };
  }, [selectedDate]);

  const { data: report, isLoading } = useAdminTenantSummary(tenantId, year, month);

  const cards = [
    {
      title: 'Total Agendado',
      value: toMoney(report?.totalScheduled),
      icon: IconReceipt,
      color: 'blue',
    },
    {
      title: 'Serviços Pagos',
      value: toMoney(report?.totalPaid),
      icon: IconCash,
      color: 'green',
    },
    {
      title: 'Serviços Não Pagos',
      value: toMoney(report?.totalUnpaid),
      icon: IconTrendingDown,
      color: 'orange',
    },
    {
      title: 'Comissões Pagas',
      value: toMoney(report?.totalCommissionsPaid),
      icon: IconCurrencyDollar,
      color: 'violet',
    },
    {
      title: 'Comissões Previstas',
      value: toMoney(report?.totalCommissionsExpected),
      icon: IconCurrencyDollar,
      color: 'indigo',
    },
    {
      title: 'Valor Líquido',
      value: toMoney(report?.netAmount),
      icon: IconTrendingUp,
      color: toMoney(report?.netAmount) >= 0 ? 'teal' : 'red',
    },
  ];

  return (
    <Stack gap="lg">
      <Group justify="space-between" wrap="wrap">
        <Text c="dimmed">
          Relatório de {getMonthName(month)} de {year}
        </Text>
        <MonthPickerInput
          value={selectedDate}
          onChange={(value) => setSelectedDate(value as Date | null)}
          placeholder="Selecione o mês"
          valueFormat="MM/YYYY"
          style={{ maxWidth: 200 }}
        />
      </Group>

      {isLoading ? (
        <Group justify="center" py="xl">
          <Loader color="indigo" />
        </Group>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title} padding="lg" radius="md" withBorder style={cardStyle}>
                <Group justify="space-between">
                  <Stack gap={4}>
                    <Text size="sm" c="dimmed">
                      {card.title}
                    </Text>
                    <Text size="xl" fw={700} c="white">
                      {formatPrice(card.value)}
                    </Text>
                  </Stack>
                  <ThemeIcon size={48} radius="md" color={card.color} variant="light">
                    <Icon size={24} />
                  </ThemeIcon>
                </Group>
              </Card>
            );
          })}
        </SimpleGrid>
      )}
    </Stack>
  );
}

function TenantAppointmentsTab({ tenantId }: { tenantId: string }) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const dateFilter = useMemo(() => {
    if (!selectedDate) {
      return DateTime.now().setZone('America/Sao_Paulo').toFormat('yyyy-MM-dd');
    }
    return DateTime.fromJSDate(selectedDate, {
      zone: 'America/Sao_Paulo',
    }).toFormat('yyyy-MM-dd');
  }, [selectedDate]);

  const { data: appointments, isLoading } = useAdminTenantAppointments(
    tenantId,
    dateFilter,
  );

  const getTotalPrice = (appointment: Appointment) =>
    sumMoney(appointment.scheduledServices?.map((service) => service.price) ?? []);

  return (
    <Stack gap="md">
      <DatePickerInput
        label="Data"
        value={selectedDate}
        onChange={(value) => setSelectedDate(value as Date | null)}
        leftSection={<IconCalendar size={16} />}
        valueFormat="DD/MM/YYYY"
        style={{ maxWidth: 280 }}
      />

      {isLoading ? (
        <Group justify="center" py="xl">
          <Loader color="indigo" />
        </Group>
      ) : !appointments?.length ? (
        <Text c="dimmed" ta="center" py="xl">
          Nenhum agendamento nesta data
        </Text>
      ) : (
        <ScrollArea>
          <Table
            highlightOnHover
            withTableBorder
            withColumnBorders
            styles={tableStyles}
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Horário</Table.Th>
                <Table.Th>Cliente</Table.Th>
                <Table.Th>Telefone</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Serviços</Table.Th>
                <Table.Th>Total</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {appointments.map((appointment) => (
                <Table.Tr key={appointment.id}>
                  <Table.Td>
                    {appointment.startTime} – {appointment.endTime}
                  </Table.Td>
                  <Table.Td>{appointment.clientName}</Table.Td>
                  <Table.Td>{appointment.clientPhone}</Table.Td>
                  <Table.Td>
                    <Badge color={statusColors[appointment.status]}>
                      {statusLabels[appointment.status]}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {appointment.scheduledServices
                      ?.map((service) => service.service?.name)
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </Table.Td>
                  <Table.Td>{formatPrice(getTotalPrice(appointment))}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      )}
    </Stack>
  );
}

function TenantCommissionsTab({ tenantId }: { tenantId: string }) {
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const filters = useMemo(() => {
    const filterObj: {
      paid?: boolean;
      startDate?: string;
      endDate?: string;
    } = {};

    if (activeTab === 'pending') {
      filterObj.paid = false;
    } else if (activeTab === 'paid') {
      filterObj.paid = true;
    }

    if (startDate) {
      filterObj.startDate = DateTime.fromJSDate(startDate, {
        zone: 'America/Sao_Paulo',
      }).toFormat('yyyy-MM-dd');
    }

    if (endDate) {
      filterObj.endDate = DateTime.fromJSDate(endDate, {
        zone: 'America/Sao_Paulo',
      }).toFormat('yyyy-MM-dd');
    }

    return Object.keys(filterObj).length > 0 ? filterObj : undefined;
  }, [activeTab, startDate, endDate]);

  const { data: commissions, isLoading } = useAdminTenantCommissions(
    tenantId,
    filters,
  );

  const commissionsToShow = useMemo(() => {
    const list = commissions ?? [];
    if (!searchTerm) return list;

    const term = searchTerm.toLowerCase();
    return list.filter((commission) => {
      const serviceName =
        commission.scheduledService?.service?.name?.toLowerCase() ?? '';
      const clientName =
        commission.scheduledService?.appointment?.clientName?.toLowerCase() ?? '';
      const collaboratorName =
        commission.collaborator?.name?.toLowerCase() ?? '';
      return (
        serviceName.includes(term) ||
        clientName.includes(term) ||
        collaboratorName.includes(term)
      );
    });
  }, [commissions, searchTerm]);

  const totals = useMemo(() => {
    const total = sumMoney(commissionsToShow.map((c) => c.amount));
    const pending = sumMoney(
      commissionsToShow.filter((c) => !c.paid).map((c) => c.amount),
    );
    const paid = sumMoney(
      commissionsToShow.filter((c) => c.paid).map((c) => c.amount),
    );
    return { total, pending, paid };
  }, [commissionsToShow]);

  return (
    <Stack gap="md">
      <Tabs value={activeTab} onChange={(value) => setActiveTab(value ?? 'pending')}>
        <Tabs.List>
          <Tabs.Tab value="pending">Pendentes</Tabs.Tab>
          <Tabs.Tab value="paid">Pagas</Tabs.Tab>
          <Tabs.Tab value="all">Todas</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <Group wrap="wrap">
        <DatePickerInput
          placeholder="Data inicial"
          value={startDate}
          onChange={(value) => setStartDate(value as Date | null)}
          leftSection={<IconCalendar size={16} />}
          valueFormat="DD/MM/YYYY"
          clearable
          style={{ maxWidth: 180 }}
        />
        <DatePickerInput
          placeholder="Data final"
          value={endDate}
          onChange={(value) => setEndDate(value as Date | null)}
          leftSection={<IconCalendar size={16} />}
          valueFormat="DD/MM/YYYY"
          clearable
          style={{ maxWidth: 180 }}
        />
        <TextInput
          placeholder="Buscar por serviço, cliente ou colaborador..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.currentTarget.value)}
          style={{ flex: 1, minWidth: 240 }}
        />
      </Group>

      <Group>
        <Card padding="sm" radius="md" withBorder style={cardStyle}>
          <Text size="xs" c="dimmed">
            Total
          </Text>
          <Text fw={600}>{formatPrice(totals.total)}</Text>
        </Card>
        <Card padding="sm" radius="md" withBorder style={cardStyle}>
          <Text size="xs" c="dimmed">
            Pendentes
          </Text>
          <Text fw={600} c="yellow">
            {formatPrice(totals.pending)}
          </Text>
        </Card>
        <Card padding="sm" radius="md" withBorder style={cardStyle}>
          <Text size="xs" c="dimmed">
            Pagas
          </Text>
          <Text fw={600} c="green">
            {formatPrice(totals.paid)}
          </Text>
        </Card>
      </Group>

      {isLoading ? (
        <Group justify="center" py="xl">
          <Loader color="indigo" />
        </Group>
      ) : commissionsToShow.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          Nenhuma comissão encontrada
        </Text>
      ) : (
        <ScrollArea>
          <Table
            highlightOnHover
            withTableBorder
            withColumnBorders
            styles={tableStyles}
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Status</Table.Th>
                <Table.Th>Colaborador</Table.Th>
                <Table.Th>Serviço</Table.Th>
                <Table.Th>Cliente</Table.Th>
                <Table.Th>Data</Table.Th>
                <Table.Th>Valor</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {commissionsToShow.map((commission) => (
                <Table.Tr key={commission.id}>
                  <Table.Td>
                    <Badge color={commission.paid ? 'green' : 'yellow'}>
                      {commission.paid ? 'Paga' : 'Pendente'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{commission.collaborator?.name ?? '—'}</Table.Td>
                  <Table.Td>
                    {commission.scheduledService?.service?.name ?? '—'}
                  </Table.Td>
                  <Table.Td>
                    {commission.scheduledService?.appointment?.clientName ?? '—'}
                  </Table.Td>
                  <Table.Td>
                    {commission.scheduledService?.appointment?.date
                      ? formatDate(commission.scheduledService.appointment.date)
                      : '—'}
                  </Table.Td>
                  <Table.Td>{formatPrice(toMoney(commission.amount))}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      )}
    </Stack>
  );
}

export function BackofficeTenantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: tenant, isLoading, error } = useAdminTenantDetail(id);

  if (isLoading) {
    return (
      <Container style={{ maxWidth: '95%' }} px={{ base: 'xs', sm: 'md' }}>
        <Group justify="center" py="xl">
          <Loader color="indigo" />
        </Group>
      </Container>
    );
  }

  if (error || !tenant || !id) {
    return (
      <Container style={{ maxWidth: '95%' }} px={{ base: 'xs', sm: 'md' }}>
        <Stack gap="md" py="xl">
          <Text c="red">Filial não encontrada</Text>
          <Button
            variant="subtle"
            color="indigo"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate('/backoffice/tenants')}
          >
            Voltar para filiais
          </Button>
        </Stack>
      </Container>
    );
  }

  const metricCards = [
    {
      label: 'Agendamentos hoje',
      value: tenant.metrics.appointmentsToday,
      format: 'number' as const,
    },
    {
      label: 'Receita do mês',
      value: tenant.metrics.revenueThisMonth,
      format: 'money' as const,
    },
    {
      label: 'Comissões pendentes',
      value: tenant.metrics.pendingCommissions,
      format: 'money' as const,
    },
    {
      label: 'Colaboradores',
      value: tenant.metrics.collaborators,
      format: 'number' as const,
    },
    {
      label: 'Serviços',
      value: tenant.metrics.services,
      format: 'number' as const,
    },
    {
      label: 'Agendamentos (total)',
      value: tenant.metrics.appointments,
      format: 'number' as const,
    },
  ];

  return (
    <Container style={{ maxWidth: '95%' }} px={{ base: 'xs', sm: 'md' }}>
      <Stack gap="xl" mb="xl">
        <Group justify="space-between" wrap="wrap">
          <Stack gap="xs">
            <Button
              variant="subtle"
              color="indigo"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => navigate('/backoffice/tenants')}
              w="fit-content"
              px={0}
            >
              Voltar
            </Button>
            <Group gap="sm">
              <Title order={1} c="indigo.3">
                {tenant.name}
              </Title>
              <Badge color={tenant.isActive ? 'green' : 'gray'}>
                {tenant.isActive ? 'Ativa' : 'Inativa'}
              </Badge>
            </Group>
            <Text ff="monospace" c="dimmed" size="sm">
              {tenant.slug}
            </Text>
          </Stack>
        </Group>

        <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} spacing="md">
          {metricCards.map((card) => (
            <Card key={card.label} padding="md" radius="md" withBorder style={cardStyle}>
              <Text size="xs" c="dimmed">
                {card.label}
              </Text>
              <Text size="lg" fw={700} c="white">
                {card.format === 'money'
                  ? formatPrice(toMoney(card.value))
                  : card.value}
              </Text>
            </Card>
          ))}
        </SimpleGrid>

        <Tabs defaultValue="config" color="indigo">
          <Tabs.List>
            <Tabs.Tab value="config">Configuração</Tabs.Tab>
            <Tabs.Tab value="summary">Resumo financeiro</Tabs.Tab>
            <Tabs.Tab value="appointments">Agendamentos</Tabs.Tab>
            <Tabs.Tab value="commissions">Comissões</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="config" pt="lg">
            <TenantConfigTab tenant={tenant} />
          </Tabs.Panel>
          <Tabs.Panel value="summary" pt="lg">
            <TenantSummaryTab tenantId={id} />
          </Tabs.Panel>
          <Tabs.Panel value="appointments" pt="lg">
            <TenantAppointmentsTab tenantId={id} />
          </Tabs.Panel>
          <Tabs.Panel value="commissions" pt="lg">
            <TenantCommissionsTab tenantId={id} />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
