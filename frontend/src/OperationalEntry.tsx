import { useAuth } from "./contexts/AuthContext";
import { AdminApp } from "./AdminApp";
import { CollaboratorApp } from "./collaborator/CollaboratorApp";

/**
 * Decide a experiência operacional conforme o papel do usuário autenticado:
 * - collaborator: visão mobile enxuta (agenda + comissões)
 * - admin (e demais papéis operacionais): app de gestão completo
 * super_admin já é redirecionado ao backoffice pelo ProtectedRoute.
 */
export function OperationalEntry() {
  const { user } = useAuth();

  if (user?.role === "collaborator") {
    return <CollaboratorApp />;
  }

  return <AdminApp />;
}
