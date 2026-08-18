import {
  ActionIcon,
  Autocomplete,
  Button,
  Group,
  NumberInput,
  Stack,
  Text,
} from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import type { UseFormReturnType } from "@mantine/form";
import { COLLABORATOR_AREAS } from "../../utils/collaborator.utils";
import type { CollaboratorFormValues } from "../../hooks/useCollaboratorForm";

interface CommissionRatesFieldProps {
  form: UseFormReturnType<CollaboratorFormValues>;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export function CommissionRatesField({
  form,
  onAdd,
  onRemove,
}: CommissionRatesFieldProps) {
  return (
    <Stack gap="sm">
      <Text size="sm" fw={500}>
        Percentuais de comissão
      </Text>
      <Text size="xs" c="dimmed">
        Cadastre um percentual por tipo de serviço. Na hora de atribuir o
        colaborador ao agendamento, você escolhe qual percentual aplicar.
      </Text>
      {form.values.commissionRates.map((_, index) => (
        <Group key={index} align="flex-end" wrap="nowrap" gap="xs">
          <Autocomplete
            style={{ flex: 1 }}
            label={index === 0 ? "Serviço / área" : undefined}
            placeholder="Ex.: Nail Designer"
            required
            data={COLLABORATOR_AREAS.map((area) => area.label)}
            {...form.getInputProps(`commissionRates.${index}.name`)}
          />
          <NumberInput
            w={140}
            label={index === 0 ? "Percentual" : undefined}
            placeholder="0"
            min={0}
            max={100}
            decimalScale={2}
            suffix="%"
            required
            {...form.getInputProps(`commissionRates.${index}.percentage`)}
          />
          <ActionIcon
            color="red"
            variant="light"
            mb={4}
            disabled={form.values.commissionRates.length <= 1}
            onClick={() => onRemove(index)}
            aria-label="Remover percentual"
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      ))}
      <Button
        variant="light"
        size="xs"
        leftSection={<IconPlus size={14} />}
        onClick={onAdd}
        type="button"
      >
        Adicionar percentual
      </Button>
    </Stack>
  );
}
