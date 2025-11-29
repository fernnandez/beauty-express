import {
  Button,
  Group,
  Modal,
  NumberInput,
  Stack,
  TextInput,
  Textarea,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useServiceForm } from "../../hooks/useServiceForm";
import { useCreateService } from "../../hooks/useServices";
import type { CreateServiceDto } from "../../types";

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

  const handleSubmit = async (values: CreateServiceDto) => {
    try {
      await createMutation.mutateAsync(values);
      notifications.show({
        title: "Sucesso",
        message: "Serviço criado com sucesso!",
        color: "green",
      });
      resetForm();
      onClose();
    } catch {
      notifications.show({
        title: "Erro",
        message: "Erro ao criar serviço",
        color: "red",
      });
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
      <form onSubmit={form.onSubmit(handleSubmit)}>
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
