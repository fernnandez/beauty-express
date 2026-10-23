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
import { Conversation } from '@domain/entities/conversation.entity';
import { Message } from '@domain/entities/message.entity';
import {
  ConversationStatus,
  MessageDirection,
  MessageStatus,
  MessageType,
} from '@domain/entities/whatsapp-enums';
import { Tenant } from '@domain/entities/tenant.entity';
import { normalizePhone } from '@common/utils/phone.util';

/**
 * Seed de DEMONSTRAÇÃO para o tenant Ageendoo (append, não destrutivo).
 *
 * Acrescenta uma operação robusta de OUTUBRO: agendamentos distribuídos no mês
 * (concluídos com comissão, hoje e futuros), despesas do mês e conversas de
 * WhatsApp fictícias (só no banco — NÃO envia nada real).
 *
 * Uso: SEED_TENANT_ID=<uuid> ts-node ... seed-ageendoo-demo.ts
 * Idempotência: pula a criação de conversas de WhatsApp cujo telefone já exista
 * (para poder rodar novamente sem duplicar o inbox). Agendamentos/despesas são
 * sempre acrescentados (demo), então evite rodar várias vezes seguidas.
 */

const YEAR = 2026;
const MONTH = 10; // outubro

function dateAt(day: number, hour: number, minute = 0): Date {
  return new Date(YEAR, MONTH - 1, day, hour, minute, 0, 0);
}
const pad = (n: number) => String(n).padStart(2, '0');
const hhmm = (h: number, m = 0) => `${pad(h)}:${pad(m)}`;
const pick = <T>(arr: T[], i: number): T => arr[i % arr.length];

