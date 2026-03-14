"use client";

import { useEffect, useState, useRef, useCallback, use } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { formatCurrency } from "@/lib/helpers/currency";
import { formatDate } from "@/lib/helpers/date";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  IndianRupee,
  FileText,
  CheckCircle,
  Car,
  Route,
  Users,
  Share2,
  Plus,
  Pencil,
  PenTool,
  RotateCcw,
  Send,
} from "lucide-react";
import { useT } from "@/lib/i18n/language-context";
import { interpolate } from "@/lib/i18n";
import { getStatusLabel, getPaymentMethodLabel } from "@/lib/i18n/label-maps";

interface BookingDetail {
  id: string;
  bookingId: string;
  status: string;
  travelDate: string;
  returnDate: string | null;
  pickupTime: string | null;
  pickupLocation: string;
  pickupAddress: string | null;
  dropLocation: string;
  dropAddress: string | null;
  estimatedDistance: number | null;
  vehicleType: string | null;
  vehiclePreference: string | null;
  passengerCount: number | null;
  specialRequests: string | null;
  tripType: string | null;
  baseFare: string | null;
  taxAmount: string | null;
  tollCharges: string | null;
  parkingCharges: string | null;
  driverAllowance: string | null;
  extraCharges: string | null;
  extraChargesNote: string | null;
  discount: string | null;
  totalAmount: string | null;
  includeGst: boolean;
  paymentStatus: string;
  customer: {
    name: string;
    phone: string;
    email: string | null;
  };
  invoices: {
    id: string;
    invoiceNumber: string;
    status: string;
    grandTotal: string;
    signedAt: string | null;
    shareToken: string | null;
  }[];
  payments: {
    id: string;
    receiptNumber: string;
    amount: string;
    method: string;
    paymentDate: string;
    isAdvance: boolean;
  }[];
}

