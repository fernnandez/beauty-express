import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { expenseService } from "../services/expense.service";
import type { CreateExpenseDto, UpdateExpenseDto } from "../types";

export const useExpenses = () => {
  return useQuery({
    queryKey: ["expenses"],
    queryFn: () => expenseService.findAll(),
  });
};

function invalidateExpenseData(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.invalidateQueries({ queryKey: ["expenses"] });
  // O relatório financeiro depende das despesas.
  queryClient.invalidateQueries({ queryKey: ["financialReports"] });
}

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExpenseDto) => expenseService.create(data),
    onSuccess: () => invalidateExpenseData(queryClient),
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseDto }) =>
      expenseService.update(id, data),
    onSuccess: () => invalidateExpenseData(queryClient),
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expenseService.delete(id),
    onSuccess: () => invalidateExpenseData(queryClient),
  });
};
