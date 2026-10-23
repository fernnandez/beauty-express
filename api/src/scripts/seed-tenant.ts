import 'dotenv/config';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { getDatabaseConfig } from '../config/database.config';
import { Collaborator } from '@domain/entities/collaborator.entity';
import { Service } from '@domain/entities/service.entity';
import { Client } from '@domain/entities/client.entity';
import {
  Appointment,
  AppointmentStatus,
} from '@domain/entities/appointment.entity';
import {
  ScheduledService,
  ScheduledServiceStatus,
} from '@domain/entities/scheduled-service.entity';
import { Commission } from '@domain/entities/commission.entity';
import { Expense } from '@domain/entities/expense.entity';
import { ExpenseCategory, ExpenseType } from '@domain/entities/expense-enums';
import { Tenant } from '@domain/entities/tenant.entity';
import { normalizePhone } from '@common/utils/phone.util';

/**
 * Seed LEVE e ESCOPADO em um único tenant.
 *
 * Diferente do seed de dev, este script:
 *  - NÃO reseta schema, NÃO usa synchronize, NÃO faz TRUNCATE global;
 *  - Só mexe nos dados do tenant informado (limpa e repopula apenas ele);
 *  - Preserva o tenant e os usuários (logins) existentes.
 *
 * Uso: SEED_TENANT_ID=<uuid> ts-node ... seed-tenant.ts
 *   ou: ts-node ... seed-tenant.ts <uuid>
 */
