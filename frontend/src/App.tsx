import { MantineProvider } from "@mantine/core";
import { DatesProvider } from "@mantine/dates";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import { Layout } from "./components/Layout";
import { Appointments } from "./pages/Appointments";
import { Collaborators } from "./pages/Collaborators";
import { Commissions } from "./pages/Commissions";
import { Dashboard } from "./pages/Dashboard";
import { FinancialReports } from "./pages/FinancialReports";
import { Services } from "./pages/Services";

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
          primaryColor: "pink",
          defaultRadius: "md",
        }}
      >
        <DatesProvider
          settings={{
            locale: "pt-br",
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
                <Route
                  path="/financial-reports"
                  element={<FinancialReports />}
                />
              </Routes>
            </Layout>
          </BrowserRouter>
        </DatesProvider>
      </MantineProvider>
    </QueryClientProvider>
  );
}

export default App;
