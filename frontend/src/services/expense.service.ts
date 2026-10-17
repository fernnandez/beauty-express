import { api } from "../config/api";
import type { CreateExpenseDto, Expense, UpdateExpenseDto } from "../types";

export const expenseService = {
  findAll: async (): Promise<Expense[]> => {
    const response = await api.get<Expense[]>("/expenses");
    return response.data;
  },

  create: async (data: CreateExpenseDto): Promise<Expense> => {
    const response = await api.post<Expense>("/expenses", data);
    return response.data;
  },

  update: async (id: string, data: UpdateExpenseDto): Promise<Expense> => {
    const response = await api.put<Expense>(`/expenses/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/expenses/${id}`);
  },
};
