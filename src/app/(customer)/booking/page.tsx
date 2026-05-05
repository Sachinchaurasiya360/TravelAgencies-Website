"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { createBookingSchema, CAR_TYPES, type CreateBookingInput } from "@/validators/booking.validator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  Copy,
  ArrowRight,
  CalendarIcon,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Generate time options in 30-minute intervals
const timeOptions: string[] = [];
for (let h = 0; h < 24; h++) {
  for (const m of [0, 30]) {
    const hour = h.toString().padStart(2, "0");
    const minute = m.toString().padStart(2, "0");
    timeOptions.push(`${hour}:${minute}`);
  }
}

function formatTime12h(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export default function BookingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    bookingId: string;
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateBookingInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createBookingSchema as any) as any,
  });

  async function onSubmit(data: CreateBookingInput) {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Failed to submit booking");
        return;
      }

      setBookingResult(result.data);
      toast.success("Booking submitted successfully!");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (bookingResult) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold">Booking Submitted!</h1>
        <p className="text-muted-foreground mt-2">
          Your booking request has been received. Our team will review and
          confirm it shortly.
        </p>

        <Card className="mt-8">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">Your Booking ID</p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-2xl font-bold text-orange-500">
                {bookingResult.bookingId}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(bookingResult.bookingId);
                  toast.success("Copied to clipboard!");
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-muted-foreground mt-4 text-sm">
              Save this ID to track your booking status. You will also receive
              a confirmation via SMS/email.
            </p>
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="outline" onClick={() => setBookingResult(null)}>
            Book Another Trip
          </Button>
          <Button asChild>
            <a href={`/track?bookingId=${bookingResult.bookingId}`}>
              Track Booking <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 md:py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Book Your Trip</h1>
        <p className="text-muted-foreground mt-2">
          Fill in the details below and we will get back to you with
          confirmation and pricing.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Contact Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                className="mt-1"
                {...register("name")}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  placeholder="e.g., 9876543210"
                  className="mt-1"
                  {...register("phone")}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  className="mt-1"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Travel Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Travel Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Date Picker */}
            <div>
              <Label>Travel Date *</Label>
              <Controller
                control={control}
                name="travelDate"
                render={({ field }) => (
                  <Popover open={dateOpen} onOpenChange={setDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "mt-1 w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value
                          ? format(field.value, "PPP")
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => {
                          field.onChange(date);
                          setDateOpen(false);
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.travelDate && (
                <p className="mt-1 text-sm text-red-500">{errors.travelDate.message}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="pickupLocation">Pickup Location *</Label>
                <Input
                  id="pickupLocation"
                  placeholder="e.g., Pune Airport"
                  className="mt-1"
                  {...register("pickupLocation")}
                />
                {errors.pickupLocation && (
                  <p className="mt-1 text-sm text-red-500">{errors.pickupLocation.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="dropLocation">Drop Location *</Label>
                <Input
                  id="dropLocation"
                  placeholder="e.g., Mumbai Station"
                  className="mt-1"
                  {...register("dropLocation")}
                />
                {errors.dropLocation && (
                  <p className="mt-1 text-sm text-red-500">{errors.dropLocation.message}</p>
                )}
              </div>
            </div>

            {/* Time Picker */}
            <div>
              <Label>Preferred Pickup Time</Label>
              <Controller
                control={control}
                name="pickupTime"
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="mt-1">
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Select a time" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {formatTime12h(time)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Car Type */}
            <div>
              <Label>Preferred Car Type</Label>
              <Controller
                control={control}
                name="vehiclePreference"
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a car type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CAR_TYPES.map((car) => (
                        <SelectItem key={car} value={car}>
                          {car}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.vehiclePreference && (
                <p className="mt-1 text-sm text-red-500">{errors.vehiclePreference.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Booking Request"}
        </Button>
      </form>
    </div>
  );
}
