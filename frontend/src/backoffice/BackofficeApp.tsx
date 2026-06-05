import { MantineProvider } from '@mantine/core';
import { Route, Routes } from 'react-router-dom';
import { AdminProtectedRoute } from '../components/AdminProtectedRoute';
import { AdminAuthProvider } from '../contexts/AdminAuthContext';
import { BackofficeLayout } from './components/BackofficeLayout';
import { AdminLogin } from './pages/AdminLogin';
import { BackofficeDashboard } from './pages/BackofficeDashboard';
import { BackofficeTenants } from './pages/BackofficeTenants';
import { BackofficeUsers } from './pages/BackofficeUsers';

const backofficeTheme = {
  primaryColor: 'indigo' as const,
  defaultRadius: 'md' as const,
  colorScheme: 'dark' as const,
};

export function BackofficeApp() {
  return (
    <MantineProvider theme={backofficeTheme} forceColorScheme="dark">
      <AdminAuthProvider>
        <Routes>
          <Route path="login" element={<AdminLogin />} />
          <Route
            element={
              <AdminProtectedRoute>
                <BackofficeLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<BackofficeDashboard />} />
            <Route path="tenants" element={<BackofficeTenants />} />
            <Route path="users" element={<BackofficeUsers />} />
          </Route>
        </Routes>
      </AdminAuthProvider>
    </MantineProvider>
  );
}
