"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatCurrency } from "@/lib/helpers/currency";
import { formatDate } from "@/lib/helpers/date";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { useT } from "@/lib/i18n/language-context";
import { interpolate } from "@/lib/i18n";
import { getExpenseCategoryLabel } from "@/lib/i18n/label-maps";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Wallet,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: string;
  expenseDate: string;
  notes: string | null;
  createdBy: { id: string; name: string };
}

export default function ExpensesPage() {
  const t = useT();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({
    category: "" as string,
    description: "",
    amount: "",
    expenseDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Delete
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sortBy: "expenseDate",
        sortOrder: "desc",
      });
      if (search) params.set("search", search);
      if (categoryFilter !== "all") params.set("category", categoryFilter);

      const res = await fetch(`/api/expenses?${params}`);
      const result = await res.json();

      if (result.success) {
        setExpenses(result.data.expenses);
        setTotalPages(result.data.pagination.totalPages);
      }
    } catch {
      toast.error(t.expenses.fetchFailed);
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  function resetForm() {
    setForm({
      category: "",
      description: "",
      amount: "",
      expenseDate: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setEditingId(null);
    setFormOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    try {
      const url = editingId ? `/api/expenses/${editingId}` : "/api/expenses";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: form.category,
          description: form.description,
          amount: parseFloat(form.amount),
          expenseDate: form.expenseDate || undefined,
          notes: form.notes || undefined,
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(editingId ? t.expenses.expenseUpdated : t.expenses.expenseAdded);
        resetForm();
        fetchExpenses();
      } else {
        toast.error(result.error || t.expenses.saveFailed);
      }
    } catch {
      toast.error(t.expenses.saveFailed);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteDialog.id) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/expenses/${deleteDialog.id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        toast.success(t.expenses.expenseDeleted);
        setDeleteDialog({ open: false, id: null });
        fetchExpenses();
      } else {
        toast.error(result.error || t.expenses.deleteFailed);
      }
    } catch {
      toast.error(t.expenses.deleteFailed);
    } finally {
      setDeleteLoading(false);
    }
  }

  function handleEdit(expense: Expense) {
    setForm({
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      expenseDate: new Date(expense.expenseDate).toISOString().split("T")[0],
      notes: expense.notes || "",
    });
    setEditingId(expense.id);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.expenses.title}
        description={t.expenses.subtitle}
      >
        {!formOpen && (
          <Button onClick={() => { resetForm(); setFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            {t.expenses.addExpense}
          </Button>
        )}
      </PageHeader>

      {/* Add/Edit Form */}
      {formOpen && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label htmlFor="category">{t.expenses.categoryRequired}</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm({ ...form, category: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={t.expenses.selectCategory} />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {getExpenseCategoryLabel(t, cat)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">{t.expenses.amountRequired}</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="1"
                    min="1"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="expenseDate">{t.expenses.dateRequired}</Label>
                  <Input
                    id="expenseDate"
                    type="date"
                    value={form.expenseDate}
                    onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="description">{t.expenses.descriptionRequired}</Label>
                  <Input
                    id="description"
                    type="text"
                    placeholder={t.expenses.descriptionPlaceholder}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">{t.expenses.notesOptional}</Label>
                <Textarea
                  id="notes"
                  placeholder={t.expenses.notesPlaceholder}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={formLoading || !form.category}>
                  {formLoading ? t.common.saving : editingId ? t.expenses.updateExpense : t.expenses.addExpense}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  {t.common.cancel}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder={t.expenses.searchPlaceholder}
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={(v) => {
                setCategoryFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder={t.expenses.allCategories} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.expenses.allCategories}</SelectItem>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {getExpenseCategoryLabel(t, cat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <LoadingSpinner />
          ) : expenses.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title={t.expenses.noExpensesFound}
              description={t.expenses.noExpensesMatch}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b text-left">
                      <th className="p-4 font-medium">{t.expenses.dateColumn}</th>
                      <th className="p-4 font-medium">{t.expenses.category}</th>
                      <th className="p-4 font-medium">{t.expenses.description}</th>
                      <th className="p-4 font-medium">{t.expenses.amount}</th>
                      <th className="p-4 font-medium">{t.expenses.addedBy}</th>
                      <th className="p-4 font-medium">{t.common.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr
                        key={expense.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="p-4">{formatDate(expense.expenseDate)}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                            {getExpenseCategoryLabel(t, expense.category)}
                          </span>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{expense.description}</p>
                            {expense.notes && (
                              <p className="text-muted-foreground text-xs mt-0.5">{expense.notes}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-medium">{formatCurrency(expense.amount)}</td>
                        <td className="p-4 text-muted-foreground">{expense.createdBy.name}</td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(expense)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteDialog({ open: true, id: expense.id })}
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t p-4">
                <p className="text-muted-foreground text-sm">
                  {interpolate(t.common.pageOf, { page, total: totalPages })}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t.common.prev}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    {t.common.next}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title={t.expenses.deleteTitle}
        description={t.expenses.deleteMessage}
        confirmLabel={t.common.delete}
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
