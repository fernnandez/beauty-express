import { CollaboratorService } from './CollaboratorService';
import { ServiceService } from './ServiceService';
import { AppointmentService } from './AppointmentService';
import { CommissionService } from './CommissionService';
import { FinancialReportService } from './FinancialReportService';
import { ScheduledServiceService } from './ScheduledServiceService';

let collaboratorService: CollaboratorService;
let serviceService: ServiceService;
let appointmentService: AppointmentService;
let commissionService: CommissionService;
let financialReportService: FinancialReportService;
let scheduledServiceService: ScheduledServiceService;

export function getServices() {
  if (!collaboratorService) {
    collaboratorService = new CollaboratorService();
    serviceService = new ServiceService();
    scheduledServiceService = new ScheduledServiceService();
    appointmentService = new AppointmentService();
    commissionService = new CommissionService();
    financialReportService = new FinancialReportService();
  }

  return {
    collaborators: collaboratorService,
    services: serviceService,
    appointments: appointmentService,
    commissions: commissionService,
    reports: financialReportService,
    scheduledServices: scheduledServiceService,
  };
}

