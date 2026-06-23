export interface ScheduledServiceEditability {
  canEdit: boolean;
  commissionPaid: boolean;
}

export interface AppointmentEditability {
  canEditAppointment: boolean;
  canReopenAppointment: boolean;
  services: Record<string, ScheduledServiceEditability>;
}