export default function RideDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useT();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Pricing form
  const [pricingOpen, setPricingOpen] = useState(false);
  const [pricing, setPricing] = useState({
    baseFare: "",
    tollCharges: "0",
    parkingCharges: "0",
    driverAllowance: "0",
    extraCharges: "0",
    extraChargesNote: "",
    discount: "0",
    includeGst: false,
  });
  const [pricingLoading, setPricingLoading] = useState(false);

  // Payment form
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    method: "CASH" as "CASH" | "ONLINE",
    isAdvance: false,
    transactionRef: "",
    notes: "",
  });
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Bill generation & sharing
  const [billLoading, setBillLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  // Signature panel
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [signatureToken, setSignatureToken] = useState<string | null>(null);
  const [signatureInvoiceId, setSignatureInvoiceId] = useState<string | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signing, setSigning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const signatureSectionRef = useRef<HTMLDivElement>(null);

  const fetchBooking = useCallback(async () => {
    try {
      const res = await fetch(`/api/driver/bookings/${id}`);
      const result = await res.json();
      if (result.success) {
        setBooking(result.data);
      } else {
        toast.error(result.error || t.driver.fetchFailed);
      }
    } catch {
      toast.error(t.driver.fetchFailed);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  // Canvas drawing setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !signatureOpen) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    function getPos(e: MouseEvent | Touch) {
      const r = canvas!.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    function startDraw(e: MouseEvent | TouchEvent) {
      isDrawingRef.current = true;
      const pos = e instanceof MouseEvent ? getPos(e) : getPos(e.touches[0]);
      ctx!.beginPath();
      ctx!.moveTo(pos.x, pos.y);
    }

    function draw(e: MouseEvent | TouchEvent) {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      const pos = e instanceof MouseEvent ? getPos(e) : getPos(e.touches[0]);
      ctx!.lineTo(pos.x, pos.y);
      ctx!.stroke();
      setHasDrawn(true);
    }

    function stopDraw() {
      isDrawingRef.current = false;
    }

    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDraw);
    canvas.addEventListener("mouseleave", stopDraw);
    canvas.addEventListener("touchstart", startDraw, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stopDraw);

    return () => {
      canvas.removeEventListener("mousedown", startDraw);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stopDraw);
      canvas.removeEventListener("mouseleave", stopDraw);
      canvas.removeEventListener("touchstart", startDraw);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", stopDraw);
    };
  }, [signatureOpen]);

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }

  // Get share token for an invoice (creates one if needed)
  async function getShareToken(invoiceId: string): Promise<string | null> {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/share`, {
        method: "POST",
      });
      const result = await res.json();
      if (result.success) {
        return result.data.shareToken;
      }
      toast.error(result.error || t.driver.signaturePrepFailed);
      return null;
    } catch {
      toast.error(t.driver.signaturePrepFailed);
      return null;
    }
  }

  async function openSignaturePanel(invoiceId: string, existingToken?: string | null) {
    if (existingToken) {
      setSignatureToken(existingToken);
      setSignatureInvoiceId(invoiceId);
      setSignatureOpen(true);
      setHasDrawn(false);
      setTimeout(() => signatureSectionRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      return;
    }
    // Need to get a share token first
    const token = await getShareToken(invoiceId);
    if (token) {
      setSignatureToken(token);
      setSignatureInvoiceId(invoiceId);
      setSignatureOpen(true);
      setHasDrawn(false);
      await fetchBooking(); // refresh to get the shareToken in invoice data
      setTimeout(() => signatureSectionRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }

  async function handleSubmitSignature() {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn || !signatureToken) return;

    setSigning(true);
    try {
      const signatureData = canvas.toDataURL("image/png");
      const res = await fetch("/api/invoices/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: signatureToken, signatureData }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(t.driver.signatureSuccess);
        setSignatureOpen(false);
        setSignatureToken(null);
        setSignatureInvoiceId(null);
        setHasDrawn(false);
        await fetchBooking();
      } else {
        toast.error(result.error || t.driver.signaturePrepFailed);
      }
    } catch {
      toast.error(t.driver.signaturePrepFailed);
    } finally {
      setSigning(false);
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
          parkingCharges: parseFloat(pricing.parkingCharges) || 0,
          driverAllowance: parseFloat(pricing.driverAllowance) || 0,
          extraCharges: parseFloat(pricing.extraCharges) || 0,
          extraChargesNote: pricing.extraChargesNote || undefined,
          discount: parseFloat(pricing.discount) || 0,
          includeGst: pricing.includeGst,
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(t.driver.pricingSaved);
        await fetchBooking();
        setPricingOpen(false);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error(t.driver.pricingSaved);
    } finally {
      setPricingLoading(false);
    }
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    setPaymentLoading(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: id,
          amount: parseFloat(paymentForm.amount),
          method: paymentForm.method,
          isAdvance: paymentForm.isAdvance,
          transactionRef: paymentForm.transactionRef || undefined,
          notes: paymentForm.notes || undefined,
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(t.driver.paymentRecorded);
        await fetchBooking();
        setPaymentOpen(false);
        setPaymentForm({ amount: "", method: "CASH", isAdvance: false, transactionRef: "", notes: "" });
      } else {
        toast.error(result.error || t.driver.paymentRecorded);
      }
    } catch {
      toast.error(t.driver.paymentRecorded);
    } finally {
      setPaymentLoading(false);
    }
  }

  async function handleGenerateBill() {
    setBillLoading(true);
    try {
      // 1. Create invoice
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: id }),
      });
      const result = await res.json();
      if (!result.success) {
        toast.error(result.error || t.driver.billFailed);
        return;
      }

      const invoiceId = result.data.id;
      toast.success(t.driver.billGenerated);

      // 2. Get share token for signature
      const token = await getShareToken(invoiceId);
      await fetchBooking();

      // 3. Open signature panel
      if (token) {
        setSignatureToken(token);
        setSignatureInvoiceId(invoiceId);
        setSignatureOpen(true);
        setHasDrawn(false);
        setTimeout(() => signatureSectionRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } catch {
      toast.error(t.driver.billFailed);
    } finally {
      setBillLoading(false);
    }
  }

  async function handleShareBill(invoiceId: string) {
    setShareLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/share`, {
        method: "POST",
      });
      const result = await res.json();
      if (result.success) {
        if (result.data.whatsappUrl) {
          window.open(result.data.whatsappUrl, "_blank");
        }
        toast.success(t.driver.shareLinkGenerated);
      } else {
        toast.error(result.error || t.driver.shareFailed);
      }
    } catch {
      toast.error(t.driver.shareFailed);
    } finally {
      setShareLoading(false);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (!booking) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <p className="text-gray-500">{t.driver.rideNotFound}</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/driver">{t.driver.backToRides}</Link>
        </Button>
      </div>
    );
  }

  const hasCharges = Number(booking.baseFare || 0) > 0;
  const latestUnsignedInvoice = booking.invoices.find((inv) => !inv.signedAt);

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
          <Link href="/driver">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold">#{booking.bookingId}</h1>
            <StatusBadge status={booking.status} label={getStatusLabel(t, booking.status)} />
          </div>
        </div>
      </div>

      {/* Trip Details */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Car className="h-4 w-4 text-blue-500" />
            {t.driver.tripDetails}
          </h2>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>{formatDate(booking.travelDate)}</span>
              {booking.pickupTime && (
                <>
                  <Clock className="ml-2 h-4 w-4 text-gray-400" />
                  <span>{booking.pickupTime}</span>
                </>
              )}
            </div>

            {booking.returnDate && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{interpolate(t.driver.returnDate, { date: formatDate(booking.returnDate) })}</span>
              </div>
            )}

            <div className="rounded-lg bg-gray-50 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <div>
                  <p className="text-sm font-medium">{booking.pickupLocation}</p>
                  {booking.pickupAddress && (
                    <p className="text-xs text-gray-500">{booking.pickupAddress}</p>
                  )}
                </div>
              </div>
              <div className="ml-2 border-l-2 border-dashed border-gray-200 h-3" />
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <div>
                  <p className="text-sm font-medium">{booking.dropLocation}</p>
                  {booking.dropAddress && (
                    <p className="text-xs text-gray-500">{booking.dropAddress}</p>
                  )}
                </div>
              </div>
            </div>

            {(booking.estimatedDistance || booking.vehiclePreference || booking.passengerCount) && (
              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                {booking.estimatedDistance && (
                  <span className="flex items-center gap-1">
                    <Route className="h-3.5 w-3.5" />
                    {interpolate(t.driver.distanceKm, { distance: booking.estimatedDistance })}
                  </span>
                )}
                {booking.vehiclePreference && (
                  <span className="flex items-center gap-1">
                    <Car className="h-3.5 w-3.5" />
                    {booking.vehiclePreference}
                  </span>
                )}
                {booking.passengerCount && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {interpolate(t.driver.passengersCount, { count: booking.passengerCount })}
                  </span>
                )}
              </div>
            )}

            {booking.specialRequests && (
              <p className="text-xs text-gray-500 bg-yellow-50 rounded p-2">
                {interpolate(t.driver.noteLabel, { note: booking.specialRequests })}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customer */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <User className="h-4 w-4 text-blue-500" />
            {t.driver.customer}
          </h2>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{booking.customer.name}</p>
            <a
              href={`tel:${booking.customer.phone}`}
              className="flex items-center gap-1 rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 active:bg-green-100"
            >
              <Phone className="h-3.5 w-3.5" />
              {t.driver.call}
            </a>
          </div>
          <p className="text-xs text-gray-500">{booking.customer.phone}</p>
          {booking.customer.email && (
            <p className="text-xs text-gray-500">{booking.customer.email}</p>
          )}
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-blue-500" />
              {t.driver.pricing}
            </h2>
            {hasCharges && !pricingOpen && !booking.invoices?.some((inv) => inv.signedAt) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setPricing({
                    baseFare: booking.baseFare || "",
                    tollCharges: booking.tollCharges || "0",
                    parkingCharges: booking.parkingCharges || "0",
                    driverAllowance: booking.driverAllowance || "0",
                    extraCharges: booking.extraCharges || "0",
                    extraChargesNote: booking.extraChargesNote || "",
                    discount: booking.discount || "0",
                    includeGst: booking.includeGst,
                  });
                  setPricingOpen(true);
                }}
              >
                <Pencil className="mr-1 h-3 w-3" />
                {t.common.edit}
              </Button>
            )}
          </div>

          {pricingOpen ? (
            <form onSubmit={handlePricingSubmit} className="space-y-3">
              <div>
                <Label htmlFor="baseFare" className="text-xs">{t.driver.baseFareRequired}</Label>
                <Input
                  id="baseFare"
                  type="number"
                  step="1"
                  min="0"
                  value={pricing.baseFare}
                  onChange={(e) => setPricing({ ...pricing, baseFare: e.target.value })}
                  required
                  className="mt-1 h-9"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="tollCharges" className="text-xs">{t.driver.fastTagToll}</Label>
                  <Input
                    id="tollCharges"
                    type="number"
                    step="1"
                    min="0"
                    value={pricing.tollCharges}
                    onChange={(e) => setPricing({ ...pricing, tollCharges: e.target.value })}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="parkingCharges" className="text-xs">{t.driver.parking}</Label>
                  <Input
                    id="parkingCharges"
                    type="number"
                    step="1"
                    min="0"
                    value={pricing.parkingCharges}
                    onChange={(e) => setPricing({ ...pricing, parkingCharges: e.target.value })}
                    className="mt-1 h-9"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="driverAllowance" className="text-xs">{t.driver.driverAllowance}</Label>
                  <Input
                    id="driverAllowance"
                    type="number"
                    step="1"
                    min="0"
                    value={pricing.driverAllowance}
                    onChange={(e) => setPricing({ ...pricing, driverAllowance: e.target.value })}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="discount" className="text-xs">{t.driver.discount}</Label>
                  <Input
                    id="discount"
                    type="number"
                    step="1"
                    min="0"
                    value={pricing.discount}
                    onChange={(e) => setPricing({ ...pricing, discount: e.target.value })}
                    className="mt-1 h-9"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="extraChargesNote" className="text-xs">{t.driver.otherChargesName}</Label>
                  <Input
                    id="extraChargesNote"
                    type="text"
                    placeholder={t.driver.otherChargesPlaceholder}
                    value={pricing.extraChargesNote}
                    onChange={(e) => setPricing({ ...pricing, extraChargesNote: e.target.value })}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="extraCharges" className="text-xs">{t.driver.otherCharges}</Label>
                  <Input
                    id="extraCharges"
                    type="number"
                    step="1"
                    min="0"
                    value={pricing.extraCharges}
                    onChange={(e) => setPricing({ ...pricing, extraCharges: e.target.value })}
                    className="mt-1 h-9"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="includeGst"
                  checked={pricing.includeGst}
                  onChange={(e) => setPricing({ ...pricing, includeGst: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 accent-orange-500"
                />
                <Label htmlFor="includeGst" className="text-xs font-normal cursor-pointer">
                  {t.driver.addGst}
                </Label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={pricingLoading} size="sm" className="flex-1">
                  {pricingLoading ? t.common.saving : t.driver.savePricing}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPricingOpen(false)}
                >
                  {t.common.cancel}
                </Button>
              </div>
            </form>
          ) : hasCharges ? (
            <div className="space-y-1.5 text-sm">
              <Row label={t.driver.baseFare} value={booking.baseFare} />
              {booking.includeGst && Number(booking.taxAmount || 0) > 0 && (
                <Row label={t.driver.gst} value={booking.taxAmount} />
              )}
              {Number(booking.tollCharges || 0) > 0 && (
                <Row label={t.driver.fastTagToll} value={booking.tollCharges} />
              )}
              {Number(booking.parkingCharges || 0) > 0 && (
                <Row label={t.driver.parking} value={booking.parkingCharges} />
              )}
              {Number(booking.driverAllowance || 0) > 0 && (
                <Row label={t.driver.driverAllowance} value={booking.driverAllowance} />
              )}
              {Number(booking.extraCharges || 0) > 0 && (
                <Row
                  label={booking.extraChargesNote || t.driver.otherCharges}
                  value={booking.extraCharges}
                />
              )}
              {Number(booking.discount || 0) > 0 && (
                <Row label={t.driver.discount} value={`-${booking.discount}`} isDiscount />
              )}
              <div className="border-t pt-2 flex items-center justify-between font-semibold">
                <span>{t.driver.total}</span>
                <span>{formatCurrency(booking.totalAmount || "0")}</span>
              </div>
            </div>
          ) : (
            <div className="py-3 text-center">
              <p className="text-xs text-gray-500 mb-2">{t.driver.noPricingAssigned}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPricingOpen(true)}
              >
                <Plus className="mr-1 h-3 w-3" />
                {t.driver.assignPricing}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bill */}
      {hasCharges && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                {t.driver.bill}
              </h2>
              {!booking.invoices?.some((inv) => inv.signedAt) ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleGenerateBill}
                  disabled={billLoading}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  {billLoading ? t.common.generating : t.driver.generateBill}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => window.open(`/api/invoices/${booking.invoices.find((inv) => inv.signedAt)!.id}/pdf`, "_blank")}
                >
                  <FileText className="mr-1 h-3 w-3" />
                  {t.driver.downloadBill}
                </Button>
              )}
            </div>

            {booking.invoices.length > 0 ? (
              <div className="space-y-2">
                {booking.invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="rounded-lg bg-gray-50 p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{inv.invoiceNumber}</span>
                        <StatusBadge status={inv.status} label={getStatusLabel(t, inv.status)} />
                        {inv.signedAt && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-800">
                            <CheckCircle className="h-2.5 w-2.5" />
                            {t.common.signed}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(inv.grandTotal)}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs flex-1"
                        onClick={() => window.open(`/api/invoices/${inv.id}/pdf`, "_blank")}
                      >
                        <FileText className="mr-1 h-3 w-3" />
                        {t.driver.viewPdf}
                      </Button>
                      {!inv.signedAt ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs flex-1"
                          onClick={() => openSignaturePanel(inv.id, inv.shareToken)}
                        >
                          <PenTool className="mr-1 h-3 w-3" />
                          {t.driver.getSignature}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs flex-1"
                          onClick={() => handleShareBill(inv.id)}
                          disabled={shareLoading}
                        >
                          <Share2 className="mr-1 h-3 w-3" />
                          {t.driver.share}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 text-center py-2">{t.driver.noBillsGenerated}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Signature Panel */}
      {signatureOpen && (
        <div ref={signatureSectionRef}>
          <Card className="border-orange-200 bg-orange-50/30">
            <CardContent className="p-4 space-y-3">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <PenTool className="h-4 w-4 text-orange-500" />
                {t.driver.customerSignature}
              </h2>
              <p className="text-xs text-gray-500">
                {t.driver.signatureInstructions}
              </p>
              <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white">
                <canvas
                  ref={canvasRef}
                  className="h-40 w-full cursor-crosshair touch-none"
                  style={{ touchAction: "none" }}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCanvas}
                  disabled={!hasDrawn}
                >
                  <RotateCcw className="mr-1 h-3 w-3" />
                  {t.common.clear}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitSignature}
                  disabled={!hasDrawn || signing}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                >
                  <Send className="mr-1 h-3 w-3" />
                  {signing ? t.common.submitting : t.driver.submitSignature}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSignatureOpen(false);
                    setSignatureToken(null);
                    setSignatureInvoiceId(null);
                    setHasDrawn(false);
                  }}
                >
                  {t.common.cancel}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Section */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-blue-500" />
              {t.driver.paymentsSection}
            </h2>
            <div className="flex items-center gap-2">
              <StatusBadge status={booking.paymentStatus} label={getStatusLabel(t, booking.paymentStatus)} />
              {hasCharges && booking.paymentStatus !== "PAID" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    const totalPaid = booking.payments.reduce(
                      (sum, p) => sum + parseFloat(p.amount),
                      0
                    );
                    const remaining = Math.max(
                      0,
                      parseFloat(booking.totalAmount || "0") - totalPaid
                    );
                    setPaymentForm({
                      amount: remaining > 0 ? remaining.toString() : "",
                      method: "CASH",
                      isAdvance: false,
                      transactionRef: "",
                      notes: "",
                    });
                    setPaymentOpen(!paymentOpen);
                  }}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  {t.common.record}
                </Button>
              )}
            </div>
          </div>

          {paymentOpen && (
            <form onSubmit={handleRecordPayment} className="space-y-3 rounded-lg border p-3">
              <div>
                <Label htmlFor="payAmount" className="text-xs">{t.driver.amountRequired}</Label>
                <Input
                  id="payAmount"
                  type="number"
                  step="1"
                  min="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  required
                  className="mt-1 h-9"
                />
              </div>
              <div>
                <Label htmlFor="payMethod" className="text-xs">{t.driver.methodRequired}</Label>
                <Select
                  value={paymentForm.method}
                  onValueChange={(v) =>
                    setPaymentForm({ ...paymentForm, method: v as "CASH" | "ONLINE" })
                  }
                >
                  <SelectTrigger className="mt-1 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">{t.paymentMethods.cash}</SelectItem>
                    <SelectItem value="ONLINE">{t.paymentMethods.online}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {paymentForm.method === "ONLINE" && (
                <div>
                  <Label htmlFor="transactionRef" className="text-xs">{t.driver.transactionRef}</Label>
                  <Input
                    id="transactionRef"
                    type="text"
                    placeholder={t.driver.transactionRefPlaceholder}
                    value={paymentForm.transactionRef}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, transactionRef: e.target.value })
                    }
                    className="mt-1 h-9"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isAdvance"
                  checked={paymentForm.isAdvance}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, isAdvance: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 accent-orange-500"
                />
                <Label htmlFor="isAdvance" className="cursor-pointer text-xs font-normal">
                  {t.driver.advancePayment}
                </Label>
              </div>
              <div>
                <Label htmlFor="payNotes" className="text-xs">{t.driver.notes}</Label>
                <Input
                  id="payNotes"
                  type="text"
                  placeholder={t.driver.notesPlaceholder}
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="mt-1 h-9"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={paymentLoading} className="flex-1">
                  {paymentLoading ? t.common.saving : t.driver.savePayment}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentOpen(false)}
                >
                  {t.common.cancel}
                </Button>
              </div>
            </form>
          )}

          {booking.payments.length > 0 ? (
            <div className="space-y-2">
              {booking.payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {formatCurrency(p.amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getPaymentMethodLabel(t, p.method)}
                      {p.isAdvance && ` (${t.common.advance})`}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDate(p.paymentDate)}
                  </span>
                </div>
              ))}
            </div>
          ) : !paymentOpen ? (
            <p className="text-xs text-gray-500 text-center py-2">{t.driver.noPaymentsRecorded}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
  isDiscount,
}: {
  label: string;
  value: string | null;
  isDiscount?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={isDiscount ? "text-green-600" : ""}>
        {isDiscount ? `- ${formatCurrency(value.replace("-", ""))}` : formatCurrency(value)}
      </span>
    </div>
  );
}
