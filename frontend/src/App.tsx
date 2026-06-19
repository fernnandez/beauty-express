import { DatesProvider } from "@mantine/dates";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import { Layout } from "./components/Layout";
import { LoginThemeProvider } from "./components/LoginThemeProvider";
import { OperationalThemeProvider } from "./components/OperationalThemeProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { LoginPortalProvider } from "./contexts/LoginPortalContext";
import { Appointments } from "./pages/Appointments";
import { Clients } from "./pages/Clients";
import { Collaborators } from "./pages/Collaborators";
import { Commissions } from "./pages/Commissions";
import { Dashboard } from "./pages/Dashboard";
import { FinancialReports } from "./pages/FinancialReports";
import { BackofficeApp } from "./backoffice/BackofficeApp";
import { Login } from "./pages/Login";
import { Services } from "./pages/Services";
import { createBrandingTheme } from "./utils/theme.util";

const rootTheme = createBrandingTheme();

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
      <MantineProvider theme={rootTheme}>
        <DatesProvider
          settings={{
            locale: "pt-br",
            firstDayOfWeek: 0,
          }}
        >
          <Notifications />
          <AuthProvider>
            <BrowserRouter>
              <Routes>
              <Route
                path="/login"
                element={
                  <LoginPortalProvider>
                    <LoginThemeProvider>
                      <Login />
                    </LoginThemeProvider>
                  </LoginPortalProvider>
                }
              />
              <Route path="/backoffice/*" element={<BackofficeApp />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <OperationalThemeProvider>
                      <Layout>
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route
                            path="/collaborators"
                            element={<Collaborators />}
                          />
                          <Route path="/clients" element={<Clients />} />
                          <Route path="/services" element={<Services />} />
                          <Route
                            path="/appointments"
                            element={<Appointments />}
                          />
                          <Route
                            path="/commissions"
                            element={<Commissions />}
                          />
                          <Route
                            path="/financial-reports"
                            element={<FinancialReports />}
                          />
                        </Routes>
                      </Layout>
                    </OperationalThemeProvider>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
        </DatesProvider>
      </MantineProvider>
    </QueryClientProvider>
  );
}

export default App;