async function seedTenant() {
  const tenantId = process.env.SEED_TENANT_ID || process.argv[2];
  if (!tenantId) {
    throw new Error(
      'Informe o tenant: SEED_TENANT_ID=<uuid> ou como primeiro argumento.',
    );
  }

  const dataSource = new DataSource({
    ...getDatabaseConfig(),
    synchronize: false,
  });
  await dataSource.initialize();

  const tenantRepo = dataSource.getRepository(Tenant);
  const collaboratorRepo = dataSource.getRepository(Collaborator);
  const serviceRepo = dataSource.getRepository(Service);
  const clientRepo = dataSource.getRepository(Client);
  const appointmentRepo = dataSource.getRepository(Appointment);
  const scheduledRepo = dataSource.getRepository(ScheduledService);
  const commissionRepo = dataSource.getRepository(Commission);
  const expenseRepo = dataSource.getRepository(Expense);

  const tenant = await tenantRepo.findOne({ where: { id: tenantId } });
  if (!tenant) {
    throw new Error(`Tenant ${tenantId} não encontrado. Abortando.`);
  }
  console.log(`🌱 Seed leve para o tenant: ${tenant.name} (${tenantId})\n`);

  // --- Limpeza ESCOPADA (apenas este tenant), na ordem das FKs -------------
  await dataSource.transaction(async (m) => {
    const ids = (
      await m.query('SELECT id FROM services WHERE "tenantId"=$1', [tenantId])
    ).map((r: { id: string }) => r.id);
    if (ids.length > 0) {
      await m.query(
        'DELETE FROM collaborator_services WHERE "serviceId" = ANY($1)',
        [ids],
      );
    }
    // Tabelas de WhatsApp referenciam clients/tenant; limpa se existirem.
    const hasTable = async (name: string): Promise<boolean> => {
      const r = await m.query('SELECT to_regclass($1) AS t', [
        `public.${name}`,
      ]);
      return r[0].t !== null;
    };
    if (await hasTable('whatsapp_messages')) {
      await m.query('DELETE FROM whatsapp_messages WHERE "tenantId"=$1', [
        tenantId,
      ]);
    }
    if (await hasTable('whatsapp_conversations')) {
      await m.query('DELETE FROM whatsapp_conversations WHERE "tenantId"=$1', [
        tenantId,
      ]);
    }
    await m.query('DELETE FROM commissions WHERE "tenantId"=$1', [tenantId]);
    await m.query('DELETE FROM scheduled_services WHERE "tenantId"=$1', [
      tenantId,
    ]);
    await m.query('DELETE FROM appointments WHERE "tenantId"=$1', [tenantId]);
    await m.query(
      'DELETE FROM collaborator_services WHERE "collaboratorId" IN (SELECT id FROM collaborators WHERE "tenantId"=$1)',
      [tenantId],
    );
    await m.query('DELETE FROM collaborators WHERE "tenantId"=$1', [tenantId]);
    await m.query('DELETE FROM services WHERE "tenantId"=$1', [tenantId]);
    await m.query('DELETE FROM clients WHERE "tenantId"=$1', [tenantId]);
    await m.query('DELETE FROM expenses WHERE "tenantId"=$1', [tenantId]);
  });
  console.log('🧹 Dados antigos do tenant limpos (apenas deste tenant)\n');

  // --- Colaboradores --------------------------------------------------------
  const collaborators = await collaboratorRepo.save([
    {
      tenantId,
      name: 'Ana',
      phone: '(11) 98888-0001',
      area: 'Nail Designer',
      isActive: true,
    },
    {
      tenantId,
      name: 'Bruna',
      phone: '(11) 98888-0002',
      area: 'Hairdresser',
      isActive: true,
    },
    {
      tenantId,
      name: 'Carla',
      phone: '(11) 98888-0003',
      area: 'Esthetician',
      isActive: true,
    },
    {
      tenantId,
      name: 'Diana',
      phone: '(11) 98888-0004',
      area: 'Barber',
      isActive: true,
    },
  ]);
  console.log(`✅ ${collaborators.length} colaboradores`);

  // --- Serviços -------------------------------------------------------------
  const services = await serviceRepo.save([
    { tenantId, name: 'Manicure', defaultPrice: 35, commissionPercentage: 40 },
    { tenantId, name: 'Pedicure', defaultPrice: 40, commissionPercentage: 40 },
    {
      tenantId,
      name: 'Esmaltação em Gel',
      defaultPrice: 70,
      commissionPercentage: 40,
    },
    {
      tenantId,
      name: 'Corte Feminino',
      defaultPrice: 60,
      commissionPercentage: 40,
    },
    { tenantId, name: 'Escova', defaultPrice: 50, commissionPercentage: 40 },
    {
      tenantId,
      name: 'Sobrancelha Design',
      defaultPrice: 40,
      commissionPercentage: 50,
    },
    {
      tenantId,
      name: 'Limpeza de Pele',
      defaultPrice: 120,
      commissionPercentage: 50,
    },
    { tenantId, name: 'Barba', defaultPrice: 35, commissionPercentage: 40 },
  ]);
  console.log(`✅ ${services.length} serviços`);

  // Associa alguns serviços a cada colaborador (ManyToMany)
  collaborators[0].services = [services[0], services[1], services[2]];
  collaborators[1].services = [services[3], services[4]];
  collaborators[2].services = [services[5], services[6]];
  collaborators[3].services = [services[7], services[3]];
  await collaboratorRepo.save(collaborators);

  // --- Clientes -------------------------------------------------------------
  const clientNames = [
    'Juliana Prado',
    'Marina Lopes',
    'Patrícia Gomes',
    'Renata Dias',
    'Sofia Carvalho',
    'Tatiane Melo',
  ];
  const clients = await clientRepo.save(
    clientNames.map((name, i) => {
      const phone = `(11) 97777-00${String(i + 1).padStart(2, '0')}`;
      return {
        tenantId,
        name,
        phone,
        phoneNormalized: `55${normalizePhone(phone)}`,
      };
    }),
  );
  console.log(`✅ ${clients.length} clientes`);

  // --- Agendamentos ---------------------------------------------------------
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOffset = (d: number) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + d);
    return dt;
  };

  const makeAppointment = async (
    client: Client,
    collaborator: Collaborator,
    service: Service,
    date: Date,
    startTime: string,
    endTime: string,
    status: AppointmentStatus,
    withCommission: boolean,
  ) => {
    const appointment = await appointmentRepo.save({
      id: randomUUID(),
      tenantId,
      clientName: client.name,
      clientPhone: `55${normalizePhone(client.phone)}`,
      clientId: client.id,
      date,
      startTime,
      endTime,
      status,
    });
    const scheduled = await scheduledRepo.save({
      id: randomUUID(),
      tenantId,
      appointmentId: appointment.id,
      serviceId: service.id,
      collaboratorId: collaborator.id,
      price: Number(service.defaultPrice),
      status:
        status === AppointmentStatus.COMPLETED
          ? ScheduledServiceStatus.COMPLETED
          : ScheduledServiceStatus.PENDING,
    });
    if (withCommission) {
      const pct = Number(service.commissionPercentage);
      await commissionRepo.save({
        id: randomUUID(),
        tenantId,
        collaboratorId: collaborator.id,
        scheduledServiceId: scheduled.id,
        amount: (Number(service.defaultPrice) * pct) / 100,
        percentage: pct,
        paid: false,
      });
    }
    return appointment;
  };

  // 3 hoje (agendados)
  await makeAppointment(
    clients[0],
    collaborators[0],
    services[0],
    today,
    '09:00',
    '10:00',
    AppointmentStatus.SCHEDULED,
    false,
  );
  await makeAppointment(
    clients[1],
    collaborators[1],
    services[3],
    today,
    '10:00',
    '11:00',
    AppointmentStatus.SCHEDULED,
    false,
  );
  await makeAppointment(
    clients[2],
    collaborators[2],
    services[6],
    today,
    '14:00',
    '15:00',
    AppointmentStatus.SCHEDULED,
    false,
  );
  // 2 ontem (concluídos, com comissão)
  await makeAppointment(
    clients[3],
    collaborators[0],
    services[2],
    dayOffset(-1),
    '15:00',
    '16:00',
    AppointmentStatus.COMPLETED,
    true,
  );
  await makeAppointment(
    clients[4],
    collaborators[1],
    services[4],
    dayOffset(-1),
    '16:00',
    '17:00',
    AppointmentStatus.COMPLETED,
    true,
  );
  // 2 futuros (agendados)
  await makeAppointment(
    clients[5],
    collaborators[3],
    services[7],
    dayOffset(2),
    '11:00',
    '11:30',
    AppointmentStatus.SCHEDULED,
    false,
  );
  await makeAppointment(
    clients[0],
    collaborators[2],
    services[5],
    dayOffset(3),
    '13:00',
    '13:40',
    AppointmentStatus.SCHEDULED,
    false,
  );
  console.log('✅ 7 agendamentos (3 hoje, 2 concluídos ontem, 2 futuros)');

  // --- Despesas -------------------------------------------------------------
  await expenseRepo.save([
    {
      tenantId,
      description: 'Aluguel',
      category: ExpenseCategory.RENT,
      amount: 2500,
      type: ExpenseType.RECURRING,
      dayOfMonth: 5,
      isActive: true,
    },
    {
      tenantId,
      description: 'Compra de esmaltes',
      category: ExpenseCategory.SUPPLIES,
      amount: 180,
      type: ExpenseType.ONE_TIME,
      date: dayOffset(-2).toISOString().split('T')[0],
      isActive: true,
    },
  ]);
  console.log('✅ 2 despesas\n');

  console.log('🎉 Seed leve do tenant concluído com sucesso!');
  await dataSource.destroy();
}

seedTenant().catch((err) => {
  console.error('❌ Erro no seed do tenant:', err);
  process.exit(1);
});
