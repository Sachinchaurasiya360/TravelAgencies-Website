"use client";

import { useEffect, useState, useRef, useCallback, use } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { formatCurrency } from "@/lib/helpers/currency";
import { formatDate } from "@/lib/helpers/date";
import {
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle,
  Car,
  Route,

  PenTool,
  RotateCcw,
  Send,
  ClipboardList,
  Gauge,
  Receipt,
} from "lucide-react";
import { useT } from "@/lib/i18n/language-context";
import { interpolate } from "@/lib/i18n";
import { getStatusLabel } from "@/lib/i18n/label-maps";

interface DutySlipData {
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
}

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
  specialRequests: string | null;
  customer: {
    name: string;
    phone: string;
    email: string | null;
  };
  driver: {
    id: string;
    name: string;
    phone: string | null;
    vehicleName: string | null;
    vehicleNumber: string | null;
  } | null;
  vendor: {
    id: string;
    name: string;
    phone: string;
  } | null;
  carSource: string;
  dutySlip: DutySlipData | null;
}

export default function DriverRidePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const t = useT();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Duty slip form state
  const [dutySlipForm, setDutySlipForm] = useState({
    officeStartKm: "",
    officeStartDateTime: "",
    customerPickupKm: "",
    customerPickupDateTime: "",
    customerDropKm: "",
    customerDropDateTime: "",
    customerEndKm: "",
    customerEndDateTime: "",
    tollAmount: "",
    parkingAmount: "",
    otherChargeName: "",
    otherChargeAmount: "",
  });
  const [draftSaving, setDraftSaving] = useState(false);
  const [dutySlipSubmitting, setDutySlipSubmitting] = useState(false);

  // Customer signature
  const [dutySignatureOpen, setDutySignatureOpen] = useState(false);
  const [dutyHasDrawn, setDutyHasDrawn] = useState(false);
  const dutyCanvasRef = useRef<HTMLCanvasElement>(null);
  const dutyIsDrawingRef = useRef(false);
  const dutySignatureSectionRef = useRef<HTMLDivElement>(null);

  const fetchBooking = useCallback(async () => {
    try {
      const res = await fetch(`/api/driver/ride/${token}`);
      const result = await res.json();
      if (result.success) {
        setBooking(result.data);
        // Populate duty slip form from existing data
        const ds = result.data.dutySlip;
        if (ds) {
          setDutySlipForm({
            officeStartKm: ds.officeStartKm?.toString() || "",
            officeStartDateTime: "",
            customerPickupKm: ds.customerPickupKm?.toString() || "",
            customerPickupDateTime: ds.customerPickupDateTime || "",
            customerDropKm: ds.customerDropKm?.toString() || "",
            customerDropDateTime: ds.customerDropDateTime || "",
            customerEndKm: ds.customerEndKm?.toString() || "",
            customerEndDateTime: "",
            tollAmount: ds.tollAmount?.toString() || "",
            parkingAmount: ds.parkingAmount?.toString() || "",
            otherChargeName: ds.otherChargeName || "",
            otherChargeAmount: ds.otherChargeAmount?.toString() || "",
          });
        }
      } else {
        toast.error(result.error || t.driver.fetchFailed);
      }
    } catch {
      toast.error(t.driver.fetchFailed);
    } finally {
      setLoading(false);
    }
  }, [token, t.driver.fetchFailed]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  // Customer signature canvas setup
  useEffect(() => {
    const canvas = dutyCanvasRef.current;
    if (!canvas || !dutySignatureOpen) return;

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
      dutyIsDrawingRef.current = true;
      const pos = e instanceof MouseEvent ? getPos(e) : getPos(e.touches[0]);
      ctx!.beginPath();
      ctx!.moveTo(pos.x, pos.y);
    }
    function draw(e: MouseEvent | TouchEvent) {
      if (!dutyIsDrawingRef.current) return;
      e.preventDefault();
      const pos = e instanceof MouseEvent ? getPos(e) : getPos(e.touches[0]);
      ctx!.lineTo(pos.x, pos.y);
      ctx!.stroke();
      setDutyHasDrawn(true);
    }
    function stopDraw() { dutyIsDrawingRef.current = false; }

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
  }, [dutySignatureOpen]);

  function clearDutyCanvas() {
    const canvas = dutyCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDutyHasDrawn(false);
  }

  // Build duty slip payload from form state
  function buildDutySlipPayload(): Record<string, unknown> {
    const payload: Record<string, unknown> = {};
    if (dutySlipForm.officeStartKm !== "") payload.officeStartKm = parseFloat(dutySlipForm.officeStartKm);
    if (dutySlipForm.customerPickupKm !== "") payload.customerPickupKm = parseFloat(dutySlipForm.customerPickupKm);
    if (dutySlipForm.customerPickupDateTime) payload.customerPickupDateTime = dutySlipForm.customerPickupDateTime;
    if (dutySlipForm.customerDropKm !== "") payload.customerDropKm = parseFloat(dutySlipForm.customerDropKm);
    if (dutySlipForm.customerDropDateTime) payload.customerDropDateTime = dutySlipForm.customerDropDateTime;
    if (dutySlipForm.customerEndKm !== "") payload.customerEndKm = parseFloat(dutySlipForm.customerEndKm);
    if (dutySlipForm.tollAmount !== "") payload.tollAmount = parseFloat(dutySlipForm.tollAmount);
    if (dutySlipForm.parkingAmount !== "") payload.parkingAmount = parseFloat(dutySlipForm.parkingAmount);
    if (dutySlipForm.otherChargeName) payload.otherChargeName = dutySlipForm.otherChargeName;
    if (dutySlipForm.otherChargeAmount !== "") payload.otherChargeAmount = parseFloat(dutySlipForm.otherChargeAmount);
    return payload;
  }

  // Duty slip: save draft
  async function handleSaveDutyDraft() {
    setDraftSaving(true);
    try {
      const payload = buildDutySlipPayload();

      const res = await fetch(`/api/driver/ride/${token}/duty-slip`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(t.dutySlip.draftSaved);
        await fetchBooking();
      } else {
        toast.error(result.error || t.dutySlip.draftFailed);
      }
    } catch {
      toast.error(t.dutySlip.draftFailed);
    } finally {
      setDraftSaving(false);
    }
  }

  // Duty slip: submit with customer signature
  async function handleSubmitDutySlip() {
    const canvas = dutyCanvasRef.current;
    if (!canvas || !dutyHasDrawn) {
      toast.error(t.dutySlip.signatureRequired);
      return;
    }

    setDutySlipSubmitting(true);
    try {
      const signatureData = canvas.toDataURL("image/png");
      const payload: Record<string, unknown> = { signatureData, ...buildDutySlipPayload() };

      const res = await fetch(`/api/driver/ride/${token}/duty-slip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(t.dutySlip.submitSuccess);
        setDutySignatureOpen(false);
        setDutyHasDrawn(false);
        await fetchBooking();
      } else {
        toast.error(result.error || t.dutySlip.submitFailed);
      }
    } catch {
      toast.error(t.dutySlip.submitFailed);
    } finally {
      setDutySlipSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (!booking) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <p className="text-gray-500">{t.driver.rideNotFound}</p>
      </div>
    );
  }

  const dutySlip = booking.dutySlip;
  const isSubmitted = dutySlip?.status === "SUBMITTED";

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold">#{booking.bookingId}</h1>
            <StatusBadge status={booking.status} label={getStatusLabel(t, booking.status)} />
          </div>
        </div>
      </div>

      {/* Duty Slip Info Header - Guest, Driver, Vehicle */}
      {dutySlip && (
        <Card className="border-orange-200 bg-orange-50/30">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-orange-500" />
                {t.dutySlip.title}
              </h2>
              {isSubmitted ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                  <CheckCircle className="h-3 w-3" />
                  {t.dutySlip.submitted}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                  {t.dutySlip.pending}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">{booking.vendor && !booking.driver ? t.dutySlip.vendorName || "Vendor" : t.dutySlip.driverName}</p>
                <p className="font-medium">{booking.driver?.name || booking.vendor?.name || "-"}</p>
              </div>
              {(booking.driver?.phone || booking.vendor?.phone) && (
                <div>
                  <p className="text-xs text-gray-500">{booking.vendor && !booking.driver ? t.dutySlip.vendorPhone || "Phone" : t.dutySlip.driverPhone}</p>
                  <p className="font-medium">{booking.driver?.phone || booking.vendor?.phone}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500">{t.dutySlip.vehicleName}</p>
                <p className="font-medium">{dutySlip.vehicleName || booking.driver?.vehicleName || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t.dutySlip.vehicleNumber}</p>
                <p className="font-medium">{dutySlip.vehicleNumber || booking.driver?.vehicleNumber || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                  {booking.pickupAddress && <p className="text-xs text-gray-500">{booking.pickupAddress}</p>}
                </div>
              </div>
              <div className="ml-2 border-l-2 border-dashed border-gray-200 h-3" />
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <div>
                  <p className="text-sm font-medium">{booking.dropLocation}</p>
                  {booking.dropAddress && <p className="text-xs text-gray-500">{booking.dropAddress}</p>}
                </div>
              </div>
            </div>
            {booking.estimatedDistance && (
              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Route className="h-3.5 w-3.5" />
                  {interpolate(t.driver.distanceKm, { distance: booking.estimatedDistance })}
                </span>
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
          {booking.customer.email && <p className="text-xs text-gray-500">{booking.customer.email}</p>}
        </CardContent>
      </Card>

      {/* KM Readings */}
      {dutySlip && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Gauge className="h-4 w-4 text-blue-500" />
              {t.dutySlip.kmReadings}
            </h2>

            {isSubmitted ? (
              // Read-only view
              <div className="space-y-3">
                {/* Office Start - KM only */}
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">{t.dutySlip.officeStart}</p>
                  <div>
                    <p className="text-[10px] text-gray-400">{t.dutySlip.km}</p>
                    <p className="text-sm font-medium">{dutySlip.officeStartKm ?? "-"}</p>
                  </div>
                </div>
                {/* Customer Pickup - KM + Time */}
                <div className="rounded-lg bg-gray-50 p-3 grid grid-cols-2 gap-2">
                  <p className="text-xs font-medium text-gray-700 col-span-2">{t.dutySlip.customerPickup}</p>
                  <div>
                    <p className="text-[10px] text-gray-400">{t.dutySlip.km}</p>
                    <p className="text-sm font-medium">{dutySlip.customerPickupKm ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">{t.dutySlip.time}</p>
                    <p className="text-sm font-medium">
                      {dutySlip.customerPickupDateTime ? new Date(dutySlip.customerPickupDateTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "-"}
                    </p>
                  </div>
                </div>
                {/* Customer Drop - KM + Time */}
                <div className="rounded-lg bg-gray-50 p-3 grid grid-cols-2 gap-2">
                  <p className="text-xs font-medium text-gray-700 col-span-2">{t.dutySlip.customerDrop}</p>
                  <div>
                    <p className="text-[10px] text-gray-400">{t.dutySlip.km}</p>
                    <p className="text-sm font-medium">{dutySlip.customerDropKm ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">{t.dutySlip.time}</p>
                    <p className="text-sm font-medium">
                      {dutySlip.customerDropDateTime ? new Date(dutySlip.customerDropDateTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "-"}
                    </p>
                  </div>
                </div>
                {/* Customer End - KM only */}
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">{t.dutySlip.customerEnd}</p>
                  <div>
                    <p className="text-[10px] text-gray-400">{t.dutySlip.km}</p>
                    <p className="text-sm font-medium">{dutySlip.customerEndKm ?? "-"}</p>
                  </div>
                </div>
              </div>
            ) : (
              // Editable form
              <div className="space-y-3">
                {/* Office Start - KM only, no date/time */}
                <div className="rounded-lg bg-gray-50 p-3 space-y-2">
                  <p className="text-xs font-medium text-gray-700">{t.dutySlip.officeStart}</p>
                  <div>
                    <Label className="text-[10px] text-gray-400">{t.dutySlip.km}</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="0"
                      value={dutySlipForm.officeStartKm}
                      onChange={(e) => setDutySlipForm({ ...dutySlipForm, officeStartKm: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                {/* Customer Pickup - KM + Time text input */}
                <div className="rounded-lg bg-gray-50 p-3 space-y-2">
                  <p className="text-xs font-medium text-gray-700">{t.dutySlip.customerPickup}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] text-gray-400">{t.dutySlip.km}</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="0"
                        value={dutySlipForm.customerPickupKm}
                        onChange={(e) => setDutySlipForm({ ...dutySlipForm, customerPickupKm: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-gray-400">{t.dutySlip.time}</Label>
                      <Input
                        type="text"
                        placeholder="e.g. 10:30 AM"
                        value={dutySlipForm.customerPickupDateTime}
                        onChange={(e) => setDutySlipForm({ ...dutySlipForm, customerPickupDateTime: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
                {/* Customer Drop - KM + Time text input */}
                <div className="rounded-lg bg-gray-50 p-3 space-y-2">
                  <p className="text-xs font-medium text-gray-700">{t.dutySlip.customerDrop}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] text-gray-400">{t.dutySlip.km}</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="0"
                        value={dutySlipForm.customerDropKm}
                        onChange={(e) => setDutySlipForm({ ...dutySlipForm, customerDropKm: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-gray-400">{t.dutySlip.time}</Label>
                      <Input
                        type="text"
                        placeholder="e.g. 5:00 PM"
                        value={dutySlipForm.customerDropDateTime}
                        onChange={(e) => setDutySlipForm({ ...dutySlipForm, customerDropDateTime: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
                {/* Customer End - KM only, no date/time */}
                <div className="rounded-lg bg-gray-50 p-3 space-y-2">
                  <p className="text-xs font-medium text-gray-700">{t.dutySlip.customerEnd}</p>
                  <div>
                    <Label className="text-[10px] text-gray-400">{t.dutySlip.km}</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="0"
                      value={dutySlipForm.customerEndKm}
                      onChange={(e) => setDutySlipForm({ ...dutySlipForm, customerEndKm: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Duty Expenses */}
      {dutySlip && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-blue-500" />
              {t.dutySlip.dutyExpenses}
            </h2>

            {isSubmitted ? (
              <div className="space-y-2 text-sm">
                {Number(dutySlip.tollAmount || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t.dutySlip.tollAmount}</span>
                    <span>{formatCurrency(dutySlip.tollAmount || "0")}</span>
                  </div>
                )}
                {Number(dutySlip.parkingAmount || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t.dutySlip.parkingAmount}</span>
                    <span>{formatCurrency(dutySlip.parkingAmount || "0")}</span>
                  </div>
                )}
                {dutySlip.otherChargeName && Number(dutySlip.otherChargeAmount || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{dutySlip.otherChargeName}</span>
                    <span>{formatCurrency(dutySlip.otherChargeAmount || "0")}</span>
                  </div>
                )}
                {!Number(dutySlip.tollAmount || 0) && !Number(dutySlip.parkingAmount || 0) && !Number(dutySlip.otherChargeAmount || 0) && (
                  <p className="text-xs text-gray-400 text-center py-1">-</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">{t.dutySlip.tollAmount}</Label>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="0"
                      value={dutySlipForm.tollAmount}
                      onChange={(e) => setDutySlipForm({ ...dutySlipForm, tollAmount: e.target.value })}
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{t.dutySlip.parkingAmount}</Label>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="0"
                      value={dutySlipForm.parkingAmount}
                      onChange={(e) => setDutySlipForm({ ...dutySlipForm, parkingAmount: e.target.value })}
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">{t.dutySlip.otherChargeName}</Label>
                    <Input
                      type="text"
                      placeholder={t.dutySlip.otherChargeNamePlaceholder}
                      value={dutySlipForm.otherChargeName}
                      onChange={(e) => setDutySlipForm({ ...dutySlipForm, otherChargeName: e.target.value })}
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{t.dutySlip.otherChargeAmount}</Label>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="0"
                      value={dutySlipForm.otherChargeAmount}
                      onChange={(e) => setDutySlipForm({ ...dutySlipForm, otherChargeAmount: e.target.value })}
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Customer Signature + Actions */}
      {dutySlip && !isSubmitted && (
        <>
          {/* Save Draft / Open Signature */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleSaveDutyDraft}
              disabled={draftSaving}
            >
              {draftSaving ? t.dutySlip.savingDraft : t.dutySlip.saveDraft}
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-orange-500 hover:bg-orange-600"
              onClick={() => {
                setDutySignatureOpen(true);
                setDutyHasDrawn(false);
                setTimeout(() => dutySignatureSectionRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
              }}
            >
              <PenTool className="mr-1 h-3 w-3" />
              {t.dutySlip.submit}
            </Button>
          </div>

          {/* Customer Signature Panel */}
          {dutySignatureOpen && (
            <div ref={dutySignatureSectionRef}>
              <Card className="border-orange-200 bg-orange-50/30">
                <CardContent className="p-4 space-y-3">
                  <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <PenTool className="h-4 w-4 text-orange-500" />
                    {t.driver.customerSignature}
                  </h2>
                  <p className="text-xs text-gray-500">{t.dutySlip.signatureInstructions}</p>
                  <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white">
                    <canvas
                      ref={dutyCanvasRef}
                      className="h-40 w-full cursor-crosshair touch-none"
                      style={{ touchAction: "none" }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={clearDutyCanvas} disabled={!dutyHasDrawn}>
                      <RotateCcw className="mr-1 h-3 w-3" />
                      {t.common.clear}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSubmitDutySlip}
                      disabled={!dutyHasDrawn || dutySlipSubmitting}
                      className="flex-1 bg-orange-500 hover:bg-orange-600"
                    >
                      <Send className="mr-1 h-3 w-3" />
                      {dutySlipSubmitting ? t.common.submitting : t.dutySlip.submit}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setDutySignatureOpen(false); setDutyHasDrawn(false); }}>
                      {t.common.cancel}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Submitted Customer Signature Display */}
      {dutySlip && isSubmitted && dutySlip.signatureData && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <PenTool className="h-4 w-4 text-green-500" />
              {t.driver.customerSignature}
            </h2>
            <div className="rounded-lg border bg-gray-50 p-2">
              <img src={dutySlip.signatureData} alt="Customer Signature" className="h-24 w-auto mx-auto" />
            </div>
            {dutySlip.submittedAt && (
              <p className="text-xs text-gray-400 text-center">
                {interpolate(t.dutySlip.submittedAt, { date: new Date(dutySlip.submittedAt).toLocaleString("en-IN") })}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
