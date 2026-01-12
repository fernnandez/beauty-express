import {
  Button,
  Group,
  Modal,
  NumberInput,
  Stack,
  TextInput,
  Textarea,
} from "@mantine/core";
import { useServiceForm } from "../../hooks/useServiceForm";
import { useCreateService } from "../../hooks/useServices";
import { useNotifications } from "../../hooks/useNotifications";
import { MESSAGES } from "../../constants/messages.constants";
import type { CreateServiceDto, UpdateServiceDto } from "../../types";

interface ServiceCreateModalProps {
  opened: boolean;
  onClose: () => void;
}

export function ServiceCreateModal({
  opened,
  onClose,
}: ServiceCreateModalProps) {
  const createMutation = useCreateService();
  const { form, resetForm } = useServiceForm();
  const { showSuccess, showError } = useNotifications();

  const handleSubmit = async (values: CreateServiceDto) => {
    try {
      await createMutation.mutateAsync(values);
      showSuccess(MESSAGES.SUCCESS.CREATE.SERVICE);
      resetForm();
      onClose();
    } catch (error) {
      showError(error, MESSAGES.ERROR.CREATE.SERVICE);
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
      title="Novo Serviço"
      size="md"
    >
      <form
        onSubmit={form.onSubmit((values: CreateServiceDto | UpdateServiceDto) =>
          handleSubmit(values as CreateServiceDto)
        )}
      >
        <Stack gap="md">
          <TextInput
            label="Nome"
            placeholder="Nome do serviço"
            required
            {...form.getInputProps("name")}
          />

          <NumberInput
            label="Preço Padrão"
            placeholder="0.00"
            min={0.01}
            decimalScale={2}
            fixedDecimalScale
            prefix="R$ "
            required
            {...form.getInputProps("defaultPrice")}
          />

          <Textarea
            label="Descrição"
            placeholder="Descrição do serviço (opcional)"
            rows={3}
            {...form.getInputProps("description")}
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
