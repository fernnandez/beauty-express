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
}

export interface UpdateCollaboratorDto {
  name?: string;
  phone?: string;
  area?: string;
  isActive?: boolean;
}

export interface CreateClientDto {
  name: string;
  phone: string;
}

export interface UpdateClientDto {
  name?: string;
  phone?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
}

export interface CreateServiceDto {
  name: string;
  defaultPrice: number;
  commissionPercentage?: number;
  description?: string;
}

export interface UpdateServiceDto {
  name?: string;
  defaultPrice?: number;
  commissionPercentage?: number;
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
  clientId?: string;
  date: string; // yyyy-MM-dd
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  servicos: ScheduledServiceInputDto[];
  observations?: string;
}

export interface UpdateAppointmentDto {
  clientName?: string;
  clientPhone?: string;
  clientId?: string;
  date?: string; // yyyy-MM-dd
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
  observations?: string;
}

export interface CreateScheduledServiceDto {
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
  commissionPercentage: number;
  description?: string;
  collaborators?: Array<{
    id: string;
    name: string;
    phone: string;
    area: string;
    isActive: boolean;
  }>;
}

export interface Collaborator {
  id: string;
  name: string;
  phone: string;
  area: string;
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

export interface AppointmentEditability {
  canEditAppointment: boolean;
  canReopenAppointment: boolean;
  services: Record<
    string,
    {
      canEdit: boolean;
      commissionPaid: boolean;
    }
  >;
}

export interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  clientId?: string | null;
  date: string; // ISO string
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  status: AppointmentStatus;
  observations?: string;
  scheduledServices?: ScheduledService[];
  editability?: AppointmentEditability;
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

export interface CommissionListResponse {
  items: Commission[];
  total: number;
  page: number;
  limit: number;
  summary: {
    totalAmount: number;
    pendingAmount: number;
    paidAmount: number;
  };
}

export interface CommissionCollaboratorSummary {
  servicesCount: number;
  totalAmount: number;
  pendingAmount: number;
  paidAmount: number;
  uniqueClients: number;
}

export type CommissionAlertStatus = "overdue" | "pending" | "ok";

export interface CollaboratorCommissionAlert {
  collaboratorId: string;
  status: CommissionAlertStatus;
  overdueAmount: number;
  overdueCount: number;
  pendingAmount: number;
  pendingCount: number;
}

// Re-export tipos da API
export type { ApiError, ApiErrorResponse } from './api.types';

// ===== Despesas =====
export type ExpenseType = "one_time" | "recurring";

export type ExpenseCategory =
  | "aluguel"
  | "contas"
  | "salarios"
  | "insumos"
  | "impostos"
  | "marketing"
  | "outros";

export interface Expense {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  type: ExpenseType;
  date?: string | null;
  dayOfMonth?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
}

export interface CreateExpenseDto {
  description: string;
  category: ExpenseCategory;
  amount: number;
  type: ExpenseType;
  date?: string;
  dayOfMonth?: number;
  startDate?: string;
  endDate?: string;
}

export interface UpdateExpenseDto {
  description?: string;
  category?: ExpenseCategory;
  amount?: number;
  type?: ExpenseType;
  date?: string | null;
  dayOfMonth?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean;
}
