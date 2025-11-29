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
import { useEffect } from "react";
import { useServiceForm } from "../../hooks/useServiceForm";
import { useUpdateService } from "../../hooks/useServices";
import type { Service, UpdateServiceDto } from "../../types";

interface ServiceEditModalProps {
  opened: boolean;
  onClose: () => void;
  service: Service | null;
}

export function ServiceEditModal({
  opened,
  onClose,
  service,
}: ServiceEditModalProps) {
  const updateMutation = useUpdateService();
  const { form } = useServiceForm();

  // Atualiza o formulário quando o serviço muda ou o modal abre
  useEffect(() => {
    if (service && opened) {
      form.setValues({
        name: service.name,
        defaultPrice: service.defaultPrice,
        description: service.description || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service?.id, opened]);

  const handleSubmit = async (values: UpdateServiceDto) => {
    if (!service) return;

    try {
      await updateMutation.mutateAsync({
        id: service.id,
        data: values,
      });
      notifications.show({
        title: "Sucesso",
        message: "Serviço atualizado com sucesso!",
        color: "green",
      });
      onClose();
    } catch {
      notifications.show({
        title: "Erro",
        message: "Erro ao atualizar serviço",
        color: "red",
      });
    }
  };

  return (
    <Modal
      centered
      opened={opened}
      onClose={onClose}
      title="Editar Serviço"
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
            <Button variant="subtle" onClick={onClose}>
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
