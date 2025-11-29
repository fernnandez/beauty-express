import {
  ActionIcon,
  Card,
  Group,
  NumberInput,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import {
  IconCurrencyDollar,
  IconScissors,
  IconTrash,
  IconUser,
} from "@tabler/icons-react";
import type { Collaborator, Service } from "../../types";
import { formatPrice, formatServiceOption } from "../../utils/appointment.utils";

interface ServiceFormItemProps {
  index: number;
  serviceId: string;
  collaboratorId?: string;
  price?: number;
  services?: Service[];
  collaborators?: Collaborator[];
  canRemove: boolean;
  onServiceChange: (index: number, serviceId: string) => void;
  onCollaboratorChange: (index: number, collaboratorId?: string) => void;
  onPriceChange: (index: number, price: number) => void;
  onRemove: (index: number) => void;
}

export function ServiceFormItem({
  index,
  serviceId,
  collaboratorId,
  price,
  services,
  collaborators,
  canRemove,
  onServiceChange,
  onCollaboratorChange,
  onPriceChange,
  onRemove,
}: ServiceFormItemProps) {
  const selectedService = services?.find((s) => s.id === serviceId);

  return (
    <Card key={index} withBorder padding="md" radius="md">
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={500} size="sm">
            Serviço {index + 1}
          </Text>
          {canRemove && (
            <ActionIcon
              color="red"
              variant="light"
              onClick={() => onRemove(index)}
            >
              <IconTrash size={16} />
            </ActionIcon>
          )}
        </Group>

        <Select
          label="Serviço"
          placeholder="Selecione o serviço"
          required
          leftSection={<IconScissors size={16} />}
          data={services?.map(formatServiceOption) || []}
          searchable
          value={serviceId}
          onChange={(value) => onServiceChange(index, value || "")}
        />

        {selectedService && (
          <>
            <Select
              label="Colaborador (Opcional)"
              placeholder="Selecione o colaborador"
              leftSection={<IconUser size={16} />}
              data={
                collaborators?.map((collaborator) => ({
                  value: collaborator.id,
                  label: collaborator.name,
                })) || []
              }
              searchable
              clearable
              value={collaboratorId || null}
              onChange={(value) =>
                onCollaboratorChange(index, value || undefined)
              }
            />
            <NumberInput
              label="Preço (Opcional)"
              placeholder={`Padrão: ${formatPrice(selectedService.defaultPrice)}`}
              leftSection={<IconCurrencyDollar size={16} />}
              min={0.01}
              decimalScale={2}
              fixedDecimalScale
              value={price ?? selectedService.defaultPrice}
              onChange={(value) =>
                onPriceChange(
                  index,
                  typeof value === "number" ? value : selectedService.defaultPrice
                )
              }
            />
          </>
        )}
      </Stack>
    </Card>
  );
}

