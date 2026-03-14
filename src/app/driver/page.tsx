"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/lib/helpers/currency";
import { formatDate } from "@/lib/helpers/date";
import { MapPin, Calendar, Car, ArrowRight } from "lucide-react";
import { useT } from "@/lib/i18n/language-context";
import { interpolate } from "@/lib/i18n";
import { getStatusLabel } from "@/lib/i18n/label-maps";

interface RideBooking {
  id: string;
  bookingId: string;
  status: string;
  travelDate: string;
  pickupTime: string | null;
  pickupLocation: string;
  dropLocation: string;
  totalAmount: string | null;
  customer: {
    name: string;
    phone: string;
  };
}

export default function DriverDashboard() {
  const { data: session } = useSession();
  const t = useT();
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed">("upcoming");
  const [bookings, setBookings] = useState<RideBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/driver/bookings?type=${activeTab}`);
      const result = await res.json();
      if (result.success) {
        setBookings(result.data.bookings);
      }
    } catch {
      toast.error(t.driver.fetchFailed);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          {interpolate(t.driver.hello, { name: session?.user?.name?.split(" ")[0] || t.driver.roleLabel })}
        </h1>
        <p className="text-sm text-gray-500">{t.driver.myRides}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
            activeTab === "upcoming"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-600 border border-gray-200"
          }`}
        >
          {t.driver.upcoming}
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
            activeTab === "completed"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-600 border border-gray-200"
          }`}
        >
          {t.driver.completed}
        </button>
      </div>

      {/* Ride List */}
      {loading ? (
        <LoadingSpinner />
      ) : bookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Car className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-900">
              {interpolate(t.driver.noRides, { tab: activeTab === "upcoming" ? t.driver.upcoming.toLowerCase() : t.driver.completed.toLowerCase() })}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {activeTab === "upcoming"
                ? t.driver.noUpcomingDesc
                : t.driver.noCompletedDesc}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <Link
              key={booking.id}
              href={`/driver/rides/${booking.id}`}
              className="block"
            >
              <Card className="transition-shadow hover:shadow-md active:shadow-sm">
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-blue-600">
                        #{booking.bookingId}
                      </span>
                      <StatusBadge status={booking.status} label={getStatusLabel(t, booking.status)} />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>

                  {/* Date & Time */}
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(booking.travelDate)}</span>
                    {booking.pickupTime && (
                      <span className="ml-1">{booking.pickupTime}</span>
                    )}
                  </div>

                  {/* Locations */}
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                      <span className="text-sm text-gray-700 line-clamp-1">
                        {booking.pickupLocation}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                      <span className="text-sm text-gray-700 line-clamp-1">
                        {booking.dropLocation}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-3 flex items-center justify-between border-t pt-2">
                    <span className="text-xs text-gray-500">
                      {booking.customer.name}
                    </span>
                    {booking.totalAmount && (
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(booking.totalAmount)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
