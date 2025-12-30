import type {
  Appointment,
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from '../types';

export const appointmentService = {
  findAll: async (date?: string): Promise<Appointment[]> => {
    return window.electronAPI.appointments.getAll(date);
  },

  findById: async (id: string): Promise<Appointment> => {
    return window.electronAPI.appointments.getById(id);
  },

  create: async (data: CreateAppointmentDto): Promise<Appointment> => {
    return window.electronAPI.appointments.create(data);
  },

  update: async (
    id: string,
    data: UpdateAppointmentDto,
  ): Promise<Appointment> => {
    return window.electronAPI.appointments.update(id, data);
  },

  complete: async (id: string): Promise<Appointment> => {
    return window.electronAPI.appointments.complete(id);
  },

  cancel: async (id: string): Promise<Appointment> => {
    return window.electronAPI.appointments.cancel(id);
  },

  getTotalPrice: async (id: string): Promise<number> => {
    return window.electronAPI.appointments.getTotalPrice(id);
  },
};

