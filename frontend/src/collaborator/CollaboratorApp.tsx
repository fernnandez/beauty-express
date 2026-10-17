import { Routes, Route, Navigate } from "react-router-dom";
import { CollaboratorLayout } from "./CollaboratorLayout";
import { CollaboratorAgenda } from "../pages/collaborator/CollaboratorAgenda";
import { CollaboratorCommissions } from "../pages/collaborator/CollaboratorCommissions";

/**
 * Experiência do colaborador (mobile-first): agenda do dia (própria) e
 * comissões em modo somente-leitura. Sem acesso à gestão da filial.
 */
export function CollaboratorApp() {
  return (
    <CollaboratorLayout>
      <Routes>
        <Route path="/" element={<CollaboratorAgenda />} />
        <Route path="/commissions" element={<CollaboratorCommissions />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </CollaboratorLayout>
  );
}
