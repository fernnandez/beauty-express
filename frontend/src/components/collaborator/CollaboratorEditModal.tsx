import {
  Autocomplete,
  Button,
  Group,
  Modal,
  Stack,
  Switch,
  TextInput,
} from "@mantine/core";
import { useEffect } from "react";
import { useCollaboratorForm } from "../../hooks/useCollaboratorForm";
import { useUpdateCollaborator } from "../../hooks/useCollaborators";
import { useNotifications } from "../../hooks/useNotifications";
import { useOperationalBranding } from "../../hooks/useOperationalBranding";
import { MESSAGES } from "../../constants/messages.constants";
import { COLLABORATOR_AREAS } from "../../utils/collaborator.utils";
import type { Collaborator, UpdateCollaboratorDto } from "../../types";
import { CommissionRatesField } from "./CommissionRatesField";

interface CollaboratorEditModalProps {
  opened: boolean;
  onClose: () => void;
  collaborator: Collaborator | null;
}

export function CollaboratorEditModal({
  opened,
  onClose,
  collaborator,
}: CollaboratorEditModalProps) {
  const updateMutation = useUpdateCollaborator();
  const { commissionsEnabled } = useOperationalBranding();
  const { form, addCommissionRate, removeCommissionRate, toDto } =
    useCollaboratorForm(undefined, { commissionsEnabled });
  const { showSuccess, showError } = useNotifications();

  useEffect(() => {
    if (collaborator && opened) {
      form.setValues({
        name: collaborator.name,
        phone: collaborator.phone,
        area: collaborator.area,
        isActive: collaborator.isActive,
        commissionRates:
          collaborator.commissionRates && collaborator.commissionRates.length > 0
            ? collaborator.commissionRates.map((rate) => ({
                id: rate.id,
                name: rate.name,
                percentage: Number(rate.percentage),
              }))
            : [{ name: "", percentage: 0 }],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collaborator?.id, opened]);

  const handleSubmit = async () => {
    if (!collaborator) return;

    try {
      await updateMutation.mutateAsync({
        id: collaborator.id,
        data: toDto(form.values) as UpdateCollaboratorDto,
      });
      showSuccess(MESSAGES.SUCCESS.UPDATE.COLLABORATOR);
      onClose();
    } catch (error) {
      showError(error, MESSAGES.ERROR.UPDATE.COLLABORATOR);
    }
  };

  return (
    <Modal
      centered
      opened={opened}
      onClose={onClose}
      title="Editar Colaborador"
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Nome"
            placeholder="Nome do colaborador"
            required
            {...form.getInputProps("name")}
          />

          <TextInput
            label="Telefone"
            placeholder="(11) 99999-9999"
            required
            {...form.getInputProps("phone")}
          />

          <Autocomplete
            label="Área de Atuação"
            placeholder="Selecione ou digite uma área de atuação"
            required
            data={COLLABORATOR_AREAS.map((area) => area.label)}
            {...form.getInputProps("area")}
          />

          {commissionsEnabled && (
            <CommissionRatesField
              form={form}
              onAdd={addCommissionRate}
              onRemove={removeCommissionRate}
            />
          )}

          <Switch
            label="Ativo"
            description="Colaborador está ativo no sistema"
            {...form.getInputProps("isActive", { type: "checkbox" })}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" color="gray" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={updateMutation.isPending}>
              Salvar
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
