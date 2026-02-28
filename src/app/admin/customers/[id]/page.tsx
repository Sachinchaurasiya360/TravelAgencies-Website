"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { formatCurrency } from "@/lib/helpers/currency";
import { formatDate, formatDateTime } from "@/lib/helpers/date";
import { VEHICLE_TYPE_LABELS } from "@/lib/constants";
import { ArrowLeft, User, Mail, Phone, CalendarCheck } from "lucide-react";

interface CustomerBooking {
  id: string;
  bookingId: string;
  status: string;
  vehicleType: string;
  travelDate: string;
  totalAmount: string | null;
  paymentStatus: string;
  createdAt: string;
}

interface CustomerDetail {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  createdAt: string;
  bookings: CustomerBooking[];
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCustomer() {
      try {
        const res = await fetch(`/api/customers/${id}`);
        const result = await res.json();
        if (result.success) {
          setCustomer(result.data);
        } else {
          toast.error("Customer not found");
          router.push("/admin/customers");
        }
      } catch {
        toast.error("Failed to fetch customer details");
      } finally {
        setLoading(false);
      }
    }
    fetchCustomer();
  }, [id, router]);

  if (loading) return <LoadingSpinner />;
  if (!customer) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/customers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <p className="text-muted-foreground text-sm">
            Customer since {formatDate(customer.createdAt)}
          </p>
        </div>
      </div>

      {/* Customer Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3">
              <User className="text-muted-foreground mt-0.5 h-4 w-4" />
              <div>
                <p className="text-muted-foreground text-xs">Name</p>
                <p className="text-sm font-medium">{customer.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="text-muted-foreground mt-0.5 h-4 w-4" />
              <div>
                <p className="text-muted-foreground text-xs">Phone</p>
                <p className="text-sm font-medium">{customer.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="text-muted-foreground mt-0.5 h-4 w-4" />
              <div>
                <p className="text-muted-foreground text-xs">Email</p>
                <p className="text-sm font-medium">{customer.email || "Not provided"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarCheck className="h-5 w-5" />
            Booking History ({customer.bookings.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {customer.bookings.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center text-sm">
              No bookings yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b text-left">
                    <th className="p-4 font-medium">Booking ID</th>
                    <th className="p-4 font-medium">Vehicle</th>
                    <th className="p-4 font-medium">Travel Date</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Payment</th>
                    <th className="p-4 font-medium">Amount</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.bookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="border-b last:border-0 hover:bg-gray-50"
                    >
                      <td className="p-4">
                        <Link
                          href={`/admin/bookings/${booking.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {booking.bookingId}
                        </Link>
                      </td>
                      <td className="p-4">
                        {VEHICLE_TYPE_LABELS[booking.vehicleType] || booking.vehicleType}
                      </td>
                      <td className="p-4">{formatDate(booking.travelDate)}</td>
                      <td className="p-4">
                        <StatusBadge status={booking.status} />
                      </td>
                      <td className="p-4">
                        <StatusBadge status={booking.paymentStatus} />
                      </td>
                      <td className="p-4 font-medium">
                        {booking.totalAmount
                          ? formatCurrency(booking.totalAmount)
                          : "-"}
                      </td>
                      <td className="p-4">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/bookings/${booking.id}`}>
                            View
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
