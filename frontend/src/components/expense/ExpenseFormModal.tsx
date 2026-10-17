import {
  Button,
  Group,
  Modal,
  NumberInput,
  SegmentedControl,
  Select,
  Stack,
  TextInput,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { DateTime } from "luxon";
import { useEffect } from "react";
import { useCreateExpense, useUpdateExpense } from "../../hooks/useExpenses";
import { useNotifications } from "../../hooks/useNotifications";
import type {
  CreateExpenseDto,
  Expense,
  ExpenseCategory,
  ExpenseType,
} from "../../types";

const SP_ZONE = "America/Sao_Paulo";

const CATEGORY_OPTIONS: { value: ExpenseCategory; label: string }[] = [
  { value: "aluguel", label: "Aluguel" },
  { value: "contas", label: "Contas (água, luz, internet)" },
  { value: "salarios", label: "Salários" },
  { value: "insumos", label: "Insumos / Produtos" },
  { value: "impostos", label: "Impostos" },
  { value: "marketing", label: "Marketing" },
  { value: "outros", label: "Outros" },
];

interface ExpenseFormModalProps {
  opened: boolean;
  onClose: () => void;
  expense?: Expense | null;
}

interface FormValues {
  description: string;
  category: ExpenseCategory;
  amount: number | string;
  type: ExpenseType;
  date: Date | null;
  dayOfMonth: number | string;
}

function toDate(value?: string | null): Date | null {
  if (!value) return null;
  const dt = DateTime.fromISO(value, { zone: SP_ZONE });
  return dt.isValid ? dt.toJSDate() : null;
}

function toDateString(value: Date | null): string | undefined {
  if (!value) return undefined;
  return DateTime.fromJSDate(value, { zone: SP_ZONE }).toFormat("yyyy-MM-dd");
}

export function ExpenseFormModal({
  opened,
  onClose,
  expense,
}: ExpenseFormModalProps) {
  const isEditing = Boolean(expense);
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const { showSuccess, showError } = useNotifications();

  const form = useForm<FormValues>({
    initialValues: {
      description: "",
      category: "outros",
      amount: "",
      type: "one_time",
      date: new Date(),
      dayOfMonth: 5,
    },
    validate: {
      description: (v) => (v.trim() ? null : "Informe a descrição"),
      amount: (v) =>
        Number(v) > 0 ? null : "Informe um valor maior que zero",
      date: (v, values) =>
        values.type === "one_time" && !v ? "Informe a data" : null,
      dayOfMonth: (v, values) =>
        values.type === "recurring" && (Number(v) < 1 || Number(v) > 31)
          ? "Dia entre 1 e 31"
          : null,
    },
  });

  useEffect(() => {
    if (opened) {
      if (expense) {
        form.setValues({
          description: expense.description,
          category: expense.category,
          amount: expense.amount,
          type: expense.type,
          date: toDate(expense.date) ?? new Date(),
          dayOfMonth: expense.dayOfMonth ?? 5,
        });
      } else {
        form.reset();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, expense]);

  const handleSubmit = form.onSubmit(async (values) => {
    const payload: CreateExpenseDto = {
      description: values.description.trim(),
      category: values.category,
      amount: Number(values.amount),
      type: values.type,
    };

    if (values.type === "one_time") {
      payload.date = toDateString(values.date);
    } else {
      payload.dayOfMonth = Number(values.dayOfMonth);
    }

    try {
      if (expense) {
        await updateMutation.mutateAsync({ id: expense.id, data: payload });
        showSuccess("Despesa atualizada!");
      } else {
        await createMutation.mutateAsync(payload);
        showSuccess("Despesa criada!");
      }
      onClose();
    } catch {
      showError("Erro ao salvar a despesa");
    }
  });

  const type = form.getValues().type;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEditing ? "Editar despesa" : "Nova despesa"}
      centered
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <SegmentedControl
            fullWidth
            data={[
              { value: "one_time", label: "Esporádica" },
              { value: "recurring", label: "Fixa (mensal)" },
            ]}
            {...form.getInputProps("type")}
          />

          <TextInput
            label="Descrição"
            placeholder="Ex.: Aluguel, Internet..."
            withAsterisk
            {...form.getInputProps("description")}
          />

          <Select
            label="Categoria"
            data={CATEGORY_OPTIONS}
            allowDeselect={false}
            {...form.getInputProps("category")}
          />

          <NumberInput
            label="Valor (R$)"
            placeholder="0,00"
            min={0}
            decimalScale={2}
            fixedDecimalScale
            withAsterisk
            {...form.getInputProps("amount")}
          />

          {type === "one_time" ? (
            <DatePickerInput
              label="Data da despesa"
              valueFormat="DD/MM/YYYY"
              withAsterisk
              {...form.getInputProps("date")}
            />
          ) : (
            <NumberInput
              label="Dia de vencimento"
              description="Dia do mês em que a despesa vence (1 a 31)"
              min={1}
              max={31}
              withAsterisk
              {...form.getInputProps("dayOfMonth")}
            />
          )}

          <Group justify="flex-end" mt="sm">
            <Button variant="subtle" color="gray" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              color="brand"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {isEditing ? "Salvar" : "Criar"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
