import {
  Appointment,
  AppointmentStatus,
} from '@domain/entities/appointment.entity';
import { Collaborator } from '@domain/entities/collaborator.entity';
import { Commission } from '@domain/entities/commission.entity';
import {
  ScheduledService,
  ScheduledServiceStatus,
} from '@domain/entities/scheduled-service.entity';
import { Service } from '@domain/entities/service.entity';
import { Tenant } from '@domain/entities/tenant.entity';
import { User } from '@domain/entities/user.entity';
import { UserRole } from '@domain/entities/user-role.enum';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { getDatabaseConfig } from '../config/database.config';

const TENANT_PAULISTA_ID = 'c1000001-0001-4000-8000-000000000001';
const TENANT_RECIFE_ID = 'c1000001-0001-4000-8000-000000000002';
const TENANT_BOAVIAGEM_ID = 'c1000001-0001-4000-8000-000000000003';
const DEMO_TENANT_ID = TENANT_PAULISTA_ID;

async function seed() {
  const dataSource = new DataSource({
    ...getDatabaseConfig(),
    synchronize: true,
  });
  await dataSource.initialize();

  console.log('🌱 Iniciando seed do banco de dados...\n');

  const tenantRepository = dataSource.getRepository(Tenant);
  const userRepository = dataSource.getRepository(User);
  const collaboratorRepository = dataSource.getRepository(Collaborator);
  const serviceRepository = dataSource.getRepository(Service);
  const appointmentRepository = dataSource.getRepository(Appointment);
  const scheduledServiceRepository = dataSource.getRepository(ScheduledService);
  const commissionRepository = dataSource.getRepository(Commission);

  // Limpa dados existentes (CASCADE para respeitar FKs no PostgreSQL)
  console.log('🧹 Limpando dados existentes...');
  await dataSource.query(
    'TRUNCATE TABLE refresh_tokens, users, tenants, commissions, scheduled_services, appointments, collaborator_services, collaborators, services RESTART IDENTITY CASCADE',
  );
  console.log('✅ Dados limpos\n');

  console.log('🏢 Criando filiais...');
  const tenants = await tenantRepository.save([
    {
      id: TENANT_PAULISTA_ID,
      slug: 'paulista',
      name: 'Maria Borboleta - Paulista',
      isActive: true,
    },
    {
      id: TENANT_RECIFE_ID,
      slug: 'recife',
      name: 'Maria Borboleta - Recife',
      isActive: true,
    },
    {
      id: TENANT_BOAVIAGEM_ID,
      slug: 'boaviagem',
      name: 'Maria Borboleta - Boa Viagem',
      isActive: true,
    },
  ]);
  console.log(`✅ ${tenants.length} filiais criadas\n`);

  console.log('🔐 Criando usuários...');
  const adminPassword = await bcrypt.hash('Senha123!', 10);
  const superAdminPassword = await bcrypt.hash('SenhaAdmin123!', 10);

  await userRepository.save([
    {
      id: 'd1000001-0001-4000-8000-000000000001',
      email: 'owner@beautyexpress.com',
      passwordHash: superAdminPassword,
      role: UserRole.SUPER_ADMIN,
      tenantId: null,
      isActive: true,
    },
    {
      id: 'd1000001-0001-4000-8000-000000000002',
      email: 'admin@paulista.mariaborboleta.com',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      tenantId: TENANT_PAULISTA_ID,
      isActive: true,
    },
    {
      id: 'd1000001-0001-4000-8000-000000000003',
      email: 'admin@recife.mariaborboleta.com',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      tenantId: TENANT_RECIFE_ID,
      isActive: true,
    },
    {
      id: 'd1000001-0001-4000-8000-000000000004',
      email: 'admin@boaviagem.mariaborboleta.com',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      tenantId: TENANT_BOAVIAGEM_ID,
      isActive: true,
    },
  ]);
  console.log('✅ Usuários criados\n');

  // Seed de Colaboradores
  console.log('👥 Criando colaboradores...');
  const collaborators = [
    {
      id: 'a0000001-0001-4000-8000-000000000001',
      name: 'Maria Silva',
      phone: '(11) 98765-4321',
      area: 'Hairdresser',
      commissionPercentage: 50.0,
      isActive: true,
    },
    {
      id: 'a0000001-0001-4000-8000-000000000002',
      name: 'Ana Paula Santos',
      phone: '(11) 98765-4322',
      area: 'Nail Designer',
      commissionPercentage: 45.0,
      isActive: true,
    },
    {
      id: 'a0000001-0001-4000-8000-000000000003',
      name: 'Juliana Costa',
      phone: '(11) 98765-4323',
      area: 'Hairdresser',
      commissionPercentage: 50.0,
      isActive: true,
    },
    {
      id: 'a0000001-0001-4000-8000-000000000004',
      name: 'Fernanda Oliveira',
      phone: '(11) 98765-4324',
      area: 'Esthetician',
      commissionPercentage: 40.0,
      isActive: true,
    },
    {
      id: 'a0000001-0001-4000-8000-000000000005',
      name: 'Patricia Lima',
      phone: '(11) 98765-4325',
      area: 'Makeup Artist',
      commissionPercentage: 50.0,
      isActive: false, // Inativa
    },
    {
      id: 'a0000001-0001-4000-8000-000000000006',
      name: 'Camila Rodrigues',
      phone: '(11) 98765-4326',
      area: 'Nail Designer',
      commissionPercentage: 55.0,
      isActive: true,
    },
    {
      id: 'a0000001-0001-4000-8000-000000000007',
      name: 'Larissa Alves',
      phone: '(11) 98765-4327',
      area: 'Massage Therapist',
      commissionPercentage: 48.0,
      isActive: true,
    },
  ];

  const savedCollaborators = await collaboratorRepository.save(
    collaborators.map((collaborator) => ({
      ...collaborator,
      tenantId: DEMO_TENANT_ID,
    })),
  );
  console.log(`✅ ${savedCollaborators.length} colaboradores criados\n`);

  // Seed de Serviços
  console.log('💇 Criando serviços...');
  const services = [
    {
      id: 'b0000001-0001-4000-8000-000000000001',
      name: 'Corte Feminino',
      defaultPrice: 45.0,
      description: 'Corte de cabelo feminino com lavagem e finalização',
    },
    {
      id: 'b0000001-0001-4000-8000-000000000002',
      name: 'Corte Masculino',
      defaultPrice: 30.0,
      description: 'Corte de cabelo masculino',
    },
    {
      id: 'b0000001-0001-4000-8000-000000000003',
      name: 'Coloração Completa',
      defaultPrice: 180.0,
      description: 'Coloração completa com produtos profissionais',
    },
    {
      id: 'b0000001-0001-4000-8000-000000000004',
      name: 'Mechas',
      defaultPrice: 250.0,
      description: 'Aplicação de mechas com técnicas modernas',
    },
    {
      id: 'b0000001-0001-4000-8000-000000000005',
      name: 'Escova Progressiva',
      defaultPrice: 350.0,
      description: 'Alisamento com escova progressiva',
    },
    {
      id: 'b0000001-0001-4000-8000-000000000006',
      name: 'Manicure',
      defaultPrice: 25.0,
      description: 'Manicure completa com esmaltação',
    },
    {
      id: 'b0000001-0001-4000-8000-000000000007',
      name: 'Pedicure',
      defaultPrice: 35.0,
      description: 'Pedicure completa com esmaltação',
    },
    {
      id: 'b0000001-0001-4000-8000-000000000008',
      name: 'Manicure + Pedicure',
      defaultPrice: 55.0,
      description: 'Pacote completo de unhas',
    },
    {
      id: 'b0000001-0001-4000-8000-000000000009',
      name: 'Sobrancelha',
      defaultPrice: 20.0,
      description: 'Design de sobrancelhas',
    },
    {
      id: 'b0000001-0001-4000-8000-000000000010',
      name: 'Penteado',
      defaultPrice: 80.0,
      description: 'Penteado para eventos',
    },
    {
      id: 'b0000001-0001-4000-8000-000000000011',
      name: 'Tratamento Capilar',
      defaultPrice: 120.0,
      description: 'Tratamento para cabelos danificados',
    },
    {
      id: 'b0000001-0001-4000-8000-000000000012',
      name: 'Corte + Escova',
      defaultPrice: 65.0,
      description: 'Pacote corte com escova',
    },
    {
      id: 'b0000001-0001-4000-8000-000000000013',
      name: 'Hidratação',
      defaultPrice: 90.0,
      description: 'Hidratação profunda',
    },
    {
      id: 'b0000001-0001-4000-8000-000000000014',
      name: 'Botox Capilar',
      defaultPrice: 200.0,
      description: 'Tratamento botox capilar',
    },
    {
      id: 'b0000001-0001-4000-8000-000000000015',
      name: 'Depilação Facial',
      defaultPrice: 40.0,
      description: 'Depilação com cera',
    },
  ];

  const savedServices = await serviceRepository.save(
    services.map((service) => ({
      ...service,
      tenantId: DEMO_TENANT_ID,
    })),
  );
  console.log(`✅ ${savedServices.length} serviços criados\n`);

  // Associa colaboradores aos serviços
  console.log('🔗 Associando colaboradores aos serviços...');
  const maria = savedCollaborators.find((c) => c.id === 'a0000001-0001-4000-8000-000000000001');
  const ana = savedCollaborators.find((c) => c.id === 'a0000001-0001-4000-8000-000000000002');
  const juliana = savedCollaborators.find((c) => c.id === 'a0000001-0001-4000-8000-000000000003');
  const fernanda = savedCollaborators.find((c) => c.id === 'a0000001-0001-4000-8000-000000000004');
  const camila = savedCollaborators.find((c) => c.id === 'a0000001-0001-4000-8000-000000000006');
  const larissa = savedCollaborators.find((c) => c.id === 'a0000001-0001-4000-8000-000000000007');

  const corteFeminino = savedServices.find((s) => s.id === 'b0000001-0001-4000-8000-000000000001');
  const corteMasculino = savedServices.find((s) => s.id === 'b0000001-0001-4000-8000-000000000002');
  const coloracao = savedServices.find((s) => s.id === 'b0000001-0001-4000-8000-000000000003');
  const mechas = savedServices.find((s) => s.id === 'b0000001-0001-4000-8000-000000000004');
  const manicure = savedServices.find((s) => s.id === 'b0000001-0001-4000-8000-000000000006');
  const pedicure = savedServices.find((s) => s.id === 'b0000001-0001-4000-8000-000000000007');
  const manicurePedicure = savedServices.find((s) => s.id === 'b0000001-0001-4000-8000-000000000008');
  const sobrancelha = savedServices.find((s) => s.id === 'b0000001-0001-4000-8000-000000000009');
  const penteado = savedServices.find((s) => s.id === 'b0000001-0001-4000-8000-000000000010');
  const tratamento = savedServices.find((s) => s.id === 'b0000001-0001-4000-8000-000000000011');
  const hidratacao = savedServices.find((s) => s.id === 'b0000001-0001-4000-8000-000000000013');
  const botox = savedServices.find((s) => s.id === 'b0000001-0001-4000-8000-000000000014');
  const depilacao = savedServices.find((s) => s.id === 'b0000001-0001-4000-8000-000000000015');

  if (maria) {
    maria.services = [
      corteFeminino,
      coloracao,
      mechas,
      penteado,
      tratamento,
      hidratacao,
      botox,
    ].filter(Boolean) as Service[];
    await collaboratorRepository.save(maria);
  }

  if (ana) {
    ana.services = [
      corteFeminino,
      corteMasculino,
      mechas,
      tratamento,
      hidratacao,
    ].filter(Boolean) as Service[];
    await collaboratorRepository.save(ana);
  }

  if (juliana) {
    juliana.services = [
      manicure,
      pedicure,
      manicurePedicure,
      sobrancelha,
      depilacao,
    ].filter(Boolean) as Service[];
    await collaboratorRepository.save(juliana);
  }

  if (fernanda) {
    fernanda.services = [
      manicure,
      pedicure,
      manicurePedicure,
      sobrancelha,
    ].filter(Boolean) as Service[];
    await collaboratorRepository.save(fernanda);
  }

  if (camila) {
    camila.services = [corteFeminino, coloracao, mechas, penteado].filter(
      Boolean,
    ) as Service[];
    await collaboratorRepository.save(camila);
  }

  if (larissa) {
    larissa.services = [manicure, pedicure, sobrancelha, depilacao].filter(
      Boolean,
    ) as Service[];
    await collaboratorRepository.save(larissa);
  }
  console.log('✅ Associações criadas\n');

  // Seed de Agendamentos
  console.log('📅 Criando agendamentos...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const generateId = () => randomUUID();

  // Função auxiliar para criar comissão manualmente (para seed)
  const createCommission = async (
    scheduledService: ScheduledService,
    collaborator: Collaborator,
    paid: boolean = false,
  ) => {
    const existing = await commissionRepository.findOne({
      where: { scheduledServiceId: scheduledService.id },
    });
    if (existing) {
      existing.paid = paid;
      return await commissionRepository.save(existing);
    }

    const commission = new Commission();
    commission.id = generateId();
    commission.tenantId = DEMO_TENANT_ID;
    commission.collaboratorId = collaborator.id;
    commission.scheduledServiceId = scheduledService.id;
    commission.amount =
      (Number(scheduledService.price) * collaborator.commissionPercentage) /
      100;
    commission.percentage = collaborator.commissionPercentage;
    commission.paid = paid;
    return await commissionRepository.save(commission);
  };

  // Função auxiliar para criar agendamento com serviços
  const createAppointmentWithServices = async (
    appointmentData: {
      clientName: string;
      clientPhone: string;
      date: Date;
      startTime: string; // HH:MM
      endTime: string; // HH:MM
      status: AppointmentStatus;
      observacoes?: string;
    },
    services: Array<{
      serviceId: string;
      collaboratorId?: string;
      status?: ScheduledServiceStatus;
      paid?: boolean; // Se a comissão deve ser marcada como paga
    }>,
  ) => {
    const appointment = new Appointment();
    appointment.id = generateId();
    appointment.tenantId = DEMO_TENANT_ID;
    appointment.clientName = appointmentData.clientName;
    appointment.clientPhone = appointmentData.clientPhone;
    appointment.date = appointmentData.date;
    appointment.startTime = appointmentData.startTime;
    appointment.endTime = appointmentData.endTime;
    appointment.status = appointmentData.status;
    appointment.observations = appointmentData.observacoes;

    const savedAppointment = await appointmentRepository.save(appointment);

    // Criar scheduled services
    for (const servico of services) {
      const service = savedServices.find((s) => s.id === servico.serviceId);
      if (!service) continue;

      const scheduledService = new ScheduledService();
      scheduledService.id = generateId();
      scheduledService.tenantId = DEMO_TENANT_ID;
      scheduledService.appointmentId = savedAppointment.id;
      scheduledService.serviceId = servico.serviceId;
      scheduledService.collaboratorId = servico.collaboratorId;
      scheduledService.price = service.defaultPrice;
      scheduledService.status =
        servico.status ?? ScheduledServiceStatus.PENDING;

      const savedScheduledService =
        await scheduledServiceRepository.save(scheduledService);

      // Criar comissão se houver colaborador e serviço concluído
      if (
        servico.collaboratorId &&
        servico.status === ScheduledServiceStatus.COMPLETED
      ) {
        const collaborator = savedCollaborators.find(
          (c) => c.id === servico.collaboratorId,
        );
        if (collaborator) {
          await createCommission(
            savedScheduledService,
            collaborator,
            servico.paid ?? false,
          );
        }
      }
    }

    return savedAppointment;
  };

  // ========== AGENDAMENTOS DE HOJE ==========
  console.log('📅 Criando agendamentos de hoje...');
  const todayDate = new Date(today);

  // Agendamentos agendados para hoje
  await createAppointmentWithServices(
    {
      clientName: 'Carla Mendes',
      clientPhone: '(11) 99999-1111',
      date: todayDate,
      startTime: '09:00',
      endTime: '10:00',
      status: AppointmentStatus.SCHEDULED,
    },
    [
      {
        serviceId: 'b0000001-0001-4000-8000-000000000001',
        collaboratorId: 'a0000001-0001-4000-8000-000000000001',
      },
    ],
  );

  await createAppointmentWithServices(
    {
      clientName: 'Roberta Alves',
      clientPhone: '(11) 99999-2222',
      date: todayDate,
      startTime: '10:00',
      endTime: '11:00',
      status: AppointmentStatus.SCHEDULED,
    },
    [
      {
        serviceId: 'b0000001-0001-4000-8000-000000000006',
        collaboratorId: 'a0000001-0001-4000-8000-000000000003',
      },
    ],
  );

  await createAppointmentWithServices(
    {
      clientName: 'Luciana Ferreira',
      clientPhone: '(11) 99999-3333',
      date: todayDate,
      startTime: '10:00',
      endTime: '12:00',
      status: AppointmentStatus.SCHEDULED,
    },
    [
      {
        serviceId: 'b0000001-0001-4000-8000-000000000003',
        collaboratorId: 'a0000001-0001-4000-8000-000000000002',
        status: ScheduledServiceStatus.PENDING,
      },
    ],
  );

  await createAppointmentWithServices(
    {
      clientName: 'João Silva',
      clientPhone: '(11) 99999-4444',
      date: todayDate,
      startTime: '14:00',
      endTime: '15:00',
      status: AppointmentStatus.SCHEDULED,
    },
    [
      {
        serviceId: 'b0000001-0001-4000-8000-000000000002',
        collaboratorId: 'a0000001-0001-4000-8000-000000000002',
      },
    ],
  );

  await createAppointmentWithServices(
    {
      clientName: 'Amanda Souza',
      clientPhone: '(11) 99999-5555',
      date: todayDate,
      startTime: '15:00',
      endTime: '16:00',
      status: AppointmentStatus.SCHEDULED,
    },
    [
      {
        serviceId: 'b0000001-0001-4000-8000-000000000007',
        collaboratorId: 'a0000001-0001-4000-8000-000000000004',
      },
    ],
  );

  // Agendamento com múltiplos serviços
  await createAppointmentWithServices(
    {
      clientName: 'Maria Santos',
      clientPhone: '(11) 99999-7777',
      date: todayDate,
      startTime: '13:00',
      endTime: '14:30',
      status: AppointmentStatus.SCHEDULED,
    },
    [
      {
        serviceId: 'b0000001-0001-4000-8000-000000000006',
        collaboratorId: 'a0000001-0001-4000-8000-000000000003',
      },
      {
        serviceId: 'b0000001-0001-4000-8000-000000000007',
        collaboratorId: 'a0000001-0001-4000-8000-000000000004',
      },
    ],
  );

  // ========== AGENDAMENTOS DE ONTEM (CONCLUÍDOS) ==========
  console.log('📅 Criando agendamentos de ontem (concluídos)...');
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Comissões PAGAS
  await createAppointmentWithServices(
    {
      clientName: 'Fernanda Costa',
      clientPhone: '(11) 99999-8888',
      date: yesterday,
      startTime: '09:00',
      endTime: '10:00',
      status: AppointmentStatus.COMPLETED,
    },
    [
      {
        serviceId: 'b0000001-0001-4000-8000-000000000001',
        collaboratorId: 'a0000001-0001-4000-8000-000000000001',
        status: ScheduledServiceStatus.COMPLETED,
        paid: true, // PAGA
      },
    ],
  );

  await createAppointmentWithServices(
    {
      clientName: 'Mariana Rocha',
      clientPhone: '(11) 99999-9999',
      date: yesterday,
      startTime: '10:00',
      endTime: '11:30',
      status: AppointmentStatus.COMPLETED,
    },
    [
      {
        serviceId: 'b0000001-0001-4000-8000-000000000004',
        collaboratorId: 'a0000001-0001-4000-8000-000000000001',
        status: ScheduledServiceStatus.COMPLETED,
        paid: true, // PAGA
      },
    ],
  );

  await createAppointmentWithServices(
    {
      clientName: 'Patricia Santos',
      clientPhone: '(11) 99999-0000',
      date: yesterday,
      startTime: '14:00',
      endTime: '15:00',
      status: AppointmentStatus.COMPLETED,
    },
    [
      {
        serviceId: 'b0000001-0001-4000-8000-000000000008',
        collaboratorId: 'a0000001-0001-4000-8000-000000000003',
        status: ScheduledServiceStatus.COMPLETED,
        paid: true, // PAGA
      },
    ],
  );

  // Comissões PENDENTES
  await createAppointmentWithServices(
    {
      clientName: 'Sandra Lima',
      clientPhone: '(11) 98888-1111',
      date: yesterday,
      startTime: '15:00',
      endTime: '16:00',
      status: AppointmentStatus.COMPLETED,
    },
    [
      {
        serviceId: 'b0000001-0001-4000-8000-000000000003',
        collaboratorId: 'a0000001-0001-4000-8000-000000000002',
        status: ScheduledServiceStatus.COMPLETED,
        paid: false, // PENDENTE
      },
    ],
  );

  await createAppointmentWithServices(
    {
      clientName: 'Bruna Oliveira',
      clientPhone: '(11) 98888-2222',
      date: yesterday,
      startTime: '16:00',
      endTime: '17:00',
      status: AppointmentStatus.COMPLETED,
    },
    [
      {
        serviceId: 'b0000001-0001-4000-8000-000000000011',
        collaboratorId: 'a0000001-0001-4000-8000-000000000001',
        status: ScheduledServiceStatus.COMPLETED,
        paid: false, // PENDENTE
      },
    ],
  );

  // Agendamento com múltiplos serviços concluídos
  await createAppointmentWithServices(
    {
      clientName: 'Juliana Martins',
      clientPhone: '(11) 98888-3333',
      date: yesterday,
      startTime: '11:00',
      endTime: '13:00',
      status: AppointmentStatus.COMPLETED,
    },
    [
      {
        serviceId: 'b0000001-0001-4000-8000-000000000001',
        collaboratorId: 'a0000001-0001-4000-8000-000000000001',
        status: ScheduledServiceStatus.COMPLETED,
        paid: true, // PAGA
      },
      {
        serviceId: 'b0000001-0001-4000-8000-000000000009',
        collaboratorId: 'a0000001-0001-4000-8000-000000000003',
        status: ScheduledServiceStatus.COMPLETED,
        paid: false, // PENDENTE
      },
    ],
  );

  // Agendamento cancelado
  await createAppointmentWithServices(
    {
      clientName: 'Ricardo Oliveira',
      clientPhone: '(11) 98888-4444',
      date: yesterday,
      startTime: '17:00',
      endTime: '18:00',
      status: AppointmentStatus.CANCELLED,
    },
    [
      {
        serviceId: 'b0000001-0001-4000-8000-000000000002',
        collaboratorId: 'a0000001-0001-4000-8000-000000000002',
        status: ScheduledServiceStatus.CANCELLED,
      },
    ],
  );

  // ========== AGENDAMENTOS DA ÚLTIMA SEMANA ==========
  console.log('📅 Criando agendamentos da última semana...');
  for (let i = 2; i <= 7; i++) {
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - i);

    const clients = [
      {
        name: 'Ana Beatriz',
        phone: `(11) 97777-${String(i).padStart(2, '0')}01`,
      },
      {
        name: 'Cristina Silva',
        phone: `(11) 97777-${String(i).padStart(2, '0')}02`,
      },
      {
        name: 'Daniela Costa',
        phone: `(11) 97777-${String(i).padStart(2, '0')}03`,
      },
      {
        name: 'Eliane Santos',
        phone: `(11) 97777-${String(i).padStart(2, '0')}04`,
      },
    ];

    const servicesConfig = [
      {
        serviceId: 'b0000001-0001-4000-8000-000000000001',
        collaboratorId: 'a0000001-0001-4000-8000-000000000001',
        status: ScheduledServiceStatus.COMPLETED,
        paid: i % 2 === 0, // Alterna entre pago e pendente
      },
      {
        serviceId: 'b0000001-0001-4000-8000-000000000006',
        collaboratorId: 'a0000001-0001-4000-8000-000000000003',
        status: ScheduledServiceStatus.COMPLETED,
        paid: i % 3 === 0, // Alguns pagos
      },
      {
        serviceId: 'b0000001-0001-4000-8000-000000000003',
        collaboratorId: 'a0000001-0001-4000-8000-000000000002',
        status: ScheduledServiceStatus.COMPLETED,
        paid: false, // Pendente
      },
      {
        serviceId: 'b0000001-0001-4000-8000-000000000007',
        collaboratorId: 'a0000001-0001-4000-8000-000000000004',
        status: ScheduledServiceStatus.COMPLETED,
        paid: i % 4 === 0, // Poucos pagos
      },
    ];

    for (let j = 0; j < clients.length && j < servicesConfig.length; j++) {
      const client = clients[j];
      const serviceConfig = servicesConfig[j];
      const timeSlots = [
        { start: '09:00', end: '10:00' },
        { start: '10:00', end: '11:00' },
        { start: '14:00', end: '15:00' },
        { start: '15:00', end: '16:00' },
      ];

      await createAppointmentWithServices(
        {
          clientName: client.name,
          clientPhone: client.phone,
          date: pastDate,
          startTime: timeSlots[j].start,
          endTime: timeSlots[j].end,
          status: AppointmentStatus.COMPLETED,
        },
        [serviceConfig],
      );
    }
  }

  // ========== AGENDAMENTOS DE AMANHÃ ==========
  console.log('📅 Criando agendamentos de amanhã...');
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  await createAppointmentWithServices(
    {
      clientName: 'Vanessa Martins',
      clientPhone: '(11) 98888-5555',
      date: tomorrow,
      startTime: '09:00',
      endTime: '11:00',
      status: AppointmentStatus.SCHEDULED,
    },
    [
      {
        serviceId: 'b0000001-0001-4000-8000-000000000005',
        collaboratorId: 'a0000001-0001-4000-8000-000000000001',
      },
    ],
  );

  await createAppointmentWithServices(
    {
      clientName: 'Camila Ribeiro',
      clientPhone: '(11) 98888-6666',
      date: tomorrow,
      startTime: '10:00',
      endTime: '11:00',
      status: AppointmentStatus.SCHEDULED,
    },
    [
      {
        serviceId: 'b0000001-0001-4000-8000-000000000006',
        collaboratorId: 'a0000001-0001-4000-8000-000000000003',
      },
    ],
  );

  await createAppointmentWithServices(
    {
      clientName: 'Gabriela Nunes',
      clientPhone: '(11) 98888-7777',
      date: tomorrow,
      startTime: '14:00',
      endTime: '15:00',
      status: AppointmentStatus.SCHEDULED,
    },
    [
      {
        serviceId: 'b0000001-0001-4000-8000-000000000001',
        collaboratorId: 'a0000001-0001-4000-8000-000000000002',
      },
    ],
  );

  await createAppointmentWithServices(
    {
      clientName: 'Isabela Torres',
      clientPhone: '(11) 98888-8888',
      date: tomorrow,
      startTime: '15:00',
      endTime: '17:00',
      status: AppointmentStatus.SCHEDULED,
    },
    [
      {
        serviceId: 'b0000001-0001-4000-8000-000000000011',
        collaboratorId: 'a0000001-0001-4000-8000-000000000001',
      },
    ],
  );

  // Agendamento com múltiplos serviços
  await createAppointmentWithServices(
    {
      clientName: 'Leticia Almeida',
      clientPhone: '(11) 98888-9999',
      date: tomorrow,
      startTime: '13:00',
      endTime: '15:00',
      status: AppointmentStatus.SCHEDULED,
    },
    [
      {
        serviceId: 'b0000001-0001-4000-8000-000000000001',
        collaboratorId: 'a0000001-0001-4000-8000-000000000006',
      },
      {
        serviceId: 'b0000001-0001-4000-8000-000000000009',
        collaboratorId: 'a0000001-0001-4000-8000-000000000003',
      },
      {
        serviceId: 'b0000001-0001-4000-8000-000000000006',
        collaboratorId: 'a0000001-0001-4000-8000-000000000007',
      },
    ],
  );

  // ========== AGENDAMENTOS DA PRÓXIMA SEMANA ==========
  console.log('📅 Criando agendamentos da próxima semana...');
  for (let i = 2; i <= 7; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + i);

    const times = [
      { start: '09:00', end: '10:00' },
      { start: '10:00', end: '11:00' },
      { start: '14:00', end: '15:00' },
      { start: '15:00', end: '16:00' },
      { start: '16:00', end: '17:00' },
    ];

    const serviceIds = [
      'b0000001-0001-4000-8000-000000000001',
      'b0000001-0001-4000-8000-000000000002',
      'b0000001-0001-4000-8000-000000000006',
      'b0000001-0001-4000-8000-000000000007',
      'b0000001-0001-4000-8000-000000000009',
    ];
    const collaboratorIds = [
      'a0000001-0001-4000-8000-000000000001',
      'a0000001-0001-4000-8000-000000000002',
      'a0000001-0001-4000-8000-000000000003',
      'a0000001-0001-4000-8000-000000000004',
      'a0000001-0001-4000-8000-000000000006',
      'a0000001-0001-4000-8000-000000000007',
    ];

    for (let index = 0; index < times.length; index++) {
      const time = times[index];
      const serviceId = serviceIds[index % serviceIds.length];
      const collaboratorId =
        index % 2 === 0
          ? collaboratorIds[index % collaboratorIds.length]
          : undefined;

      await createAppointmentWithServices(
        {
          clientName: `Cliente ${i}-${index + 1}`,
          clientPhone: `(11) 96666-${String(i).padStart(2, '0')}${String(index).padStart(2, '0')}`,
          date: futureDate,
          startTime: time.start,
          endTime: time.end,
          status: AppointmentStatus.SCHEDULED,
        },
        [
          {
            serviceId: serviceId,
            collaboratorId: collaboratorId,
          },
        ],
      );
    }
  }

  // ========== AGENDAMENTOS DO MÊS PASSADO (PARA HISTÓRICO) ==========
  console.log('📅 Criando agendamentos do mês passado...');
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getDate() - 30);

  for (let i = 0; i < 10; i++) {
    const pastDate = new Date(lastMonth);
    pastDate.setDate(lastMonth.getDate() + i * 3);

    const servicesConfig = [
      {
        serviceId: 'b0000001-0001-4000-8000-000000000001',
        collaboratorId: 'a0000001-0001-4000-8000-000000000001',
        status: ScheduledServiceStatus.COMPLETED,
        paid: true,
      },
      {
        serviceId: 'b0000001-0001-4000-8000-000000000004',
        collaboratorId: 'a0000001-0001-4000-8000-000000000001',
        status: ScheduledServiceStatus.COMPLETED,
        paid: true,
      },
      {
        serviceId: 'b0000001-0001-4000-8000-000000000006',
        collaboratorId: 'a0000001-0001-4000-8000-000000000003',
        status: ScheduledServiceStatus.COMPLETED,
        paid: true,
      },
      {
        serviceId: 'b0000001-0001-4000-8000-000000000003',
        collaboratorId: 'a0000001-0001-4000-8000-000000000002',
        status: ScheduledServiceStatus.COMPLETED,
        paid: i % 2 === 0,
      },
    ];

    const config = servicesConfig[i % servicesConfig.length];
    const timeSlots = [
      { start: '09:00', end: '10:00' },
      { start: '10:00', end: '11:00' },
      { start: '14:00', end: '15:00' },
      { start: '15:00', end: '16:00' },
    ];

    await createAppointmentWithServices(
      {
        clientName: `Cliente Histórico ${i + 1}`,
        clientPhone: `(11) 95555-${String(i).padStart(4, '0')}`,
        date: pastDate,
        startTime: timeSlots[i % timeSlots.length].start,
        endTime: timeSlots[i % timeSlots.length].end,
        status: AppointmentStatus.COMPLETED,
      },
      [config],
    );
  }

  console.log('✅ Agendamentos criados\n');

  // Estatísticas finais
  const totalCommissions = await commissionRepository.count();
  const paidCommissions = await commissionRepository.count({
    where: { paid: true },
  });
  const pendingCommissions = await commissionRepository.count({
    where: { paid: false },
  });

  console.log('📊 Estatísticas:');
  console.log(`   Total de comissões: ${totalCommissions}`);
  console.log(`   Comissões pagas: ${paidCommissions}`);
  console.log(`   Comissões pendentes: ${pendingCommissions}\n`);

  console.log('🔑 Credenciais de acesso:');
  console.log('   Backoffice: owner@beautyexpress.com / SenhaAdmin123!');
  console.log('   Paulista:   admin@paulista.mariaborboleta.com / Senha123! (slug: paulista)');
  console.log('   Recife:     admin@recife.mariaborboleta.com / Senha123! (slug: recife)');
  console.log('   Boa Viagem: admin@boaviagem.mariaborboleta.com / Senha123! (slug: boaviagem)\n');

  await dataSource.destroy();
  console.log('🎉 Seed concluído com sucesso!');
}

seed().catch((error) => {
  console.error('❌ Erro ao executar seed:', error);
  process.exit(1);
});
