import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';

// Configura o dayjs para usar o locale pt-BR
dayjs.locale('pt-br');
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Collaborators } from './pages/Collaborators';
import { Services } from './pages/Services';
import { Appointments } from './pages/Appointments';
import { Commissions } from './pages/Commissions';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

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
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/collaborators" element={<Collaborators />} />
                <Route path="/services" element={<Services />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/commissions" element={<Commissions />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </DatesProvider>
      </MantineProvider>
    </QueryClientProvider>
  );
}

export default App;
