// Enums
export enum AppointmentStatus {
  SCHEDULED = "agendado",
  COMPLETED = "concluido",
  CANCELLED = "cancelado",
}

export enum ScheduledServiceStatus {
  PENDING = "pendente",
  STARTED = "iniciado",
  COMPLETED = "concluido",
  CANCELLED = "cancelado",
}

// DTOs
export interface CreateCollaboratorDto {
  name: string;
  phone: string;
  area: string;
  commissionPercentage: number;
}

export interface UpdateCollaboratorDto {
  name?: string;
  phone?: string;
  area?: string;
  commissionPercentage?: number;
  isActive?: boolean;
}

export interface CreateServiceDto {
  name: string;
  defaultPrice: number;
  description?: string;
}

export interface UpdateServiceDto {
  name?: string;
  defaultPrice?: number;
  description?: string;
}

export interface ScheduledServiceInputDto {
  serviceId: string;
  collaboratorId?: string;
  price?: number;
}

export interface CreateAppointmentDto {
  clientName: string;
  clientPhone: string;
  date: string; // yyyy-MM-dd
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  servicos: ScheduledServiceInputDto[];
  observacoes?: string;
}

export interface UpdateAppointmentDto {
  clientName?: string;
  clientPhone?: string;
  date?: string; // yyyy-MM-dd
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
  services?: ScheduledServiceInputDto[];
  observations?: string;
}

export interface CreateScheduledServiceDto {
  appointmentId: string;
  serviceId: string;
  collaboratorId?: string;
  price?: number;
}

export interface UpdateScheduledServiceDto {
  serviceId?: string;
  collaboratorId?: string;
  price?: number;
}

// Entidades principais
export interface Service {
  id: string;
  name: string;
  defaultPrice: number;
  description?: string;
  collaborators?: Array<{
    id: string;
    name: string;
    phone: string;
    area: string;
    commissionPercentage: number;
    isActive: boolean;
  }>;
}

export interface Collaborator {
  id: string;
  name: string;
  phone: string;
  area: string;
  commissionPercentage: number;
  isActive: boolean;
  services?: Array<{
    id: string;
    name: string;
    defaultPrice: number;
    description?: string;
  }>;
}

export interface ScheduledService {
  id: string;
  appointmentId: string;
  appointment?: Appointment;
  price: number;
  serviceId: string;
  service?: Service;
  collaboratorId?: string;
  collaborator?: Collaborator;
  status: ScheduledServiceStatus;
}

export interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  date: string; // ISO string
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  status: AppointmentStatus;
  observacoes?: string;
  scheduledServices?: ScheduledService[];
}

export interface Commission {
  id: string;
  collaboratorId: string;
  collaborator?: Collaborator;
  scheduledServiceId: string;
  scheduledService?: ScheduledService;
  amount: number;
  percentage: number;
  paid: boolean;
}
