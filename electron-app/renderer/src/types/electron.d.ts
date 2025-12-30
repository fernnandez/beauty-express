import type {
  Collaborator,
  Service,
  Appointment,
  Commission,
  CreateCollaboratorDto,
  UpdateCollaboratorDto,
  CreateServiceDto,
  UpdateServiceDto,
  CreateAppointmentDto,
  UpdateAppointmentDto,
  FinancialReport,
} from './index';

declare global {
  interface Window {
    electronAPI: {
      isReady: () => Promise<boolean>;
      db: {
        isReady: () => Promise<boolean>;
      };
      collaborators: {
        getAll: (searchTerm?: string) => Promise<Collaborator[]>;
        getById: (id: string) => Promise<Collaborator>;
        create: (data: CreateCollaboratorDto) => Promise<Collaborator>;
        update: (id: string, data: UpdateCollaboratorDto) => Promise<Collaborator>;
        delete: (id: string) => Promise<void>;
      };
      services: {
        getAll: (searchTerm?: string) => Promise<Service[]>;
        getById: (id: string) => Promise<Service>;
        create: (data: CreateServiceDto) => Promise<Service>;
        update: (id: string, data: UpdateServiceDto) => Promise<Service>;
        delete: (id: string) => Promise<void>;
      };
      appointments: {
        getAll: (date?: string) => Promise<Appointment[]>;
        getById: (id: string) => Promise<Appointment>;
        getTotalPrice: (id: string) => Promise<number>;
        create: (data: CreateAppointmentDto) => Promise<Appointment>;
        update: (id: string, data: UpdateAppointmentDto) => Promise<Appointment>;
        complete: (id: string) => Promise<Appointment>;
        cancel: (id: string) => Promise<Appointment>;
      };
      commissions: {
        getAll: (filters?: {
          paid?: boolean;
          collaboratorId?: string;
          startDate?: string;
          endDate?: string;
        }) => Promise<Commission[]>;
        getById: (id: string) => Promise<Commission>;
        calculateForScheduledService: (scheduledServiceId: string) => Promise<Commission>;
        calculateForAppointment: (appointmentId: string) => Promise<Commission[]>;
        findByCollaborator: (collaboratorId: string) => Promise<Commission[]>;
        findPending: () => Promise<Commission[]>;
        markAsPaid: (ids: string[]) => Promise<Commission[]>;
        markAsUnpaid: (ids: string[]) => Promise<Commission[]>;
      };
      scheduledServices: {
        getAll: () => Promise<any[]>;
        getById: (id: string) => Promise<any>;
        findByAppointmentId: (appointmentId: string) => Promise<any[]>;
        update: (id: string, data: any) => Promise<any>;
        complete: (id: string) => Promise<any>;
        cancel: (id: string) => Promise<any>;
      };
      reports: {
        monthly: (year: number, month: number) => Promise<FinancialReport>;
      };
      onMenuAction: (callback: (action: string) => void) => void;
    };
  }
}

export {};

