import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../services/admin.service';

export const useAdminAuditLogs = (limit = 50) => {
  return useQuery({
    queryKey: ['admin', 'audit-logs', limit],
    queryFn: () => adminService.listAuditLogs(limit),
  });
};
