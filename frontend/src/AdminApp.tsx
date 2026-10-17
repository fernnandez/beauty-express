import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { OperationalThemeProvider } from "./components/OperationalThemeProvider";
import { Appointments } from "./pages/Appointments";
import { Clients } from "./pages/Clients";
import { Collaborators } from "./pages/Collaborators";
import { CollaboratorProfile } from "./pages/CollaboratorProfile";
import { Dashboard } from "./pages/Dashboard";
import { Expenses } from "./pages/Expenses";
import { FinancialReports } from "./pages/FinancialReports";
import { Services } from "./pages/Services";
import { Settings } from "./pages/Settings";

/** App operacional completo (perfil admin / gestão da filial). */
export function AdminApp() {
  return (
    <OperationalThemeProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/collaborators" element={<Collaborators />} />
          <Route path="/collaborators/:id" element={<CollaboratorProfile />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/services" element={<Services />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/financial-reports" element={<FinancialReports />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </OperationalThemeProvider>
  );
}
