"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { formatCurrency } from "@/lib/helpers/currency";
import { formatDateTime } from "@/lib/helpers/date";
import {
  VEHICLE_TYPE_LABELS,
  TRIP_TYPE_LABELS,
  ALLOWED_STATUS_TRANSITIONS,
  BOOKING_STATUS_LABELS,
} from "@/lib/constants";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Car,
  Clock,
  Send,
  IndianRupee,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import type { BOOKING_STATUSES } from "@/lib/constants";

type BookingStatus = (typeof BOOKING_STATUSES)[number];

interface BookingDetail {
  id: string;
  bookingId: string;
  status: BookingStatus;
  tripType: string;
  vehicleType: string;
  vehiclePreference: string | null;
  passengerCount: number;
  travelDate: string;
  returnDate: string | null;
  pickupLocation: string;
  pickupAddress: string | null;
  dropLocation: string;
  dropAddress: string | null;
  pickupTime: string | null;
  specialRequests: string | null;
  baseFare: string | null;
  taxAmount: string | null;
  tollCharges: string | null;
  driverAllowance: string | null;
  extraCharges: string | null;
  extraChargesNote: string | null;
  discount: string | null;
  totalAmount: string | null;
  paymentStatus: string;
  paymentDueDate: string | null;
  adminRemarks: string | null;
  rejectionReason: string | null;
  cancellationReason: string | null;
  createdAt: string;
  customer: { id: string; name: string; phone: string; email: string | null };
  notes: { id: string; content: string; createdAt: string; user: { name: string } }[];
  payments: { id: string; amount: string; method: string; paymentDate: string; isAdvance: boolean }[];
}

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Pricing form
  const [pricingOpen, setPricingOpen] = useState(false);
  const [pricing, setPricing] = useState({
    baseFare: "",
    tollCharges: "0",
    driverAllowance: "0",
    extraCharges: "0",
    discount: "0",
  });
  const [pricingLoading, setPricingLoading] = useState(false);

  // Status transition
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    status: BookingStatus | null;
    needsReason: boolean;
  }>({ open: false, status: null, needsReason: false });
  const [reason, setReason] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);

  // Notes
  const [noteContent, setNoteContent] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);

  async function fetchBooking() {
    try {
      const res = await fetch(`/api/bookings/${id}`);
      const result = await res.json();
      if (result.success) {
        setBooking(result.data);
      } else {
        toast.error("Booking not found");
        router.push("/admin/bookings");
      }
    } catch {
      toast.error("Failed to fetch booking");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBooking();
  }, [id]);

  async function handleStatusChange() {
    if (!statusDialog.status) return;
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/bookings/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusDialog.status, reason }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(`Booking status updated to ${BOOKING_STATUS_LABELS[statusDialog.status]}`);
        setStatusDialog({ open: false, status: null, needsReason: false });
        setReason("");
        fetchBooking();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  }

  async function handlePricingSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPricingLoading(true);
    try {
      const res = await fetch(`/api/bookings/${id}/assign-pricing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseFare: parseFloat(pricing.baseFare),
          tollCharges: parseFloat(pricing.tollCharges) || 0,
          driverAllowance: parseFloat(pricing.driverAllowance) || 0,
          extraCharges: parseFloat(pricing.extraCharges) || 0,
          discount: parseFloat(pricing.discount) || 0,
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Pricing assigned successfully");
        setPricingOpen(false);
        fetchBooking();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to assign pricing");
    } finally {
      setPricingLoading(false);
    }
  }

  async function handleAddNote() {
    if (!noteContent.trim()) return;
    setNoteLoading(true);
    try {
      const res = await fetch(`/api/bookings/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteContent }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Note added");
        setNoteContent("");
        fetchBooking();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to add note");
    } finally {
      setNoteLoading(false);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (!booking) return null;

  const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[booking.status] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/bookings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{booking.bookingId}</h1>
            <StatusBadge status={booking.status} />
          </div>
          <p className="text-muted-foreground text-sm">
            Created {formatDateTime(booking.createdAt)}
          </p>
        </div>
      </div>

      {/* Status Actions */}
      {allowedTransitions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {allowedTransitions.map((status) => {
              const needsReason = status === "CANCELLED" || status === "REJECTED";
              const variant =
                status === "APPROVED" || status === "CONFIRMED"
                  ? "default"
                  : status === "CANCELLED" || status === "REJECTED"
                    ? "destructive"
                    : "outline";
              return (
                <Button
                  key={status}
                  variant={variant as "default" | "destructive" | "outline"}
                  onClick={() =>
                    setStatusDialog({ open: true, status, needsReason })
                  }
                >
                  {BOOKING_STATUS_LABELS[status] || status}
                </Button>
              );
            })}
            {!booking.baseFare && (
              <Button
                variant="outline"
                onClick={() => setPricingOpen(!pricingOpen)}
              >
                <IndianRupee className="mr-2 h-4 w-4" />
                Assign Pricing
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trip Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Trip Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Trip Type</p>
                <p className="font-medium">{TRIP_TYPE_LABELS[booking.tripType]}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Vehicle</p>
                <p className="font-medium">{VEHICLE_TYPE_LABELS[booking.vehicleType]}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Passengers</p>
                <p className="font-medium">{booking.passengerCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Travel Date</p>
                <p className="font-medium">
                  {new Date(booking.travelDate).toLocaleDateString("en-IN")}
                </p>
              </div>
              {booking.returnDate && (
                <div>
                  <p className="text-muted-foreground">Return Date</p>
                  <p className="font-medium">
                    {new Date(booking.returnDate).toLocaleDateString("en-IN")}
                  </p>
                </div>
              )}
              {booking.pickupTime && (
                <div>
                  <p className="text-muted-foreground">Pickup Time</p>
                  <p className="font-medium">{booking.pickupTime}</p>
                </div>
              )}
            </div>

            <div className="space-y-2 border-t pt-4">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-green-500" />
                <div>
                  <p className="text-muted-foreground text-xs">Pickup</p>
                  <p className="text-sm font-medium">{booking.pickupLocation}</p>
                  {booking.pickupAddress && (
                    <p className="text-muted-foreground text-xs">{booking.pickupAddress}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-red-500" />
                <div>
                  <p className="text-muted-foreground text-xs">Drop</p>
                  <p className="text-sm font-medium">{booking.dropLocation}</p>
                  {booking.dropAddress && (
                    <p className="text-muted-foreground text-xs">{booking.dropAddress}</p>
                  )}
                </div>
              </div>
            </div>

            {booking.specialRequests && (
              <div className="border-t pt-4">
                <p className="text-muted-foreground text-xs">Special Requests</p>
                <p className="text-sm">{booking.specialRequests}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Name</p>
              <p className="font-medium">{booking.customer.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p className="font-medium">{booking.customer.phone}</p>
            </div>
            {booking.customer.email && (
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{booking.customer.email}</p>
              </div>
            )}
            <Button variant="outline" size="sm" asChild className="mt-2">
              <Link href={`/admin/customers/${booking.customer.id}`}>
                View Customer
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            {booking.baseFare ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Fare</span>
                  <span>{formatCurrency(booking.baseFare)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST (5%)</span>
                  <span>{formatCurrency(booking.taxAmount)}</span>
                </div>
                {parseFloat(booking.tollCharges || "0") > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Toll Charges</span>
                    <span>{formatCurrency(booking.tollCharges)}</span>
                  </div>
                )}
                {parseFloat(booking.driverAllowance || "0") > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Driver Allowance</span>
                    <span>{formatCurrency(booking.driverAllowance)}</span>
                  </div>
                )}
                {parseFloat(booking.extraCharges || "0") > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Extra Charges{booking.extraChargesNote && ` (${booking.extraChargesNote})`}
                    </span>
                    <span>{formatCurrency(booking.extraCharges)}</span>
                  </div>
                )}
                {parseFloat(booking.discount || "0") > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(booking.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 font-bold">
                  <span>Total</span>
                  <span className="text-blue-600">{formatCurrency(booking.totalAmount)}</span>
                </div>
              </div>
            ) : pricingOpen ? (
              <form onSubmit={handlePricingSubmit} className="space-y-3">
                <div>
                  <Label htmlFor="baseFare">Base Fare *</Label>
                  <Input
                    id="baseFare"
                    type="number"
                    step="0.01"
                    min="0"
                    value={pricing.baseFare}
                    onChange={(e) => setPricing({ ...pricing, baseFare: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="tollCharges">Toll Charges</Label>
                    <Input
                      id="tollCharges"
                      type="number"
                      step="0.01"
                      min="0"
                      value={pricing.tollCharges}
                      onChange={(e) => setPricing({ ...pricing, tollCharges: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="driverAllowance">Driver Allowance</Label>
                    <Input
                      id="driverAllowance"
                      type="number"
                      step="0.01"
                      min="0"
                      value={pricing.driverAllowance}
                      onChange={(e) => setPricing({ ...pricing, driverAllowance: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="extraCharges">Extra Charges</Label>
                    <Input
                      id="extraCharges"
                      type="number"
                      step="0.01"
                      min="0"
                      value={pricing.extraCharges}
                      onChange={(e) => setPricing({ ...pricing, extraCharges: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="discount">Discount</Label>
                    <Input
                      id="discount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={pricing.discount}
                      onChange={(e) => setPricing({ ...pricing, discount: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={pricingLoading} size="sm">
                    {pricingLoading ? "Saving..." : "Save Pricing"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPricingOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-muted-foreground py-4 text-center text-sm">
                No pricing assigned yet.
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setPricingOpen(true)}
                >
                  Assign Pricing
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Payments</CardTitle>
            <StatusBadge status={booking.paymentStatus} />
          </CardHeader>
          <CardContent>
            {booking.payments.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No payments recorded yet.
              </p>
            ) : (
              <div className="space-y-2">
                {booking.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded border p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{formatCurrency(payment.amount)}</p>
                      <p className="text-muted-foreground text-xs">
                        {payment.method} {payment.isAdvance && "(Advance)"}
                      </p>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {new Date(payment.paymentDate).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5" />
            Admin Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Textarea
              placeholder="Add a note..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={2}
              className="flex-1"
            />
            <Button
              onClick={handleAddNote}
              disabled={noteLoading || !noteContent.trim()}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {booking.notes.length > 0 && (
            <div className="mt-4 space-y-3">
              {booking.notes.map((note) => (
                <div key={note.id} className="rounded border p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium">{note.user.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatDateTime(note.createdAt)}
                    </p>
                  </div>
                  <p className="mt-1 text-sm">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Transition Dialog */}
      <ConfirmDialog
        open={statusDialog.open}
        onOpenChange={(open) => setStatusDialog({ ...statusDialog, open })}
        title={`${statusDialog.status ? BOOKING_STATUS_LABELS[statusDialog.status] : ""} Booking`}
        description={
          statusDialog.needsReason
            ? "Please provide a reason for this action."
            : `Are you sure you want to mark this booking as ${statusDialog.status ? BOOKING_STATUS_LABELS[statusDialog.status] : ""}?`
        }
        confirmLabel={statusDialog.status ? BOOKING_STATUS_LABELS[statusDialog.status] : "Confirm"}
        variant={
          statusDialog.status === "CANCELLED" || statusDialog.status === "REJECTED"
            ? "destructive"
            : "default"
        }
        onConfirm={handleStatusChange}
        loading={statusLoading}
      />

      {/* Reason input for status dialog */}
      {statusDialog.open && statusDialog.needsReason && (
        <div className="fixed inset-0 z-40" style={{ pointerEvents: "none" }}>
          {/* The ConfirmDialog handles this - we put the reason in the state */}
        </div>
      )}
    </div>
  );
}
