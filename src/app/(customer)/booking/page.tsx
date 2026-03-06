"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createBookingSchema, type CreateBookingInput } from "@/validators/booking.validator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  Copy,
  ArrowRight,
} from "lucide-react";

export default function BookingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    bookingId: string;
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
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
            <div>
              <Label htmlFor="travelDate">Travel Date *</Label>
              <Input
                id="travelDate"
                type="date"
                className="mt-1"
                {...register("travelDate")}
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

            <div>
              <Label htmlFor="pickupTime">Preferred Pickup Time</Label>
              <Input
                id="pickupTime"
                type="time"
                className="mt-1"
                {...register("pickupTime")}
              />
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
