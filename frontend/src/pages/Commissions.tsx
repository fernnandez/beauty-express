import { Group, Title } from "@mantine/core";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CommissionsPanel } from "../components/commission/CommissionsPanel";
import { useOperationalBranding } from "../hooks/useOperationalBranding";

export function Commissions() {
  const navigate = useNavigate();
  const { commissionsEnabled } = useOperationalBranding();

  useEffect(() => {
    if (!commissionsEnabled) {
      navigate("/", { replace: true });
    }
  }, [commissionsEnabled, navigate]);

  if (!commissionsEnabled) {
    return null;
  }

  return (
    <CommissionsPanel
      headerTop={
        <Group gap="md">
          <Title order={1} c="brand">
            Comissões
          </Title>
        </Group>
      }
    />
  );
}
