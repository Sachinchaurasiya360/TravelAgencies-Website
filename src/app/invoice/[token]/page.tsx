"use client";

import { useEffect, useState, useRef, use } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, RotateCcw, Send } from "lucide-react";

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  serviceDescription: string;
  subtotal: number;
  tollCharges: number;
  parkingCharges: number;
  driverAllowance: number;
  extraCharges: number;
  extraChargesNote: string | null;
  discount: number;
  grandTotal: number;
  amountInWords: string;
  amountPaid: number;
  balanceDue: number;
  signatureData: string | null;
  signedAt: string | null;
  dutySlipSignatureData: string | null;
  dutySlipSignedAt: string | null;
  booking: {
    bookingId: string;
    pickupLocation: string;
    dropLocation: string;
    travelDate: string;
  };
  bankDetails: {
    bankName: string | null;
    bankAccountNumber: string | null;
    bankIfscCode: string | null;
    bankAccountName: string | null;
    upiId: string | null;
  } | null;
}

export default function PublicInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    async function fetchInvoice() {
      try {
        const res = await fetch(`/api/invoices/public/${token}`);
        const result = await res.json();
        if (result.success) {
          setInvoice(result.data);
          if (result.data.signedAt || result.data.dutySlipSignedAt) setSigned(true);
        } else {
          setError(result.error || "Invoice not found");
        }
      } catch {
        setError("Failed to load invoice");
      } finally {
        setLoading(false);
      }
    }
    fetchInvoice();
  }, [token]);

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || signed || !invoice) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
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
  }, [invoice, signed]);

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }

  async function handleSubmitSignature() {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;

    setSigning(true);
    try {
      const signatureData = canvas.toDataURL("image/png");
      const res = await fetch("/api/invoices/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, signatureData }),
      });
      const result = await res.json();
      if (result.success) {
        setSigned(true);
        setInvoice((prev) => prev ? { ...prev, signatureData: signatureData, signedAt: new Date().toISOString() } : prev);
      } else {
        alert(result.error || "Failed to submit signature");
      }
    } catch {
      alert("Failed to submit signature");
    } finally {
      setSigning(false);
    }
  }

  function formatCurrency(val: number) {
    return `₹${Math.round(val).toLocaleString("en-IN")}`;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <p className="mt-3 text-gray-500">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-lg font-medium text-red-600">{error || "Invoice not found"}</p>
            <p className="mt-2 text-sm text-gray-500">This link may be invalid or expired.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Company Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">{invoice.companyName}</h1>
          <p className="text-sm text-gray-500">{invoice.companyAddress}</p>
          {invoice.companyPhone && (
            <p className="text-sm text-gray-500">Phone: {invoice.companyPhone}</p>
          )}
        </div>

        {/* Invoice Details */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Invoice #{invoice.invoiceNumber}</CardTitle>
              {signed && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  Signed
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Date: {new Date(invoice.invoiceDate).toLocaleDateString("en-IN")}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Customer */}
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs font-medium uppercase text-gray-500">Bill To</p>
              <p className="font-medium">{invoice.customerName}</p>
              <p className="text-sm text-gray-600">{invoice.customerPhone}</p>
              {invoice.customerEmail && (
                <p className="text-sm text-gray-600">{invoice.customerEmail}</p>
              )}
            </div>

            {/* Trip Info */}
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs font-medium uppercase text-gray-500">Trip Details</p>
              <p className="text-sm">Booking #{invoice.booking.bookingId}</p>
              <p className="text-sm">{invoice.booking.pickupLocation} → {invoice.booking.dropLocation}</p>
              <p className="text-sm">Date: {new Date(invoice.booking.travelDate).toLocaleDateString("en-IN")}</p>
            </div>

            {/* Charges Breakdown */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Base Fare</span>
                <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.tollCharges > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">FastTag / Toll</span>
                  <span className="font-medium">{formatCurrency(invoice.tollCharges)}</span>
                </div>
              )}
              {invoice.parkingCharges > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Parking Charges</span>
                  <span className="font-medium">{formatCurrency(invoice.parkingCharges)}</span>
                </div>
              )}
              {invoice.driverAllowance > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Driver Allowance</span>
                  <span className="font-medium">{formatCurrency(invoice.driverAllowance)}</span>
                </div>
              )}
              {invoice.extraCharges > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">{invoice.extraChargesNote || "Other Charges"}</span>
                  <span className="font-medium">{formatCurrency(invoice.extraCharges)}</span>
                </div>
              )}
              {invoice.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(invoice.discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 text-base font-bold">
                <span>Grand Total</span>
                <span className="text-blue-600">{formatCurrency(invoice.grandTotal)}</span>
              </div>
              <p className="text-xs text-gray-500 italic">{invoice.amountInWords}</p>

              {invoice.amountPaid > 0 && (
                <>
                  <div className="flex justify-between text-green-600">
                    <span>Amount Paid</span>
                    <span>{formatCurrency(invoice.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-red-600">
                    <span>Balance Due</span>
                    <span>{formatCurrency(invoice.balanceDue)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Bank Details */}
            {invoice.bankDetails && (invoice.bankDetails.bankName || invoice.bankDetails.upiId) && (
              <div className="rounded-lg border p-3">
                <p className="mb-2 text-xs font-medium uppercase text-gray-500">Payment Details</p>
                {invoice.bankDetails.bankName && (
                  <div className="space-y-1 text-sm">
                    <p>Bank: {invoice.bankDetails.bankName}</p>
                    {invoice.bankDetails.bankAccountName && <p>Account Name: {invoice.bankDetails.bankAccountName}</p>}
                    {invoice.bankDetails.bankAccountNumber && <p>Account No: {invoice.bankDetails.bankAccountNumber}</p>}
                    {invoice.bankDetails.bankIfscCode && <p>IFSC: {invoice.bankDetails.bankIfscCode}</p>}
                  </div>
                )}
                {invoice.bankDetails.upiId && (
                  <p className="mt-1 text-sm">UPI: {invoice.bankDetails.upiId}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Signature Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer Signature</CardTitle>
          </CardHeader>
          <CardContent>
            {signed ? (
              <div className="space-y-3 text-center">
                {(invoice.dutySlipSignatureData || invoice.signatureData) && (
                  <div className="mx-auto max-w-xs rounded border bg-white p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={(invoice.dutySlipSignatureData || invoice.signatureData)!} alt="Signature" className="w-full" />
                  </div>
                )}
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <p className="font-medium">
                    Signed on {new Date((invoice.dutySlipSignedAt || invoice.signedAt)!).toLocaleDateString("en-IN", {
                      day: "numeric", month: "long", year: "numeric",
                      hour: "numeric", minute: "2-digit", hour12: true,
                    })}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  Please sign below to confirm that you have reviewed the invoice and agree to the charges.
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
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmitSignature}
                    disabled={!hasDrawn || signing}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    <Send className="mr-1 h-3 w-3" />
                    {signing ? "Submitting..." : "Submit Signature"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400">
          {invoice.companyName} | {invoice.companyPhone}
        </p>
      </div>
    </div>
  );
}
