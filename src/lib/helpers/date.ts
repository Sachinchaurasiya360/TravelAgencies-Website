import { format, formatDistanceToNow } from "date-fns";

export function formatDate(date: Date | string): string {
  return format(new Date(date), "dd MMM yyyy");
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "dd MMM yyyy, hh:mm a");
}

export function formatDateShort(date: Date | string): string {
  return format(new Date(date), "dd/MM/yyyy");
}

export function formatTimeAgo(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDateForInput(date: Date | string): string {
  return format(new Date(date), "yyyy-MM-dd");
}
