import {
  Autocomplete,
  Button,
  Group,
  Modal,
  NumberInput,
  Stack,
  TextInput,
} from "@mantine/core";
import { useCollaboratorForm } from "../../hooks/useCollaboratorForm";
import { useCreateCollaborator } from "../../hooks/useCollaborators";
import { useNotifications } from "../../hooks/useNotifications";
import { MESSAGES } from "../../constants/messages.constants";
import { COLLABORATOR_AREAS } from "../../utils/collaborator.utils";
import type { CreateCollaboratorDto } from "../../types";

interface CollaboratorCreateModalProps {
  opened: boolean;
  onClose: () => void;
}

export function CollaboratorCreateModal({
  opened,
  onClose,
}: CollaboratorCreateModalProps) {
  const createMutation = useCreateCollaborator();
  const { form, resetForm } = useCollaboratorForm();
  const { showSuccess, showError } = useNotifications();

  const handleSubmit = async (values: CreateCollaboratorDto) => {
    try {
      await createMutation.mutateAsync(values);
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
      <form
        onSubmit={form.onSubmit((values) =>
          handleSubmit(values as CreateCollaboratorDto)
        )}
      >
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

          <NumberInput
            label="Percentual de Comissão"
            placeholder="0"
            min={0}
            max={100}
            decimalScale={2}
            required
            {...form.getInputProps("commissionPercentage")}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={handleClose}>
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
