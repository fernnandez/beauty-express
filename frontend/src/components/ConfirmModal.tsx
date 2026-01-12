import { Modal, Text, Button, Group } from '@mantine/core';

interface ConfirmModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: string;
  loading?: boolean;
}

export function ConfirmModal({
  opened,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmColor = 'red',
  loading = false,
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      size="sm"
      centered
      zIndex={300}
    >
      <Text mb="lg">{message}</Text>

      <Group justify="flex-end">
        <Button variant="subtle" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          color={confirmColor}
          onClick={handleConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </Group>
    </Modal>
  );
}