async function run() {
  const tenantId = process.env.SEED_TENANT_ID || process.argv[2];
  if (!tenantId) {
    throw new Error('Informe o tenant: SEED_TENANT_ID=<uuid> ou arg[2].');
  }

  const ds = new DataSource({ ...getDatabaseConfig(), synchronize: false });
  await ds.initialize();

  const tenantRepo = ds.getRepository(Tenant);
  const collaboratorRepo = ds.getRepository(Collaborator);
  const serviceRepo = ds.getRepository(Service);
  const clientRepo = ds.getRepository(Client);
  const appointmentRepo = ds.getRepository(Appointment);
  const scheduledRepo = ds.getRepository(ScheduledService);
  const commissionRepo = ds.getRepository(Commission);
  const expenseRepo = ds.getRepository(Expense);
  const conversationRepo = ds.getRepository(Conversation);
  const messageRepo = ds.getRepository(Message);

  const tenant = await tenantRepo.findOne({ where: { id: tenantId } });
  if (!tenant) throw new Error(`Tenant ${tenantId} não encontrado.`);
  console.log(`🌱 Seed demo (append) → ${tenant.name} (${tenantId})\n`);

  // --- Reaproveita colaboradores e serviços existentes ----------------------
  const collaborators = await collaboratorRepo.find({ where: { tenantId } });
  const services = await serviceRepo.find({ where: { tenantId } });
  if (collaborators.length === 0 || services.length === 0) {
    throw new Error(
      'Tenant sem colaboradores/serviços. Rode o seed-tenant antes.',
    );
  }
  console.log(
    `ℹ️  Reaproveitando ${collaborators.length} colaboradores e ${services.length} serviços`,
  );

  // --- Clientes: garante um conjunto maior (append por telefone) ------------
  const demoClientes = [
    'Amanda Ribeiro',
    'Beatriz Nunes',
    'Camila Teixeira',
    'Daniela Rocha',
    'Eduarda Pinto',
    'Fernanda Alves',
    'Gabriela Souza',
    'Helena Martins',
    'Isabela Castro',
    'Larissa Moreira',
    'Mariana Figueiredo',
    'Natália Barbosa',
  ];
  const existingClients = await clientRepo.find({ where: { tenantId } });
  const byPhone = new Map(existingClients.map((c) => [c.phoneNormalized, c]));
  const clients: Client[] = [...existingClients];
  for (let i = 0; i < demoClientes.length; i++) {
    const phone = `(11) 96666-${pad(10 + i)}${pad(i)}`.slice(0, 15);
    const phoneNormalized = `55${normalizePhone(phone)}`;
    if (byPhone.has(phoneNormalized)) continue;
    const saved = await clientRepo.save({
      tenantId,
      name: demoClientes[i],
      phone,
      phoneNormalized,
    });
    clients.push(saved);
  }
  console.log(`✅ Clientes totais no tenant: ${clients.length}`);

  // --- Agendamentos distribuídos por outubro --------------------------------
  const today = new Date();
  const todayDay = today.getDate();

  let created = 0;
  let completed = 0;
  let scheduled = 0;

  // ~2 a 3 atendimentos por dia útil ao longo do mês
  for (let day = 1; day <= 28; day++) {
    const dow = dateAt(day, 0).getDay();
    if (dow === 0) continue; // sem domingo
    const perDay = (day % 3) + 2; // 2..4
    for (let k = 0; k < perDay; k++) {
      const client = pick(clients, day * 7 + k);
      const collaborator = pick(collaborators, day + k);
      const service = pick(services, day * 3 + k);
      const hour = 9 + ((day + k) % 9); // 9h..17h
      const date = dateAt(day, hour);
      const isPast = day < todayDay;
      const isToday = day === todayDay;
      const status = isPast
        ? AppointmentStatus.COMPLETED
        : AppointmentStatus.SCHEDULED;

      const appointment = await appointmentRepo.save({
        id: randomUUID(),
        tenantId,
        clientName: client.name,
        clientPhone: client.phoneNormalized,
        clientId: client.id,
        date,
        startTime: hhmm(hour),
        endTime: hhmm(hour + 1),
        status,
        observations: 'demo-outubro',
      });
      const sched = await scheduledRepo.save({
        id: randomUUID(),
        tenantId,
        appointmentId: appointment.id,
        serviceId: service.id,
        collaboratorId: collaborator.id,
        price: Number(service.defaultPrice),
        status: isPast
          ? ScheduledServiceStatus.COMPLETED
          : ScheduledServiceStatus.PENDING,
      });
      if (isPast) {
        const pct = Number(service.commissionPercentage);
        // mistura pagas e não pagas para o relatório ficar interessante
        const paid = day % 2 === 0;
        await commissionRepo.save({
          id: randomUUID(),
          tenantId,
          collaboratorId: collaborator.id,
          scheduledServiceId: sched.id,
          amount: (Number(service.defaultPrice) * pct) / 100,
          percentage: pct,
          paid,
        });
        completed++;
      } else {
        scheduled++;
      }
      created += 1;
      void isToday;
    }
  }
  console.log(
    `✅ ${created} agendamentos de outubro (${completed} concluídos c/ comissão, ${scheduled} agendados)`,
  );

  // --- Despesas do mês ------------------------------------------------------
  await expenseRepo.save([
    {
      tenantId,
      description: 'Aluguel do salão',
      category: ExpenseCategory.RENT,
      amount: 2800,
      type: ExpenseType.RECURRING,
      dayOfMonth: 5,
      isActive: true,
    },
    {
      tenantId,
      description: 'Energia e água',
      category: ExpenseCategory.UTILITIES,
      amount: 650,
      type: ExpenseType.RECURRING,
      dayOfMonth: 10,
      isActive: true,
    },
    {
      tenantId,
      description: 'Reposição de esmaltes e insumos',
      category: ExpenseCategory.SUPPLIES,
      amount: 920,
      type: ExpenseType.ONE_TIME,
      date: `${YEAR}-${pad(MONTH)}-08`,
      isActive: true,
    },
    {
      tenantId,
      description: 'Tráfego pago (Instagram)',
      category: ExpenseCategory.MARKETING,
      amount: 400,
      type: ExpenseType.ONE_TIME,
      date: `${YEAR}-${pad(MONTH)}-12`,
      isActive: true,
    },
  ]);
  console.log('✅ 4 despesas de outubro (2 fixas, 2 esporádicas)');

  // --- Conversas de WhatsApp fictícias (append por telefone) ----------------
  type FakeMsg = {
    dir: MessageDirection;
    text?: string;
    type?: MessageType;
    mediaUrl?: string;
    reaction?: string;
    status?: MessageStatus;
    minsAgo: number;
  };
  type FakeConv = {
    name: string;
    phone: string; // formato (11) 9xxxx-xxxx
    linkToClientIndex?: number; // vincula a um cliente existente
    unread: number;
    msgs: FakeMsg[];
  };

  const now = Date.now();
  const ts = (minsAgo: number) => new Date(now - minsAgo * 60_000);

  const convs: FakeConv[] = [
    {
      name: 'Amanda Ribeiro',
      phone: '(11) 96666-1000',
      linkToClientIndex: 0,
      unread: 0,
      msgs: [
        {
          dir: MessageDirection.INBOUND,
          text: 'Oi! Vocês têm horário pra manicure amanhã?',
          minsAgo: 180,
        },
        {
          dir: MessageDirection.OUTBOUND,
          text: 'Oi, Amanda! Temos sim 😊 às 10h ou 14h. Qual prefere?',
          status: MessageStatus.READ,
          minsAgo: 175,
        },
        {
          dir: MessageDirection.INBOUND,
          text: 'Pode ser 14h!',
          reaction: '❤️',
          minsAgo: 170,
        },
        {
          dir: MessageDirection.OUTBOUND,
          text: 'Agendado! Te espero amanhã às 14h 💅',
          status: MessageStatus.READ,
          minsAgo: 168,
        },
      ],
    },
    {
      name: 'Beatriz Nunes',
      phone: '(11) 96666-1011',
      linkToClientIndex: 1,
      unread: 2,
      msgs: [
        {
          dir: MessageDirection.INBOUND,
          text: 'Bom dia! Quanto fica esmaltação em gel + pé?',
          minsAgo: 95,
        },
        {
          dir: MessageDirection.INBOUND,
          text: 'E vocês atendem no sábado?',
          minsAgo: 92,
        },
      ],
    },
    {
      name: 'Carla (novo contato)',
      phone: '(11) 95555-2042',
      unread: 1,
      msgs: [
        {
          dir: MessageDirection.INBOUND,
          text: 'Oi, vi vocês no Instagram! Fazem limpeza de pele?',
          minsAgo: 40,
        },
      ],
    },
    {
      name: 'Daniela Rocha',
      phone: '(11) 96666-1033',
      linkToClientIndex: 3,
      unread: 0,
      msgs: [
        {
          dir: MessageDirection.OUTBOUND,
          text: 'Oi, Daniela! Passando pra confirmar seu horário de hoje às 16h. Podemos confirmar?',
          status: MessageStatus.DELIVERED,
          minsAgo: 300,
        },
        {
          dir: MessageDirection.INBOUND,
          text: 'Confirmado! Até mais tarde 🙌',
          minsAgo: 280,
        },
        {
          dir: MessageDirection.OUTBOUND,
          text: 'Perfeito, até já! 💖',
          status: MessageStatus.READ,
          minsAgo: 279,
        },
      ],
    },
    {
      name: 'Eduarda Pinto',
      phone: '(11) 96666-1044',
      linkToClientIndex: 4,
      unread: 0,
      msgs: [
        {
          dir: MessageDirection.INBOUND,
          text: 'Mandei foto da referência da unha 💅',
          type: MessageType.IMAGE,
          mediaUrl:
            'https://via.placeholder.com/400x400.png?text=Referencia+Unha',
          minsAgo: 1440,
        },
        {
          dir: MessageDirection.OUTBOUND,
          text: 'Amei! Consigo fazer sim 😍',
          status: MessageStatus.READ,
          minsAgo: 1435,
        },
      ],
    },
    {
      name: 'Fernanda Alves',
      phone: '(11) 96666-1055',
      linkToClientIndex: 5,
      unread: 1,
      msgs: [
        {
          dir: MessageDirection.OUTBOUND,
          text: 'Oi, Fernanda! Temos uma promoção de escova essa semana 💁‍♀️',
          status: MessageStatus.DELIVERED,
          minsAgo: 600,
        },
        {
          dir: MessageDirection.INBOUND,
          text: 'Que legal! Quais os horários disponíveis?',
          minsAgo: 30,
        },
      ],
    },
    {
      name: 'Gabriela (novo contato)',
      phone: '(11) 95555-2088',
      unread: 0,
      msgs: [
        {
          dir: MessageDirection.INBOUND,
          text: 'Vocês fazem sobrancelha?',
          minsAgo: 2880,
        },
        {
          dir: MessageDirection.OUTBOUND,
          text: 'Fazemos sim! Design de sobrancelha R$ 40. Quer agendar?',
          status: MessageStatus.READ,
          minsAgo: 2875,
        },
        {
          dir: MessageDirection.INBOUND,
          text: 'Depois te chamo, obrigada!',
          minsAgo: 2870,
        },
      ],
    },
  ];

  let convCreated = 0;
  let convSkipped = 0;
  for (const conv of convs) {
    const phoneNormalized = `55${normalizePhone(conv.phone)}`;
    const waChatId = `${phoneNormalized}@s.whatsapp.net`;
    const exists = await conversationRepo.findOne({
      where: { tenantId, waChatId },
    });
    if (exists) {
      convSkipped++;
      continue;
    }

    const last = conv.msgs[conv.msgs.length - 1];
    const lastTs = ts(last.minsAgo);
    const clientId =
      conv.linkToClientIndex !== undefined
        ? (clients[conv.linkToClientIndex]?.id ?? null)
        : null;

    const conversation = await conversationRepo.save({
      tenantId,
      waChatId,
      phoneNormalized,
      contactName: conv.name,
      clientId,
      status: ConversationStatus.OPEN,
      lastMessagePreview: (last.text ?? '[mídia]').slice(0, 120),
      lastMessageAt: lastTs,
      unreadCount: conv.unread,
    });

    for (const m of conv.msgs) {
      await messageRepo.save({
        tenantId,
        conversationId: conversation.id,
        waMessageId: `demo-${randomUUID()}`,
        direction: m.dir,
        type: m.type ?? MessageType.TEXT,
        content: m.text ?? null,
        mediaUrl: m.mediaUrl ?? null,
        reaction: m.reaction ?? null,
        status:
          m.dir === MessageDirection.OUTBOUND
            ? (m.status ?? MessageStatus.SENT)
            : MessageStatus.DELIVERED,
        timestamp: ts(m.minsAgo),
      });
    }
    convCreated++;
  }
  console.log(
    `✅ Conversas de WhatsApp: ${convCreated} criadas, ${convSkipped} já existiam (puladas)`,
  );

  console.log('\n🎉 Seed demo do Ageendoo concluído!');
  await ds.destroy();
}

run().catch((err) => {
  console.error('❌ Erro no seed demo:', err);
  process.exit(1);
});
