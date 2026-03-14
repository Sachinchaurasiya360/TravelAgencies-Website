"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { format, startOfMonth, endOfMonth, isSameDay, isAfter, startOfDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDayButton } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/language-context";
import { Car, MapPin, Loader2 } from "lucide-react";
import Link from "next/link";
import type { DayButton } from "react-day-picker";

interface CalendarTrip {
  id: string;
  bookingId: string;
  travelDate: string;
  pickupLocation: string;
  dropLocation: string;
  pickupTime: string | null;
  status: string;
  totalAmount: string | null;
  customer: { id: string; name: string; phone: string };
  driver: { id: string; name: string } | null;
}

export function BookingCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [trips, setTrips] = useState<CalendarTrip[]>([]);
  const [loading, setLoading] = useState(false);
  const t = useT();

  const fetchTrips = useCallback(async (month: Date) => {
    setLoading(true);
    const from = format(startOfMonth(month), "yyyy-MM-dd");
    const to = format(endOfMonth(month), "yyyy-MM-dd");
    try {
      const res = await fetch(
        `/api/bookings?fromDate=${from}&toDate=${to}&limit=100&sortBy=travelDate&sortOrder=asc`
      );
      const result = await res.json();
      if (result.success) {
        setTrips(result.data.bookings);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips(currentMonth);
  }, [currentMonth, fetchTrips]);

  // Build set of dates that have trips for modifier
  const tripDates = useMemo(
    () => trips.map((t) => new Date(t.travelDate)),
    [trips]
  );

  // Trips for the selected date
  const selectedTrips = useMemo(() => {
    if (!selectedDate) return [];
    return trips.filter((t) => isSameDay(new Date(t.travelDate), selectedDate));
  }, [selectedDate, trips]);

  // Upcoming trips (today and future, sorted by date)
  const upcomingTrips = useMemo(() => {
    const today = startOfDay(new Date());
    return trips
      .filter((t) => {
        const d = new Date(t.travelDate);
        return isSameDay(d, today) || isAfter(d, today);
      })
      .slice(0, 10);
  }, [trips]);

  // Custom DayButton that shows dot for days with trips
  function TripDayButton(props: React.ComponentProps<typeof DayButton>) {
    const hasTrips = tripDates.some((d) => isSameDay(d, props.day.date));
    return (
      <div className="relative flex flex-col items-center">
        <CalendarDayButton {...props} />
        {hasTrips && (
          <div className="absolute bottom-0.5 flex gap-0.5">
            <span className="h-1 w-1 rounded-full bg-orange-500" />
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
            <Car className="h-4 w-4 text-orange-600" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-gray-900">
              {t.dashboard.tripCalendar}
            </CardTitle>
            <p className="text-xs text-gray-500">{t.dashboard.clickDateToSee}</p>
          </div>
        </div>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
          {/* Calendar */}
          <div className="flex justify-center lg:justify-start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              components={{ DayButton: TripDayButton }}
              showOutsideDays
            />
          </div>

          {/* Trip list for selected date */}
          <div className="min-w-0">
            {selectedDate ? (
              <>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  {format(selectedDate, "EEEE, d MMMM yyyy")}
                  {selectedTrips.length > 0 && (
                    <span className="ml-2 rounded-md bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
                      {selectedTrips.length}
                    </span>
                  )}
                </h4>
                {selectedTrips.length === 0 ? (
                  <p className="text-sm text-gray-400 py-6 text-center lg:text-left">
                    {t.dashboard.noTripsOnDate}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {selectedTrips.map((trip) => (
                      <Link
                        key={trip.id}
                        href={`/admin/bookings/${trip.id}`}
                        className="block rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">
                              #{trip.bookingId}
                            </span>
                            <StatusBadge status={trip.status} />
                          </div>
                          {trip.pickupTime && (
                            <span className="text-xs text-gray-500">
                              {new Date(`1970-01-01T${trip.pickupTime}`).toLocaleTimeString(
                                "en-IN",
                                { hour: "numeric", minute: "2-digit", hour12: true }
                              )}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {trip.customer.name}
                          <span className="ml-1 text-gray-400 text-xs">
                            {trip.customer.phone}
                          </span>
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {trip.pickupLocation} → {trip.dropLocation}
                          </span>
                        </div>
                        {trip.driver && (
                          <p className="text-xs text-blue-600 mt-1">
                            {t.dashboard.driverLabel.replace("{name}", trip.driver.name)}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  {t.dashboard.upcomingTripsMonth}
                  {upcomingTrips.length > 0 && (
                    <span className="ml-2 rounded-md bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
                      {upcomingTrips.length}
                    </span>
                  )}
                </h4>
                {upcomingTrips.length === 0 ? (
                  <p className="text-sm text-gray-400 py-6 text-center lg:text-left">
                    {t.dashboard.noUpcomingTripsMonth}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {upcomingTrips.map((trip) => {
                      const travelDate = new Date(trip.travelDate);
                      const today = startOfDay(new Date());
                      const diffDays = Math.round(
                        (travelDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                      );
                      const isToday = diffDays === 0;
                      const isTomorrow = diffDays === 1;

                      return (
                        <Link
                          key={trip.id}
                          href={`/admin/bookings/${trip.id}`}
                          className="block rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex h-6 min-w-6 items-center justify-center rounded text-[10px] font-bold ${
                                  isToday
                                    ? "bg-red-100 text-red-700"
                                    : isTomorrow
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {isToday ? t.common.today : isTomorrow ? t.common.tomorrow : t.common.daysShort.replace("{days}", String(diffDays))}
                              </span>
                              <span className="text-sm font-semibold text-gray-900">
                                #{trip.bookingId}
                              </span>
                              <StatusBadge status={trip.status} />
                            </div>
                            {trip.pickupTime && (
                              <span className="text-xs text-gray-500">
                                {new Date(`1970-01-01T${trip.pickupTime}`).toLocaleTimeString(
                                  "en-IN",
                                  { hour: "numeric", minute: "2-digit", hour12: true }
                                )}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {trip.customer.name}
                            <span className="ml-1 text-gray-400 text-xs">
                              {trip.customer.phone}
                            </span>
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                              {trip.pickupLocation} → {trip.dropLocation}
                            </span>
                          </div>
                          {trip.driver && (
                            <p className="text-xs text-blue-600 mt-1">
                              {t.dashboard.driverLabel.replace("{name}", trip.driver.name)}
                            </p>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
