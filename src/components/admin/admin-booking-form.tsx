"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  VEHICLE_TYPES,
  TRIP_TYPES,
} from "@/lib/constants";
import { useT } from "@/lib/i18n/language-context";
import { getVehicleTypeLabel, getTripTypeLabel } from "@/lib/i18n/label-maps";
import { Loader2 } from "lucide-react";

interface AdminBookingFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const initialForm = {
  name: "",
  phone: "",
  email: "",
  travelDate: "",
  pickupLocation: "",
  dropLocation: "",
  pickupTime: "",
  vehicleType: "",
  tripType: "",
  returnDate: "",
  passengerCount: "",
  estimatedDistance: "",
  specialRequests: "",
  status: "CONFIRMED",
};

export function AdminBookingForm({ onSuccess, onCancel }: AdminBookingFormProps) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const t = useT();

  function resetForm() {
    setForm(initialForm);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        phone: form.phone,
        travelDate: form.travelDate,
        pickupLocation: form.pickupLocation,
        dropLocation: form.dropLocation,
        status: form.status,
      };

      if (form.email) payload.email = form.email;
      if (form.pickupTime) payload.pickupTime = form.pickupTime;
      if (form.vehicleType) payload.vehicleType = form.vehicleType;
      if (form.tripType) payload.tripType = form.tripType;
      if (form.returnDate) payload.returnDate = form.returnDate;
      if (form.passengerCount) payload.passengerCount = parseInt(form.passengerCount, 10);
      if (form.estimatedDistance) payload.estimatedDistance = parseFloat(form.estimatedDistance);
      if (form.specialRequests) payload.specialRequests = form.specialRequests;

      const res = await fetch("/api/bookings/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (result.success) {
        toast.success(t.bookingForm.bookingCreated.replace("{id}", result.data.bookingId));
        resetForm();
        onSuccess?.();
      } else {
        toast.error(result.error || t.bookingForm.createFailed);
      }
    } catch {
      toast.error(t.bookingForm.createFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-gray-200">
      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Customer */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label htmlFor="name">{t.bookingForm.customerName}</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t.bookingForm.customerNamePlaceholder}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">{t.bookingForm.phone}</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder={t.bookingForm.phonePlaceholder}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">{t.bookingForm.email}</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder={t.bookingForm.emailPlaceholder}
              />
            </div>
          </div>

          {/* Row 2: Trip details */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label htmlFor="travelDate">{t.bookingForm.travelDate}</Label>
              <Input
                id="travelDate"
                type="date"
                value={form.travelDate}
                onChange={(e) => setForm({ ...form, travelDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="pickupLocation">{t.bookingForm.pickupLocation}</Label>
              <Input
                id="pickupLocation"
                value={form.pickupLocation}
                onChange={(e) => setForm({ ...form, pickupLocation: e.target.value })}
                placeholder={t.bookingForm.pickupPlaceholder}
                required
              />
            </div>
            <div>
              <Label htmlFor="dropLocation">{t.bookingForm.dropLocation}</Label>
              <Input
                id="dropLocation"
                value={form.dropLocation}
                onChange={(e) => setForm({ ...form, dropLocation: e.target.value })}
                placeholder={t.bookingForm.dropPlaceholder}
                required
              />
            </div>
          </div>

          {/* Row 3: Vehicle, trip type, time */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label htmlFor="pickupTime">{t.bookingForm.pickupTime}</Label>
              <Input
                id="pickupTime"
                type="time"
                value={form.pickupTime}
                onChange={(e) => setForm({ ...form, pickupTime: e.target.value })}
              />
            </div>
            <div>
              <Label>{t.bookingForm.vehicleType}</Label>
              <Select
                value={form.vehicleType}
                onValueChange={(v) => setForm({ ...form, vehicleType: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.bookingForm.selectVehicle} />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPES.map((vt) => (
                    <SelectItem key={vt} value={vt}>
                      {getVehicleTypeLabel(t, vt)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t.bookingForm.tripType}</Label>
              <Select
                value={form.tripType}
                onValueChange={(v) => setForm({ ...form, tripType: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.bookingForm.selectTripType} />
                </SelectTrigger>
                <SelectContent>
                  {TRIP_TYPES.map((tt) => (
                    <SelectItem key={tt} value={tt}>
                      {getTripTypeLabel(t, tt)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 4: Return date, passengers, distance */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {form.tripType === "ROUND_TRIP" && (
              <div>
                <Label htmlFor="returnDate">{t.bookingForm.returnDate}</Label>
                <Input
                  id="returnDate"
                  type="date"
                  value={form.returnDate}
                  onChange={(e) => setForm({ ...form, returnDate: e.target.value })}
                />
              </div>
            )}
            <div>
              <Label htmlFor="passengerCount">{t.bookingForm.passengers}</Label>
              <Input
                id="passengerCount"
                type="number"
                min="1"
                max="60"
                value={form.passengerCount}
                onChange={(e) => setForm({ ...form, passengerCount: e.target.value })}
                placeholder={t.bookingForm.passengersPlaceholder}
              />
            </div>
            <div>
              <Label htmlFor="estimatedDistance">{t.bookingForm.distance}</Label>
              <Input
                id="estimatedDistance"
                type="number"
                min="0"
                step="0.1"
                value={form.estimatedDistance}
                onChange={(e) => setForm({ ...form, estimatedDistance: e.target.value })}
                placeholder={t.bookingForm.distancePlaceholder}
              />
            </div>
          </div>

          {/* Row 5: Special requests */}
          <div>
            <Label htmlFor="specialRequests">{t.bookingForm.specialRequests}</Label>
            <Textarea
              id="specialRequests"
              value={form.specialRequests}
              onChange={(e) => setForm({ ...form, specialRequests: e.target.value })}
              placeholder={t.bookingForm.specialRequestsPlaceholder}
              rows={2}
            />
          </div>

          {/* Row 6: Status + actions */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-48">
              <Label>{t.bookingForm.statusLabel}</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONFIRMED">{t.bookingForm.confirmed}</SelectItem>
                  <SelectItem value="PENDING">{t.bookingForm.pending}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  onCancel?.();
                }}
              >
                {t.common.cancel}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t.bookingForm.createBooking}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
