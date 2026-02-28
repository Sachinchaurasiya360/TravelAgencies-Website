import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
  APPROVED: "bg-blue-100 text-blue-800 border-blue-300",
  CONFIRMED: "bg-indigo-100 text-indigo-800 border-indigo-300",
  IN_PROGRESS: "bg-purple-100 text-purple-800 border-purple-300",
  COMPLETED: "bg-green-100 text-green-800 border-green-300",
  CANCELLED: "bg-red-100 text-red-800 border-red-300",
  REJECTED: "bg-red-100 text-red-800 border-red-300",
  PARTIAL: "bg-orange-100 text-orange-800 border-orange-300",
  PAID: "bg-green-100 text-green-800 border-green-300",
  OVERDUE: "bg-red-100 text-red-800 border-red-300",
  REFUNDED: "bg-gray-100 text-gray-800 border-gray-300",
  DRAFT: "bg-gray-100 text-gray-800 border-gray-300",
  ISSUED: "bg-blue-100 text-blue-800 border-blue-300",
  PARTIALLY_PAID: "bg-orange-100 text-orange-800 border-orange-300",
  VOID: "bg-gray-100 text-gray-800 border-gray-300",
  REQUESTED: "bg-yellow-100 text-yellow-800 border-yellow-300",
  PROCESSED: "bg-green-100 text-green-800 border-green-300",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
  PARTIAL: "Partial",
  PAID: "Paid",
  OVERDUE: "Overdue",
  REFUNDED: "Refunded",
  DRAFT: "Draft",
  ISSUED: "Issued",
  PARTIALLY_PAID: "Partially Paid",
  VOID: "Void",
  REQUESTED: "Requested",
  PROCESSED: "Processed",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        statusColors[status] || "bg-gray-100 text-gray-800 border-gray-300",
        className
      )}
    >
      {statusLabels[status] || status}
    </Badge>
  );
}
