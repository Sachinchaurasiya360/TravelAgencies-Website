"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { formatCurrency } from "@/lib/helpers/currency";
import { formatDateTime } from "@/lib/helpers/date";
import {
  ALLOWED_STATUS_TRANSITIONS,
  BOOKING_STATUS_LABELS,
} from "@/lib/constants";
import {
  ArrowLeft,
  MapPin,
  IndianRupee,
  FileText,
  Share2,
  UserCheck,
  AlertTriangle,
  Car,
  Link2,
  Truck,
  CheckCircle,
  ClipboardList,
  Gauge,
  Pencil,
  Save,
  X,
} from "lucide-react";
import Link from "next/link";
import type { BOOKING_STATUSES } from "@/lib/constants";
import { useT } from "@/lib/i18n/language-context";
import { interpolate } from "@/lib/i18n";
import { getStatusLabel, getPaymentMethodLabel } from "@/lib/i18n/label-maps";
import { downloadInvoicePdf } from "@/lib/helpers/download-pdf";

type BookingStatus = (typeof BOOKING_STATUSES)[number];

interface BookingDetail {
  id: string;
  bookingId: string;
  status: BookingStatus;
  travelDate: string;
  pickupLocation: string;
  dropLocation: string;
  pickupTime: string | null;
  baseFare: string | null;
  tollCharges: string | null;
  parkingCharges: string | null;
  driverAllowance: string | null;
  extraCharges: string | null;
  extraChargesNote: string | null;
  discount: string | null;
  totalAmount: string | null;
  actualDistance: number | null;
  startKm: number | null;
  endKm: number | null;
  startDateTime: string | null;
  endDateTime: string | null;
  paymentStatus: string;
  paymentDueDate: string | null;
  adminRemarks: string | null;
  cancellationReason: string | null;
  createdAt: string;
  customer: { id: string; name: string; phone: string; email: string | null };
  driver: { id: string; name: string; phone: string; vehicleName?: string | null; vehicleNumber?: string | null } | null;
  driverAccessToken: string | null;
  carSource: "OWN_CAR" | "VENDOR_CAR";
  vendorId: string | null;
  vendor: { id: string; name: string; phone: string } | null;
  vendorCost: string | null;
  dutySlip: {
    id: string;
    status: string;
    guestName: string;
    vehicleName: string | null;
    vehicleNumber: string | null;
    officeStartKm: number | null;
    officeStartDateTime: string | null;
    customerPickupKm: number | null;
    customerPickupDateTime: string | null;
    customerDropKm: number | null;
    customerDropDateTime: string | null;
    customerEndKm: number | null;
    customerEndDateTime: string | null;
    tollAmount: string | null;
    parkingAmount: string | null;
    otherChargeName: string | null;
    otherChargeAmount: string | null;
    signatureData: string | null;
    signedAt: string | null;
    submittedAt: string | null;
  } | null;
  invoices: { id: string; invoiceNumber: string; grandTotal: string; status: string; shareToken: string | null; signedAt: string | null }[];
  notes: { id: string; content: string; createdAt: string; user: { name: string } }[];
  payments: { id: string; amount: string; method: string; paymentDate: string; isAdvance: boolean }[];
}

interface VendorOption {
  id: string;
  name: string;
  phone: string;
}

