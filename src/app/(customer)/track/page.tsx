"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/lib/helpers/currency";
import {
  Search,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  User,
  IndianRupee,
  FileText,
  CreditCard,

} from "lucide-react";

interface BookingData {
  bookingId: string;
  status: string;
  travelDate: string;
  pickupLocation: string;
  dropLocation: string;
  pickupTime: string | null;
  totalAmount: string | null;
  paymentStatus: string;
  createdAt: string;
  confirmedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  estimatedDistance: number | null;
  actualDistance: number | null;
  baseFare: string | null;
  tollCharges: string | null;
  parkingCharges: string | null;
  driverAllowance: string | null;
  extraCharges: string | null;
  extraChargesNote: string | null;
  discount: string | null;
  driver: { name: string; phone: string } | null;
  payments: { amount: string; method: string; paymentDate: string; isAdvance: boolean }[];
  invoices: { invoiceNumber: string; grandTotal: string; shareToken: string | null; signedAt: string | null }[];
}

const statusSteps = [
  { key: "PENDING", label: "Submitted", icon: Clock },
  { key: "CONFIRMED", label: "Confirmed", icon: CheckCircle2 },
  { key: "COMPLETED", label: "Completed", icon: CheckCircle2 },
];

const statusOrder = ["PENDING", "CONFIRMED", "COMPLETED"];

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[400px]"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <TrackPageContent />
    </Suspense>
  );
}

function TrackPageContent() {
  const searchParams = useSearchParams();
  const [bookingId, setBookingId] = useState(searchParams.get("bookingId") || "");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [error, setError] = useState("");

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBooking(null);

    if (!bookingId || !phone) {
      setError("Please enter both Booking ID and Phone Number.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: bookingId.trim(), phone: phone.trim() }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Booking not found.");
        return;
      }

      setBooking(result.data);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function getStepStatus(stepKey: string) {
    if (!booking) return "pending";
    if (booking.status === "CANCELLED") {
      if (stepKey === "PENDING") return "completed";
      return "pending";
    }
    const currentIdx = statusOrder.indexOf(booking.status);
    const stepIdx = statusOrder.indexOf(stepKey);
    if (stepIdx < currentIdx) return "completed";
    if (stepIdx === currentIdx) return "current";
    return "pending";
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 md:py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Track Your Booking</h1>
        <p className="text-muted-foreground mt-2">
          Enter your Booking ID and registered phone number to check your
          booking status.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <Label htmlFor="bookingId">Booking ID</Label>
              <Input
                id="bookingId"
                placeholder="e.g., 1"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="e.g., 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              <Search className="mr-2 h-4 w-4" />
              {loading ? "Searching..." : "Track Booking"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {booking && (
        <div className="mt-8 space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Booking Status</CardTitle>
                <StatusBadge status={booking.status} />
              </div>
            </CardHeader>
            <CardContent>
              {booking.status === "CANCELLED" ? (
                <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4">
                  <XCircle className="h-6 w-6 text-red-500" />
                  <div>
                    <p className="font-medium text-red-700">Booking Cancelled</p>
                    {booking.cancellationReason && (
                      <p className="mt-1 text-sm text-red-600">
                        Reason: {booking.cancellationReason}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  {statusSteps.map((step, idx) => {
                    const state = getStepStatus(step.key);
                    return (
                      <div key={step.key} className="flex flex-1 items-center">
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full ${
                              state === "completed"
                                ? "bg-green-500 text-white"
                                : state === "current"
                                  ? "bg-orange-500 text-white"
                                  : "bg-gray-200 text-gray-400"
                            }`}
                          >
                            <step.icon className="h-4 w-4" />
                          </div>
                          <span className="mt-1 text-xs">{step.label}</span>
                        </div>
                        {idx < statusSteps.length - 1 && (
                          <div
                            className={`mx-1 h-0.5 flex-1 ${
                              state === "completed" ? "bg-green-500" : "bg-gray-200"
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trip Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trip Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Calendar className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground">Travel Date:</span>
                  <span className="font-medium">
                    {new Date(booking.travelDate).toLocaleDateString("en-IN")}
                  </span>
                </div>
                {booking.pickupTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="text-muted-foreground h-4 w-4" />
                    <span className="text-muted-foreground">Pickup Time:</span>
                    <span className="font-medium">{booking.pickupTime}</span>
                  </div>
                )}
                {(booking.actualDistance || booking.estimatedDistance) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="text-muted-foreground h-4 w-4" />
                    <span className="text-muted-foreground">Total Distance:</span>
                    <span className="font-medium">
                      {booking.actualDistance ?? booking.estimatedDistance} km
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2 border-t pt-4">
                <div className="flex items-start gap-2">
                  <MapPin className="text-green-500 mt-0.5 h-4 w-4" />
                  <div>
                    <p className="text-muted-foreground text-xs">Pickup</p>
                    <p className="text-sm font-medium">{booking.pickupLocation}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="text-red-500 mt-0.5 h-4 w-4" />
                  <div>
                    <p className="text-muted-foreground text-xs">Drop</p>
                    <p className="text-sm font-medium">{booking.dropLocation}</p>
                  </div>
                </div>
              </div>

              {booking.totalAmount && (
                <div className="mt-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Amount</span>
                    <span className="text-lg font-bold text-orange-500">
                      {formatCurrency(booking.totalAmount)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Payment: <StatusBadge status={booking.paymentStatus} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Driver Info */}
          {booking.driver && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Driver Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-medium">{booking.driver.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{booking.driver.phone}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bill Breakdown */}
          {booking.baseFare && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <IndianRupee className="h-5 w-5" />
                  Bill Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Fare</span>
                  <span>{formatCurrency(booking.baseFare)}</span>
                </div>
                {parseFloat(booking.tollCharges || "0") > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Toll / FastTag</span>
                    <span>{formatCurrency(booking.tollCharges)}</span>
                  </div>
                )}
                {parseFloat(booking.parkingCharges || "0") > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Parking</span>
                    <span>{formatCurrency(booking.parkingCharges)}</span>
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
                    <span className="text-muted-foreground">{booking.extraChargesNote || "Other Charges"}</span>
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
                  <span className="text-orange-500">{formatCurrency(booking.totalAmount)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment History */}
          {booking.payments && booking.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {booking.payments.map((payment, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded border p-3 text-sm">
                      <div>
                        <p className="font-medium">{formatCurrency(payment.amount)}</p>
                        <p className="text-muted-foreground text-xs">
                          {payment.method === "CASH" ? "Cash" : "Online"}
                          {payment.isAdvance && " (Advance)"}
                        </p>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {new Date(payment.paymentDate).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* View Invoice Link */}
          {booking.invoices && booking.invoices.length > 0 && booking.invoices[0].shareToken && (
            <Card>
              <CardContent className="py-4">
                <a
                  href={`/invoice/${booking.invoices[0].shareToken}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  <FileText className="h-4 w-4" />
                  View Invoice / Bill
                </a>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
