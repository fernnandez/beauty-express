import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../services/admin.service';

export const useAdminDashboard = () => {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminService.getDashboardStats(),
  });
};
