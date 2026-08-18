import {
  Autocomplete,
  Button,
  Group,
  Modal,
  Stack,
  TextInput,
} from "@mantine/core";
import { useCollaboratorForm } from "../../hooks/useCollaboratorForm";
import { useCreateCollaborator } from "../../hooks/useCollaborators";
import { useNotifications } from "../../hooks/useNotifications";
import { useOperationalBranding } from "../../hooks/useOperationalBranding";
import { MESSAGES } from "../../constants/messages.constants";
import { COLLABORATOR_AREAS } from "../../utils/collaborator.utils";
import type { CreateCollaboratorDto } from "../../types";
import { CommissionRatesField } from "./CommissionRatesField";

interface CollaboratorCreateModalProps {
  opened: boolean;
  onClose: () => void;
}

export function CollaboratorCreateModal({
  opened,
  onClose,
}: CollaboratorCreateModalProps) {
  const createMutation = useCreateCollaborator();
  const { commissionsEnabled } = useOperationalBranding();
  const { form, resetForm, addCommissionRate, removeCommissionRate, toDto } =
    useCollaboratorForm(undefined, {
      commissionsEnabled,
    });
  const { showSuccess, showError } = useNotifications();

  const handleSubmit = async () => {
    try {
      await createMutation.mutateAsync(toDto(form.values) as CreateCollaboratorDto);
      showSuccess(MESSAGES.SUCCESS.CREATE.COLLABORATOR);
      resetForm();
      onClose();
    } catch (error) {
      showError(error, MESSAGES.ERROR.CREATE.COLLABORATOR);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      centered
      opened={opened}
      onClose={handleClose}
      title="Novo Colaborador"
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

          <Group justify="flex-end" mt="md">
            <Button variant="default" color="gray" type="button" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Criar
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
