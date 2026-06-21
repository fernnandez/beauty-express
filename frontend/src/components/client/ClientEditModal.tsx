import { Button, Group, Modal, Stack, TextInput } from "@mantine/core";
import { IconPhone, IconUserCircle } from "@tabler/icons-react";
import { useEffect } from "react";
import { MESSAGES } from "../../constants/messages.constants";
import { useClientForm } from "../../hooks/useClientForm";
import { useUpdateClient } from "../../hooks/useClients";
import { useNotifications } from "../../hooks/useNotifications";
import type { Client, UpdateClientDto } from "../../types";
import { formatPhoneInput } from "../../utils/phone.util";

interface ClientEditModalProps {
  opened: boolean;
  onClose: () => void;
  client: Client | null;
}

export function ClientEditModal({
  opened,
  onClose,
  client,
}: ClientEditModalProps) {
  const updateMutation = useUpdateClient();
  const { form, resetForm } = useClientForm();
  const { showSuccess, showError } = useNotifications();

  useEffect(() => {
    if (client && opened) {
      form.setValues({
        name: client.name,
        phone: client.phone,
      });
    } else {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client?.id, opened]);

  const handleSubmit = async (values: UpdateClientDto) => {
    if (!client) return;

    try {
      await updateMutation.mutateAsync({ id: client.id, data: values });
      showSuccess(MESSAGES.SUCCESS.UPDATE.CLIENT);
      onClose();
    } catch (error) {
      showError(error, MESSAGES.ERROR.UPDATE.CLIENT);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!client) return null;

  return (
    <Modal centered opened={opened} onClose={handleClose} title="Editar Cliente">
      <form onSubmit={form.onSubmit(handleSubmit)}>
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
            <Button type="submit" loading={updateMutation.isPending}>
              Salvar
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
