import type { Translations } from "./en";

export function getStatusLabel(t: Translations, status: string): string {
  const map: Record<string, string> = {
    PENDING: t.status.pending,
    CONFIRMED: t.status.confirmed,
    COMPLETED: t.status.completed,
    CANCELLED: t.status.cancelled,
    APPROVED: t.status.approved,
    IN_PROGRESS: t.status.inProgress,
    REJECTED: t.status.rejected,
    PARTIAL: t.status.partial,
    PAID: t.status.paid,
    OVERDUE: t.status.overdue,
    REFUNDED: t.status.refunded,
    DRAFT: t.status.draft,
    ISSUED: t.status.issued,
    PARTIALLY_PAID: t.status.partiallyPaid,
    VOID: t.status.void,
    REQUESTED: t.status.requested,
    PROCESSED: t.status.processed,
  };
  return map[status] ?? status;
}


export function getPaymentMethodLabel(t: Translations, method: string): string {
  const map: Record<string, string> = {
    CASH: t.paymentMethods.cash,
    ONLINE: t.paymentMethods.online,
  };
  return map[method] ?? method;
}

export function getExpenseCategoryLabel(t: Translations, cat: string): string {
  const map: Record<string, string> = {
    DRIVER_SALARY: t.expenseCategories.driverSalary,
    FUEL: t.expenseCategories.fuel,
    CAR_MAINTENANCE: t.expenseCategories.carMaintenance,
    INSURANCE: t.expenseCategories.insurance,
    OFFICE: t.expenseCategories.office,
    OTHER: t.expenseCategories.other,
  };
  return map[cat] ?? cat;
}
