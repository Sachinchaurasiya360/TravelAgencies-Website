import { z } from "zod";
import { EXPENSE_CATEGORIES } from "@/lib/constants";

export const createExpenseSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES, { message: "Please select a category" }),
  description: z.string().min(1, "Description is required").max(500),
  amount: z.number().positive("Amount must be positive"),
  expenseDate: z.coerce.date().optional(),
  notes: z.string().max(1000).optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
