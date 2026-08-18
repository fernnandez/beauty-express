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
  IconPercentage,
  IconScissors,
  IconTrash,
  IconUser,
} from "@tabler/icons-react";
import type { Collaborator, Service } from "../../types";
import {
  formatPrice,
  formatServiceOption,
} from "../../utils/appointment.utils";
import {
  formatCommissionRateLabel,
  getDefaultCommissionRateId,
} from "../../utils/collaborator.utils";
import { toMoney } from "../../utils/money.util";

interface ServiceFormItemProps {
  index: number;
  serviceId: string;
  collaboratorId?: string;
  commissionRateId?: string;
  price?: number;
  services?: Service[];
  collaborators?: Collaborator[];
  canRemove: boolean;
  collaboratorRequired?: boolean;
  commissionsEnabled?: boolean;
  onServiceChange: (index: number, serviceId: string) => void;
  onCollaboratorChange: (
    index: number,
    collaboratorId?: string,
    commissionRateId?: string,
  ) => void;
  onCommissionRateChange: (index: number, commissionRateId?: string) => void;
  onPriceChange: (index: number, price: number) => void;
  onRemove: (index: number) => void;
}

export function ServiceFormItem({
  index,
  serviceId,
  collaboratorId,
  commissionRateId,
  price,
  services,
  collaborators,
  canRemove,
  collaboratorRequired = false,
  commissionsEnabled = false,
  onServiceChange,
  onCollaboratorChange,
  onCommissionRateChange,
  onPriceChange,
  onRemove,
}: ServiceFormItemProps) {
  const selectedService = services?.find((s) => s.id === serviceId);
  const selectedCollaborator = collaborators?.find(
    (collaborator) => collaborator.id === collaboratorId,
  );
  const commissionRates = selectedCollaborator?.commissionRates ?? [];
  const showCommissionRateSelect =
    commissionsEnabled && Boolean(collaboratorId) && commissionRates.length > 0;

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
              label={
                collaboratorRequired ? "Colaborador" : "Colaborador (Opcional)"
              }
              placeholder="Selecione o colaborador"
              required={collaboratorRequired}
              leftSection={<IconUser size={16} />}
              data={
                collaborators?.map((collaborator) => ({
                  value: collaborator.id,
                  label: collaborator.name,
                })) || []
              }
              searchable
              clearable={!collaboratorRequired}
              value={collaboratorId || null}
              onChange={(value) => {
                const nextCollaboratorId = value || undefined;
                const nextCollaborator = collaborators?.find(
                  (collaborator) => collaborator.id === nextCollaboratorId,
                );
                onCollaboratorChange(
                  index,
                  nextCollaboratorId,
                  getDefaultCommissionRateId(nextCollaborator),
                );
              }}
            />
            {showCommissionRateSelect && (
              <Select
                label="Percentual de comissão"
                placeholder="Selecione o percentual"
                required={commissionRates.length > 1}
                leftSection={<IconPercentage size={16} />}
                data={commissionRates.map((rate) => ({
                  value: rate.id,
                  label: formatCommissionRateLabel(rate),
                }))}
                searchable
                value={
                  commissionRateId ||
                  getDefaultCommissionRateId(selectedCollaborator) ||
                  null
                }
                onChange={(value) =>
                  onCommissionRateChange(index, value || undefined)
                }
              />
            )}
            <NumberInput
              label="Preço (Opcional)"
              placeholder={`Padrão: ${formatPrice(
                selectedService.defaultPrice
              )}`}
              leftSection={<IconCurrencyDollar size={16} />}
              min={0.01}
              decimalScale={2}
              fixedDecimalScale
              value={
                price !== undefined
                  ? toMoney(price)
                  : toMoney(selectedService.defaultPrice)
              }
              onChange={(value) =>
                onPriceChange(
                  index,
                  toMoney(value) || toMoney(selectedService.defaultPrice),
                )
              }
            />
          </>
        )}
      </Stack>
    </Card>
  );
}