interface DriverOption {
  id: string;
  name: string;
  phone: string;
}

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const t = useT();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Pricing form
  const [pricingOpen, setPricingOpen] = useState(false);
  const [pricing, setPricing] = useState({
    baseFare: "",
    tollCharges: "",
    parkingCharges: "",
    driverAllowance: "",
    extraCharges: "",
    extraChargesNote: "",
    discount: "",
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



  // Payment recording
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    method: "CASH" as "CASH" | "ONLINE",
    isAdvance: false,
    transactionRef: "",
    notes: "",
  });
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Generate Bill
  const [billLoading, setBillLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  // Driver assignment
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [driverLoading, setDriverLoading] = useState(false);
  const [showDriverSelect, setShowDriverSelect] = useState(false);
  const [showVendorEdit, setShowVendorEdit] = useState(false);
  const [driverLinkLoading, setDriverLinkLoading] = useState(false);

  // Car source & Vendor
  const [carSource, setCarSource] = useState<"OWN_CAR" | "VENDOR_CAR">("OWN_CAR");
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [vendorCost, setVendorCost] = useState("");
  const [vendorLoading, setVendorLoading] = useState(false);

  // Duty slip editing
  const [dsEditing, setDsEditing] = useState(false);
  const [dsForm, setDsForm] = useState({
    officeStartKm: "",
    customerPickupKm: "",
    customerPickupDateTime: "",
    customerDropKm: "",
    customerDropDateTime: "",
    customerEndKm: "",
    tollAmount: "",
    parkingAmount: "",
    otherChargeName: "",
    otherChargeAmount: "",
  });
  const [dsSaving, setDsSaving] = useState(false);

  function startDsEdit() {
    if (!booking?.dutySlip) return;
    const ds = booking.dutySlip;
    setDsForm({
      officeStartKm: ds.officeStartKm != null ? String(ds.officeStartKm) : "",
      customerPickupKm: ds.customerPickupKm != null ? String(ds.customerPickupKm) : "",
      customerPickupDateTime: ds.customerPickupDateTime || "",
      customerDropKm: ds.customerDropKm != null ? String(ds.customerDropKm) : "",
      customerDropDateTime: ds.customerDropDateTime || "",
      customerEndKm: ds.customerEndKm != null ? String(ds.customerEndKm) : "",
      tollAmount: ds.tollAmount != null && Number(ds.tollAmount) > 0 ? String(ds.tollAmount) : "",
      parkingAmount: ds.parkingAmount != null && Number(ds.parkingAmount) > 0 ? String(ds.parkingAmount) : "",
      otherChargeName: ds.otherChargeName || "",
      otherChargeAmount: ds.otherChargeAmount != null && Number(ds.otherChargeAmount) > 0 ? String(ds.otherChargeAmount) : "",
    });
    setDsEditing(true);
  }

  async function saveDsEdit() {
    if (!booking?.dutySlip) return;
    setDsSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (dsForm.officeStartKm !== "") body.officeStartKm = Number(dsForm.officeStartKm);
      if (dsForm.customerPickupKm !== "") body.customerPickupKm = Number(dsForm.customerPickupKm);
      body.customerPickupDateTime = dsForm.customerPickupDateTime || undefined;
      if (dsForm.customerDropKm !== "") body.customerDropKm = Number(dsForm.customerDropKm);
      body.customerDropDateTime = dsForm.customerDropDateTime || undefined;
      if (dsForm.customerEndKm !== "") body.customerEndKm = Number(dsForm.customerEndKm);
      if (dsForm.tollAmount !== "") body.tollAmount = Number(dsForm.tollAmount);
      if (dsForm.parkingAmount !== "") body.parkingAmount = Number(dsForm.parkingAmount);
      if (dsForm.otherChargeName) body.otherChargeName = dsForm.otherChargeName;
      if (dsForm.otherChargeAmount !== "") body.otherChargeAmount = Number(dsForm.otherChargeAmount);

      const res = await fetch(`/api/duty-slips/${booking.dutySlip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(t.dutySlip.editSuccess);
        setDsEditing(false);
        fetchBooking();
      } else {
        toast.error(result.error || t.dutySlip.editFailed);
      }
    } catch {
      toast.error(t.dutySlip.editFailed);
    } finally {
      setDsSaving(false);
    }
  }

  async function fetchBooking() {
    try {
      const res = await fetch(`/api/bookings/${id}`);
      const result = await res.json();
      if (result.success) {
        setBooking(result.data);
      } else {
        toast.error(t.bookingDetail.notFound);
        router.push("/admin/bookings");
      }
    } catch {
      toast.error(t.bookingDetail.fetchFailed);
    }
  }

  async function fetchDrivers() {
    try {
      const res = await fetch("/api/drivers?isActive=true&limit=100");
      const result = await res.json();
      if (result.success) {
        setDrivers(result.data.drivers || []);
      }
    } catch {
      /* ignore */
    }
  }

  async function fetchVendors() {
    try {
      const res = await fetch("/api/vendors?isActive=true&limit=100");
      const result = await res.json();
      if (result.success) {
        setVendors(result.data.vendors || []);
      }
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      await Promise.all([fetchBooking(), fetchDrivers(), fetchVendors()]);
      setLoading(false);
    }
    loadData();
  }, [id]);

  function buildConfirmationMessage() {
    if (!booking) return "";
    const travelDate = new Date(booking.travelDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "2-digit",
      year: "numeric",
    });
    const vehicle = [booking.driver?.vehicleName, booking.driver?.vehicleNumber].filter(Boolean).join(" ") || "";
    const fare = Number(booking.baseFare || 0);
    const parking = Number(booking.parkingCharges || 0);
    const toll = Number(booking.tollCharges || 0);
    const driverAllowance = Number(booking.driverAllowance || 0);
    const extra = Number(booking.extraCharges || 0);
    const discount = Number(booking.discount || 0);
    const total = Number(booking.totalAmount || 0);

    let msg = `Your Booking for ${booking.pickupLocation} To ${booking.dropLocation} on ${travelDate} is confirmed`;
    if (vehicle) msg += ` with ${vehicle}`;
    msg += `\n`;
    if (booking.pickupTime) msg += `\nPickup Time - ${booking.pickupTime}\n`;

    if (fare > 0) msg += `\nFare: Rs ${fare.toFixed(2)}`;
    if (parking > 0) msg += `\nParking- ${parking.toFixed(0)}`;
    if (toll > 0) msg += `\nToll- ${toll.toFixed(0)}`;
    if (driverAllowance > 0) msg += `\nDriver Allowance- ${driverAllowance.toFixed(0)}`;
    if (extra > 0) msg += `\n${booking.extraChargesNote || "Other Charges"}- ${extra.toFixed(0)}`;
    if (discount > 0) msg += `\nDiscount- ${discount.toFixed(0)}`;
    if (total > 0) msg += `\nTotal Fare - ${total.toFixed(0)}`;

    msg += `\n\nDrop Address - ${booking.dropLocation}`;
    msg += `\n\nBooking & Office Contact No: 7498125466 , 9527806257.`;
    msg += `\nOffice Locations- https://maps.app.goo.gl/FXW3xSEyYHFGczPs7?g_st=com.google.maps.preview.copy`;

    return msg;
  }

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
        if (statusDialog.status === "CONFIRMED" && booking) {
          const message = buildConfirmationMessage();
          const phone = booking.customer.phone.replace(/\D/g, "");
          const fullPhone = phone.startsWith("91") ? phone : `91${phone}`;
          const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
          window.open(url, "_blank");
        } else if (result.data?.whatsappUrl) {
          window.open(result.data.whatsappUrl, "_blank");
        }
        toast.success(interpolate(t.bookingDetail.statusUpdated, { status: getStatusLabel(t, statusDialog.status) }));
        await fetchBooking();
        setStatusDialog({ open: false, status: null, needsReason: false });
        setReason("");
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error(t.bookingDetail.statusUpdateFailed);
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
          parkingCharges: parseFloat(pricing.parkingCharges) || 0,
          driverAllowance: parseFloat(pricing.driverAllowance) || 0,
          extraCharges: parseFloat(pricing.extraCharges) || 0,
          extraChargesNote: pricing.extraChargesNote || undefined,
          discount: parseFloat(pricing.discount) || 0,
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(t.bookingDetail.pricingSaved);
        await fetchBooking();
        setPricingOpen(false);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error(t.bookingDetail.pricingFailed);
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
        toast.success(t.bookingDetail.paymentRecorded);
        await fetchBooking();
        setPaymentOpen(false);
        setPaymentForm({ amount: "", method: "CASH", isAdvance: false, transactionRef: "", notes: "" });
      } else {
        toast.error(result.error || t.bookingDetail.paymentFailed);
      }
    } catch {
      toast.error(t.bookingDetail.paymentFailed);
    } finally {
      setPaymentLoading(false);
    }
  }

  async function handleGenerateBill() {
    setBillLoading(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: id }),
      });
      const result = await res.json();
      if (result.success) {
        const invoiceId = result.data.id;
        const invoiceNumber = result.data.invoiceNumber;
        await downloadInvoicePdf(invoiceId, invoiceNumber);
        toast.success(t.bookingDetail.billGenerated);
        fetchBooking();
      } else {
        toast.error(result.error || t.bookingDetail.billFailed);
      }
    } catch {
      toast.error(t.bookingDetail.billFailed);
    } finally {
      setBillLoading(false);
    }
  }

  async function handleDownloadBill(invoiceId: string, invoiceNumber?: string) {
    setDownloadLoading(true);
    try {
      await downloadInvoicePdf(invoiceId, invoiceNumber);
    } catch {
      toast.error(t.bookingDetail.billFailed);
    } finally {
      setDownloadLoading(false);
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
        toast.success(t.bookingDetail.shareSent);
      } else {
        toast.error(result.error || t.bookingDetail.shareFailed);
      }
    } catch {
      toast.error(t.bookingDetail.shareFailed);
    } finally {
      setShareLoading(false);
    }
  }

  async function handleAssignDriver() {
    if (!selectedDriverId) return;
    setDriverLoading(true);
    try {
      const res = await fetch(`/api/bookings/${id}/assign-driver`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId: selectedDriverId }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(t.bookingDetail.driverAssigned);
        await fetchBooking();
        setShowDriverSelect(false);
        setSelectedDriverId("");
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error(t.bookingDetail.driverFailed);
    } finally {
      setDriverLoading(false);
    }
  }

  async function handleCopyDriverLink() {
    setDriverLinkLoading(true);
    try {
      const res = await fetch(`/api/bookings/${id}/driver-link`, { method: "POST" });
      const result = await res.json();
      if (result.success) {
        await navigator.clipboard.writeText(result.data.driverUrl);
        toast.success(t.bookingDetail.driverLinkCopied);
      } else {
        toast.error(result.error || t.bookingDetail.driverLinkFailed);
      }
    } catch {
      toast.error(t.bookingDetail.driverLinkFailed);
    } finally {
      setDriverLinkLoading(false);
    }
  }

  async function handleCarSourceChange(source: "OWN_CAR" | "VENDOR_CAR") {
    setCarSource(source);
    if (source === "OWN_CAR") {
      setVendorLoading(true);
      try {
        const res = await fetch(`/api/bookings/${id}/car-source`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ carSource: "OWN_CAR" }),
        });
        const result = await res.json();
        if (result.success) {
          toast.success(t.bookingDetail.carSourceUpdated);
          await fetchBooking();
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error(t.bookingDetail.vendorAssignFailed);
      } finally {
        setVendorLoading(false);
      }
    }
  }

  async function handleAssignVendor() {
    if (!selectedVendorId) return;
    setVendorLoading(true);
    try {
      const res = await fetch(`/api/bookings/${id}/car-source`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carSource: "VENDOR_CAR",
          vendorId: selectedVendorId,
          vendorCost: vendorCost ? parseFloat(vendorCost) : null,
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(t.bookingDetail.vendorAssigned);
        await fetchBooking();
      } else {
        toast.error(result.error || t.bookingDetail.vendorAssignFailed);
      }
    } catch {
      toast.error(t.bookingDetail.vendorAssignFailed);
    } finally {
      setVendorLoading(false);
    }
  }

  // Sync car source state when booking loads
  useEffect(() => {
    if (booking) {
      setCarSource(booking.carSource || "OWN_CAR");
      setSelectedVendorId(booking.vendorId || "");
      setVendorCost(booking.vendorCost || "");
    }
  }, [booking]);

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
            <h1 className="text-2xl font-bold">Booking #{booking.bookingId}</h1>
            <StatusBadge status={booking.status} label={getStatusLabel(t, booking.status)} />
          </div>
          <p className="text-muted-foreground text-sm">
            {interpolate(t.bookingDetail.createdAt, { date: formatDateTime(booking.createdAt) })}
          </p>
        </div>
      </div>

      {/* Actions */}
      {(allowedTransitions.length > 0 || booking.baseFare || !booking.baseFare) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.bookingDetail.actions}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {allowedTransitions.map((status) => {
              const needsReason = status === "CANCELLED";
              const variant =
                status === "CONFIRMED"
                  ? "default"
                  : status === "CANCELLED"
                    ? "destructive"
                    : "outline";
              return (
                <Button
                  key={status}
                  variant={variant as "default" | "destructive" | "outline"}
                  onClick={() => {
                    setStatusDialog({ open: true, status, needsReason });
                  }}
                >
                  {getStatusLabel(t, status)}
                </Button>
              );
            })}
            {!booking.baseFare && (
              <Button
                variant="outline"
                onClick={() => setPricingOpen(!pricingOpen)}
              >
                <IndianRupee className="mr-2 h-4 w-4" />
                {t.bookingDetail.assignPricing}
              </Button>
            )}
            {booking.baseFare && (() => {
              const latestInvoice = booking.invoices?.[0];
              const isSigned = latestInvoice?.signedAt;

              if (isSigned) {
                // Bill is signed — show "Bill Generated" badge + Download + Share
                return (
                  <>
                    <Button
                      variant="outline"
                      className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                      disabled
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {t.bookingDetail.billGenerated}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDownloadBill(latestInvoice.id, latestInvoice.invoiceNumber)}
                      disabled={downloadLoading}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      {downloadLoading ? t.common.processing : t.bookingDetail.downloadBill}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleShareBill(latestInvoice.id)}
                      disabled={shareLoading}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      {shareLoading ? t.common.processing : t.bookingDetail.shareBill}
                    </Button>
                  </>
                );
              }

              if (latestInvoice) {
                // Invoice exists but not signed — show Generate (updates), Download, Share
                return (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleGenerateBill}
                      disabled={billLoading}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      {billLoading ? t.common.generating : t.bookingDetail.generateBill}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleShareBill(latestInvoice.id)}
                      disabled={shareLoading}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      {shareLoading ? t.common.processing : t.bookingDetail.shareBill}
                    </Button>
                  </>
                );
              }

              // No invoice yet — show Generate Bill
              return (
                <Button
                  variant="outline"
                  onClick={handleGenerateBill}
                  disabled={billLoading}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {billLoading ? t.common.generating : t.bookingDetail.generateBill}
                </Button>
              );
            })()}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trip Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.bookingDetail.tripDetails}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">{t.bookingDetail.travelDate}</p>
                <p className="font-medium">
                  {new Date(booking.travelDate).toLocaleDateString("en-IN")}
                </p>
              </div>
              {booking.pickupTime && (
                <div>
                  <p className="text-muted-foreground">{t.bookingDetail.pickupTime}</p>
                  <p className="font-medium">
                    {new Date(`1970-01-01T${booking.pickupTime}`).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2 border-t pt-4">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-green-500" />
                <div>
                  <p className="text-muted-foreground text-xs">{t.bookingDetail.pickup}</p>
                  <p className="text-sm font-medium">{booking.pickupLocation}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-red-500" />
                <div>
                  <p className="text-muted-foreground text-xs">{t.bookingDetail.drop}</p>
                  <p className="text-sm font-medium">{booking.dropLocation}</p>
                </div>
              </div>
            </div>

            {(booking.startKm != null || booking.endKm != null || booking.startDateTime || booking.endDateTime) && (
              <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                {booking.startKm != null && (
                  <div>
                    <p className="text-muted-foreground">{t.bookingDetail.startKm}</p>
                    <p className="font-medium">{booking.startKm} km</p>
                  </div>
                )}
                {booking.endKm != null && (
                  <div>
                    <p className="text-muted-foreground">{t.bookingDetail.endKm}</p>
                    <p className="font-medium">{booking.endKm} km</p>
                  </div>
                )}
                {booking.startDateTime && (
                  <div>
                    <p className="text-muted-foreground">{t.bookingDetail.startDateTime}</p>
                    <p className="font-medium">{formatDateTime(booking.startDateTime)}</p>
                  </div>
                )}
                {booking.endDateTime && (
                  <div>
                    <p className="text-muted-foreground">{t.bookingDetail.endDateTime}</p>
                    <p className="font-medium">{formatDateTime(booking.endDateTime)}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.bookingDetail.customer}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">{t.bookingDetail.name}</p>
              <p className="font-medium">{booking.customer.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t.bookingDetail.phone}</p>
              <p className="font-medium">{booking.customer.phone}</p>
            </div>
            {booking.customer.email && (
              <div>
                <p className="text-muted-foreground">{t.bookingDetail.email}</p>
                <p className="font-medium">{booking.customer.email}</p>
              </div>
            )}
            <Button variant="outline" size="sm" asChild className="mt-2">
              <Link href={`/admin/customers/${booking.customer.id}`}>
                {t.bookingDetail.viewCustomer}
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Car Source & Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Car className="h-5 w-5" />
              {t.bookingDetail.carSource}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Radio toggle */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="carSource"
                  value="OWN_CAR"
                  checked={carSource === "OWN_CAR"}
                  onChange={() => handleCarSourceChange("OWN_CAR")}
                  className="h-4 w-4 accent-blue-600"
                />
                <span className="text-sm font-medium">{t.bookingDetail.ownCar}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="carSource"
                  value="VENDOR_CAR"
                  checked={carSource === "VENDOR_CAR"}
                  onChange={() => handleCarSourceChange("VENDOR_CAR")}
                  className="h-4 w-4 accent-blue-600"
                />
                <span className="text-sm font-medium">{t.bookingDetail.vendorCar}</span>
              </label>
            </div>

            {/* VENDOR_CAR: Vendor selection */}
            {carSource === "VENDOR_CAR" && (
              <div className="space-y-3">
                {booking.vendor && !showVendorEdit ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm rounded-lg bg-gray-50 p-3">
                      <Truck className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">{booking.vendor.name}</span>
                      <span className="text-muted-foreground">({booking.vendor.phone})</span>
                      {booking.vendorCost && (
                        <span className="ml-auto text-sm font-medium text-blue-600">
                          {formatCurrency(booking.vendorCost)}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowVendorEdit(true);
                          setSelectedVendorId(booking.vendorId || "");
                          setVendorCost(booking.vendorCost?.toString() || "");
                        }}
                      >
                        {t.common.edit}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyDriverLink}
                        disabled={driverLinkLoading}
                      >
                        <Link2 className="mr-1 h-3 w-3" />
                        {driverLinkLoading ? t.common.processing : t.bookingDetail.copyDriverLink}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                      <SelectTrigger>
                        <SelectValue placeholder={t.bookingDetail.selectVendor} />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.length === 0 ? (
                          <SelectItem value="_none" disabled>
                            No vendors available
                          </SelectItem>
                        ) : (
                          vendors.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.name} ({v.phone})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <div>
                      <Label className="text-sm">{t.bookingDetail.vendorCostLabel}</Label>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        placeholder="0"
                        value={vendorCost}
                        onChange={(e) => setVendorCost(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={async () => {
                          await handleAssignVendor();
                          setShowVendorEdit(false);
                        }}
                        disabled={!selectedVendorId || vendorLoading}
                      >
                        {vendorLoading ? t.common.saving : t.bookingDetail.saveVendorAssignment}
                      </Button>
                      {booking.vendor && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowVendorEdit(false)}
                        >
                          {t.common.cancel}
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Driver assignment (OWN_CAR only) */}
            {carSource === "OWN_CAR" && <div>
              {booking.driver ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{booking.driver.name}</span>
                    <span className="text-muted-foreground">({booking.driver.phone})</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowDriverSelect(true);
                        setSelectedDriverId("");
                      }}
                    >
                      {t.bookingDetail.changeDriver}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyDriverLink}
                      disabled={driverLinkLoading}
                    >
                      <Link2 className="mr-1 h-3 w-3" />
                      {driverLinkLoading ? t.common.processing : t.bookingDetail.copyDriverLink}
                    </Button>
                  </div>
                </div>
              ) : !showDriverSelect ? (
                <div className="text-muted-foreground py-4 text-center text-sm">
                  {t.bookingDetail.noDriverAssigned}
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setShowDriverSelect(true)}
                  >
                    {t.bookingDetail.assignDriver}
                  </Button>
                </div>
              ) : null}
              {showDriverSelect && (
                <div className="space-y-3">
                  <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t.bookingDetail.selectDriver} />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.length === 0 ? (
                        <SelectItem value="_none" disabled>
                          {t.bookingDetail.noDriversAvailable}
                        </SelectItem>
                      ) : (
                        drivers.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name} ({d.phone})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleAssignDriver}
                      disabled={!selectedDriverId || driverLoading}
                    >
                      {driverLoading ? t.bookingDetail.assigning : t.common.assign}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowDriverSelect(false)}
                    >
                      {t.common.cancel}
                    </Button>
                  </div>
                </div>
              )}
            </div>}
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.bookingDetail.pricing}</CardTitle>
          </CardHeader>
          <CardContent>
            {booking.baseFare && !pricingOpen ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.bookingDetail.baseFare}</span>
                  <span>{formatCurrency(booking.baseFare)}</span>
                </div>
                {parseFloat(booking.tollCharges || "0") > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.bookingDetail.fastTagToll}</span>
                    <span>{formatCurrency(booking.tollCharges)}</span>
                  </div>
                )}
                {parseFloat(booking.parkingCharges || "0") > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.bookingDetail.parking}</span>
                    <span>{formatCurrency(booking.parkingCharges)}</span>
                  </div>
                )}
                {parseFloat(booking.driverAllowance || "0") > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.bookingDetail.driverAllowance}</span>
                    <span>{formatCurrency(booking.driverAllowance)}</span>
                  </div>
                )}
                {parseFloat(booking.extraCharges || "0") > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {booking.extraChargesNote || t.bookingDetail.otherCharges}
                    </span>
                    <span>{formatCurrency(booking.extraCharges)}</span>
                  </div>
                )}
                {parseFloat(booking.discount || "0") > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>{t.bookingDetail.discount}</span>
                    <span>-{formatCurrency(booking.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 font-bold">
                  <span>{t.common.total}</span>
                  <span className="text-blue-600">{formatCurrency(booking.totalAmount)}</span>
                </div>
                {/* Admin can always edit pricing */}
                <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => {
                      setPricing({
                        baseFare: booking.baseFare || "",
                        tollCharges: parseFloat(booking.tollCharges || "0") > 0 ? booking.tollCharges! : "",
                        parkingCharges: parseFloat(booking.parkingCharges || "0") > 0 ? booking.parkingCharges! : "",
                        driverAllowance: parseFloat(booking.driverAllowance || "0") > 0 ? booking.driverAllowance! : "",
                        extraCharges: parseFloat(booking.extraCharges || "0") > 0 ? booking.extraCharges! : "",
                        extraChargesNote: booking.extraChargesNote || "",
                        discount: parseFloat(booking.discount || "0") > 0 ? booking.discount! : "",
                      });
                      setPricingOpen(true);
                    }}
                  >
                    <IndianRupee className="mr-2 h-4 w-4" />
                    {t.bookingDetail.editPricing}
                  </Button>
              </div>
            ) : pricingOpen ? (
              <form onSubmit={handlePricingSubmit} className="space-y-3">
                <div>
                  <Label htmlFor="baseFare">{t.bookingDetail.baseFareRequired}</Label>
                  <Input
                    id="baseFare"
                    type="number"
                    step="1"
                    min="0"
                    value={pricing.baseFare}
                    onChange={(e) => setPricing({ ...pricing, baseFare: e.target.value })}
                    required
                    className="mt-1"
                    placeholder="Enter base fare"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="tollCharges">{t.bookingDetail.fastTagToll}</Label>
                    <Input
                      id="tollCharges"
                      type="number"
                      step="1"
                      min="0"
                      value={pricing.tollCharges}
                      onChange={(e) => setPricing({ ...pricing, tollCharges: e.target.value })}
                      className="mt-1"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="parkingCharges">{t.bookingDetail.parking}</Label>
                    <Input
                      id="parkingCharges"
                      type="number"
                      step="1"
                      min="0"
                      value={pricing.parkingCharges}
                      onChange={(e) => setPricing({ ...pricing, parkingCharges: e.target.value })}
                      className="mt-1"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="driverAllowance">{t.bookingDetail.driverAllowance}</Label>
                    <Input
                      id="driverAllowance"
                      type="number"
                      step="1"
                      min="0"
                      value={pricing.driverAllowance}
                      onChange={(e) => setPricing({ ...pricing, driverAllowance: e.target.value })}
                      className="mt-1"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="discount">{t.bookingDetail.discount}</Label>
                    <Input
                      id="discount"
                      type="number"
                      step="1"
                      min="0"
                      value={pricing.discount}
                      onChange={(e) => setPricing({ ...pricing, discount: e.target.value })}
                      className="mt-1"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="extraChargesNote">{t.bookingDetail.otherChargesName}</Label>
                    <Input
                      id="extraChargesNote"
                      type="text"
                      placeholder="e.g. Night charges"
                      value={pricing.extraChargesNote}
                      onChange={(e) => setPricing({ ...pricing, extraChargesNote: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="extraCharges">{t.bookingDetail.otherChargesAmount}</Label>
                    <Input
                      id="extraCharges"
                      type="number"
                      step="1"
                      min="0"
                      value={pricing.extraCharges}
                      onChange={(e) => setPricing({ ...pricing, extraCharges: e.target.value })}
                      className="mt-1"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={pricingLoading} size="sm">
                    {pricingLoading ? t.common.saving : t.bookingDetail.savePricing}
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
            ) : (
              <div className="text-muted-foreground py-4 text-center text-sm">
                {t.bookingDetail.noPricingAssigned}
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setPricingOpen(true)}
                >
                  {t.bookingDetail.assignPricing}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{t.bookingDetail.payments}</CardTitle>
            <div className="flex items-center gap-2">
              <StatusBadge status={booking.paymentStatus} label={getStatusLabel(t, booking.paymentStatus)} />
              {booking.totalAmount && booking.paymentStatus !== "PAID" && (
                <Button
                  variant="outline"
                  size="sm"
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
                  <IndianRupee className="mr-1 h-3 w-3" />
                  {t.bookingDetail.recordPayment}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {paymentOpen && (
              <form onSubmit={handleRecordPayment} className="mb-4 space-y-3 rounded border p-3">
                <div>
                  <Label htmlFor="payAmount">{t.bookingDetail.amountRequired}</Label>
                  <Input
                    id="payAmount"
                    type="number"
                    step="1"
                    min="1"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="payMethod">{t.bookingDetail.methodRequired}</Label>
                  <Select
                    value={paymentForm.method}
                    onValueChange={(v) =>
                      setPaymentForm({ ...paymentForm, method: v as "CASH" | "ONLINE" })
                    }
                  >
                    <SelectTrigger className="mt-1">
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
                    <Label htmlFor="transactionRef">{t.bookingDetail.transactionRef}</Label>
                    <Input
                      id="transactionRef"
                      type="text"
                      placeholder="UPI / transaction ID"
                      value={paymentForm.transactionRef}
                      onChange={(e) =>
                        setPaymentForm({ ...paymentForm, transactionRef: e.target.value })
                      }
                      className="mt-1"
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
                  <Label htmlFor="isAdvance" className="cursor-pointer text-sm font-normal">
                    {t.bookingDetail.advancePayment}
                  </Label>
                </div>
                <div>
                  <Label htmlFor="payNotes">{t.bookingDetail.notes}</Label>
                  <Input
                    id="payNotes"
                    type="text"
                    placeholder={t.bookingDetail.notesPlaceholder}
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={paymentLoading}>
                    {paymentLoading ? t.common.saving : t.bookingDetail.savePayment}
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
            {booking.payments.length === 0 && !paymentOpen ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                {t.bookingDetail.noPaymentsRecorded}
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
                        {getPaymentMethodLabel(t, payment.method)} {payment.isAdvance && `(${t.common.advance})`}
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

      {/* Invoice */}
      {booking.invoices?.length > 0 && (() => {
        const inv = booking.invoices[0];
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.bookingDetail.invoices}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded border p-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{inv.invoiceNumber}</span>
                  <span className="text-muted-foreground">{formatCurrency(inv.grandTotal)}</span>
                  {inv.signedAt && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                      <CheckCircle className="h-3 w-3" />
                      {t.common.signed}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadBill(inv.id, inv.invoiceNumber)}
                    disabled={downloadLoading}
                  >
                    <FileText className="mr-1 h-3 w-3" />
                    {downloadLoading ? t.common.processing : t.bookingDetail.downloadBill}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShareBill(inv.id)}
                    disabled={shareLoading}
                  >
                    <Share2 className="mr-1 h-3 w-3" />
                    {t.bookingDetail.shareBill}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Duty Slip */}
      {booking.dutySlip && (() => {
        const ds = booking.dutySlip;
        const isSubmitted = ds.status === "SUBMITTED";
        return (
          <Card className={isSubmitted ? "border-green-200" : "border-yellow-200"}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-orange-500" />
                  {t.dutySlip.title}
                </span>
                <div className="flex items-center gap-2">
                  {dsEditing ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setDsEditing(false)} disabled={dsSaving}>
                        <X className="h-3.5 w-3.5 mr-1" />
                        {t.dutySlip.cancelEdit}
                      </Button>
                      <Button size="sm" onClick={saveDsEdit} disabled={dsSaving}>
                        <Save className="h-3.5 w-3.5 mr-1" />
                        {dsSaving ? t.dutySlip.saving : t.dutySlip.saveKm}
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" onClick={startDsEdit}>
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      {t.dutySlip.editKm}
                    </Button>
                  )}
                  {isSubmitted ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                      <CheckCircle className="h-3 w-3" />
                      {t.dutySlip.submitted}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-800">
                      {t.dutySlip.pending}
                    </span>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Info row */}
              <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                <div>
                  <p className="text-muted-foreground text-xs">{t.dutySlip.guestName}</p>
                  <p className="font-medium">{ds.guestName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">
                    {booking.carSource === "VENDOR_CAR" && !booking.driver ? t.dutySlip.vendorName : t.dutySlip.driverName}
                  </p>
                  <p className="font-medium">{booking.driver?.name || booking.vendor?.name || "-"}</p>
                </div>
                {(booking.driver?.phone || (booking.carSource === "VENDOR_CAR" && booking.vendor?.phone)) && (
                  <div>
                    <p className="text-muted-foreground text-xs">
                      {booking.carSource === "VENDOR_CAR" && !booking.driver ? t.dutySlip.vendorPhone : t.dutySlip.driverPhone}
                    </p>
                    <p className="font-medium">{booking.driver?.phone || booking.vendor?.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground text-xs">{t.dutySlip.vehicleName}</p>
                  <p className="font-medium">{ds.vehicleName || booking.driver?.vehicleName || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">{t.dutySlip.vehicleNumber}</p>
                  <p className="font-medium">{ds.vehicleNumber || booking.driver?.vehicleNumber || "-"}</p>
                </div>
              </div>

              {/* KM Readings */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-blue-500" />
                  {t.dutySlip.kmReadings}
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {/* Office Start - KM only */}
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-medium text-gray-600 mb-1">{t.dutySlip.officeStart}</p>
                    {dsEditing ? (
                      <Input type="number" placeholder="KM" value={dsForm.officeStartKm} onChange={e => setDsForm(p => ({ ...p, officeStartKm: e.target.value }))} className="h-8 text-sm" />
                    ) : (
                      <div className="text-sm">
                        <span>{ds.officeStartKm != null ? `${ds.officeStartKm} km` : "-"}</span>
                      </div>
                    )}
                  </div>
                  {/* Customer Pickup - KM + Time */}
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-medium text-gray-600 mb-1">{t.dutySlip.customerPickup}</p>
                    {dsEditing ? (
                      <div className="flex gap-2">
                        <Input type="number" placeholder="KM" value={dsForm.customerPickupKm} onChange={e => setDsForm(p => ({ ...p, customerPickupKm: e.target.value }))} className="h-8 text-sm flex-1" />
                        <Input type="text" placeholder={t.dutySlip.time} value={dsForm.customerPickupDateTime} onChange={e => setDsForm(p => ({ ...p, customerPickupDateTime: e.target.value }))} className="h-8 text-sm flex-1" />
                      </div>
                    ) : (
                      <div className="flex justify-between text-sm">
                        <span>{ds.customerPickupKm != null ? `${ds.customerPickupKm} km` : "-"}</span>
                        <span className="text-gray-500">{ds.customerPickupDateTime || "-"}</span>
                      </div>
                    )}
                  </div>
                  {/* Customer Drop - KM + Time */}
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-medium text-gray-600 mb-1">{t.dutySlip.customerDrop}</p>
                    {dsEditing ? (
                      <div className="flex gap-2">
                        <Input type="number" placeholder="KM" value={dsForm.customerDropKm} onChange={e => setDsForm(p => ({ ...p, customerDropKm: e.target.value }))} className="h-8 text-sm flex-1" />
                        <Input type="text" placeholder={t.dutySlip.time} value={dsForm.customerDropDateTime} onChange={e => setDsForm(p => ({ ...p, customerDropDateTime: e.target.value }))} className="h-8 text-sm flex-1" />
                      </div>
                    ) : (
                      <div className="flex justify-between text-sm">
                        <span>{ds.customerDropKm != null ? `${ds.customerDropKm} km` : "-"}</span>
                        <span className="text-gray-500">{ds.customerDropDateTime || "-"}</span>
                      </div>
                    )}
                  </div>
                  {/* Customer End - KM only */}
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-medium text-gray-600 mb-1">{t.dutySlip.customerEnd}</p>
                    {dsEditing ? (
                      <Input type="number" placeholder="KM" value={dsForm.customerEndKm} onChange={e => setDsForm(p => ({ ...p, customerEndKm: e.target.value }))} className="h-8 text-sm" />
                    ) : (
                      <div className="text-sm">
                        <span>{ds.customerEndKm != null ? `${ds.customerEndKm} km` : "-"}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Expenses */}
              {dsEditing ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">{t.dutySlip.dutyExpenses}</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-600 mb-1">{t.dutySlip.tollAmount}</p>
                      <Input type="number" placeholder="0" value={dsForm.tollAmount} onChange={e => setDsForm(p => ({ ...p, tollAmount: e.target.value }))} className="h-8 text-sm" />
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-600 mb-1">{t.dutySlip.parkingAmount}</p>
                      <Input type="number" placeholder="0" value={dsForm.parkingAmount} onChange={e => setDsForm(p => ({ ...p, parkingAmount: e.target.value }))} className="h-8 text-sm" />
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-600 mb-1">{t.dutySlip.otherChargeName}</p>
                      <Input type="text" placeholder={t.dutySlip.otherChargeNamePlaceholder} value={dsForm.otherChargeName} onChange={e => setDsForm(p => ({ ...p, otherChargeName: e.target.value }))} className="h-8 text-sm" />
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-600 mb-1">{t.dutySlip.otherChargeAmount}</p>
                      <Input type="number" placeholder="0" value={dsForm.otherChargeAmount} onChange={e => setDsForm(p => ({ ...p, otherChargeAmount: e.target.value }))} className="h-8 text-sm" />
                    </div>
                  </div>
                </div>
              ) : (Number(ds.tollAmount || 0) > 0 || Number(ds.parkingAmount || 0) > 0 || Number(ds.otherChargeAmount || 0) > 0) && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">{t.dutySlip.dutyExpenses}</h3>
                  <div className="space-y-1 text-sm">
                    {Number(ds.tollAmount || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t.dutySlip.tollAmount}</span>
                        <span>{formatCurrency(ds.tollAmount || "0")}</span>
                      </div>
                    )}
                    {Number(ds.parkingAmount || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t.dutySlip.parkingAmount}</span>
                        <span>{formatCurrency(ds.parkingAmount || "0")}</span>
                      </div>
                    )}
                    {ds.otherChargeName && Number(ds.otherChargeAmount || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{ds.otherChargeName}</span>
                        <span>{formatCurrency(ds.otherChargeAmount || "0")}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Signature */}
              {ds.signatureData && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">{t.dutySlip.signature}</h3>
                  <div className="rounded-lg border bg-gray-50 p-2 inline-block">
                    <img src={ds.signatureData} alt="Signature" className="h-20 w-auto" />
                  </div>
                  {ds.submittedAt && (
                    <p className="text-xs text-muted-foreground">
                      {interpolate(t.dutySlip.submittedAt, { date: new Date(ds.submittedAt).toLocaleString("en-IN") })}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Status Transition Dialog */}
      <ConfirmDialog
        open={statusDialog.open}
        onOpenChange={(open) => setStatusDialog({ ...statusDialog, open })}
        title={interpolate(t.bookingDetail.statusDialogTitle, { status: statusDialog.status ? getStatusLabel(t, statusDialog.status) : "" })}
        description={
          statusDialog.needsReason
            ? t.bookingDetail.statusReasonPrompt
            : interpolate(t.bookingDetail.statusConfirmPrompt, { status: statusDialog.status ? getStatusLabel(t, statusDialog.status) : "" })
        }
        confirmLabel={statusDialog.status ? getStatusLabel(t, statusDialog.status) : t.common.confirm}
        variant={
          statusDialog.status === "CANCELLED"
            ? "destructive"
            : "default"
        }
        onConfirm={handleStatusChange}
        loading={statusLoading}
      >
        {statusDialog.status === "CONFIRMED" && !booking.baseFare && (
          <div className="flex items-center gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{t.bookingDetail.noPricingWarning}</span>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
