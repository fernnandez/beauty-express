import { Button, Group, Modal, Stack, TextInput } from "@mantine/core";
import { IconPhone, IconUserCircle } from "@tabler/icons-react";
import { MESSAGES } from "../../constants/messages.constants";
import { useClientForm } from "../../hooks/useClientForm";
import { useCreateClient } from "../../hooks/useClients";
import { useNotifications } from "../../hooks/useNotifications";
import type { CreateClientDto } from "../../types";
import { formatPhoneInput } from "../../utils/phone.util";

interface ClientCreateModalProps {
  opened: boolean;
  onClose: () => void;
}

export function ClientCreateModal({ opened, onClose }: ClientCreateModalProps) {
  const createMutation = useCreateClient();
  const { form, resetForm } = useClientForm();
  const { showSuccess, showError } = useNotifications();

  const handleSubmit = async (values: CreateClientDto) => {
    try {
      await createMutation.mutateAsync(values);
      showSuccess(MESSAGES.SUCCESS.CREATE.CLIENT);
      resetForm();
      onClose();
    } catch (error) {
      showError(error, MESSAGES.ERROR.CREATE.CLIENT);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal centered opened={opened} onClose={handleClose} title="Novo Cliente">
      <form
        onSubmit={form.onSubmit((values) =>
          handleSubmit(values as CreateClientDto)
        )}
      >
        <Stack gap="md">
          <TextInput
            label="Nome"
            placeholder="Nome do cliente"
            required
            leftSection={<IconUserCircle size={16} />}
            {...form.getInputProps("name")}
          />
          <TextInput
            label="Telefone"
            placeholder="(11) 99999-9999 ou +351912345678"
            required
            leftSection={<IconPhone size={16} />}
            value={form.values.phone}
            onChange={(event) =>
              form.setFieldValue("phone", formatPhoneInput(event.currentTarget.value))
            }
            error={form.errors.phone}
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
