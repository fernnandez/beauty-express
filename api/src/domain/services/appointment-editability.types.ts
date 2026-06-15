export interface ScheduledServiceEditability {
  canEdit: boolean;
  commissionPaid: boolean;
}

export interface AppointmentEditability {
  canEditAppointment: boolean;
  services: Record<string, ScheduledServiceEditability>;
}
