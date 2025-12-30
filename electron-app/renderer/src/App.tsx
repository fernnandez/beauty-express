import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Collaborators } from './pages/Collaborators';
import { Services } from './pages/Services';
import { Appointments } from './pages/Appointments';
import { Commissions } from './pages/Commissions';
import { FinancialReports } from './pages/FinancialReports';

// Configura o locale do dayjs para português brasileiro
dayjs.locale('pt-br');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Componente para garantir que a aplicação sempre inicie no Dashboard
function AppRoutes() {
  const location = useLocation();
  const navigate = useNavigate();
  const hasNavigated = useRef(false);

  useEffect(() => {
    // Garante que na primeira renderização, se não estiver em uma rota válida, navega para "/"
    if (!hasNavigated.current && location.pathname !== '/' && 
        !['/collaborators', '/services', '/appointments', '/commissions', '/financial-reports'].includes(location.pathname)) {
      hasNavigated.current = true;
      navigate('/', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/collaborators" element={<Collaborators />} />
        <Route path="/services" element={<Services />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/commissions" element={<Commissions />} />
        <Route path="/financial-reports" element={<FinancialReports />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider
        theme={{
          primaryColor: 'pink',
          defaultRadius: 'md',
        }}
      >
        <DatesProvider 
          settings={{ 
            locale: 'pt-br',
            firstDayOfWeek: 0,
          }}
        >
          <Notifications />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </DatesProvider>
      </MantineProvider>
    </QueryClientProvider>
  );
}

export default App;
