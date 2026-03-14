"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatDateTime } from "@/lib/helpers/date";
import { useT } from "@/lib/i18n/language-context";
import { interpolate } from "@/lib/i18n";
import { Bell, Send, ChevronLeft, ChevronRight } from "lucide-react";

interface Reminder {
  id: string;
  type: string;
  channel: string;
  recipient: string;
  subject: string | null;
  status: string;
  sentAt: string | null;
  createdAt: string;
  booking: {
    id: string;
    bookingId: string;
  } | null;
  customer: {
    id: string;
    name: string;
  } | null;
}

interface OutstandingBooking {
  id: string;
  bookingId: string;
  customer: { name: string; phone: string };
  outstanding: number;
}

export default function RemindersPage() {
  const t = useT();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Send reminder dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [outstandingBookings, setOutstandingBookings] = useState<OutstandingBooking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [channel, setChannel] = useState("EMAIL");
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        type: "PAYMENT_REMINDER",
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      const res = await fetch(`/api/notifications?${params}`);
      const result = await res.json();

      if (result.success) {
        setReminders(result.data.notifications);
        setTotalPages(result.data.pagination.totalPages);
      }
    } catch {
      toast.error(t.reminders.fetchFailed);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  async function fetchOutstandingBookings() {
    try {
      const res = await fetch("/api/reports/outstanding?limit=100");
      const result = await res.json();
      if (result.success) {
        setOutstandingBookings(result.data.bookings);
      }
    } catch {
      toast.error(t.reminders.loadBookingsFailed);
    }
  }

  function openSendDialog() {
    fetchOutstandingBookings();
    setSelectedBookingId("");
    setChannel("EMAIL");
    setCustomMessage("");
    setDialogOpen(true);
  }

  async function handleSendReminder() {
    if (!selectedBookingId) {
      toast.error(t.reminders.selectBookingError);
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedBookingId,
          channel,
          message: customMessage || undefined,
        }),
      });
      const result = await res.json();
      if (result.success) {
        // If WhatsApp channel, open wa.me URL in a new tab
        const waResult = result.data?.results?.find(
          (r: { channel: string; whatsappUrl?: string }) =>
            r.channel === "WHATSAPP" && r.whatsappUrl
        );
        if (waResult?.whatsappUrl) {
          window.open(waResult.whatsappUrl, "_blank");
        }
        toast.success(
          waResult?.whatsappUrl
            ? t.reminders.whatsappOpened
            : t.reminders.reminderSent
        );
        setDialogOpen(false);
        fetchReminders();
      } else {
        toast.error(result.error || t.reminders.sendFailed);
      }
    } catch {
      toast.error(t.reminders.sendFailed);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.reminders.title}
        description={t.reminders.subtitle}
      >
        <Button onClick={openSendDialog}>
          <Send className="mr-2 h-4 w-4" />
          {t.reminders.sendReminder}
        </Button>
      </PageHeader>

      {/* Reminder Logs */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <LoadingSpinner />
          ) : reminders.length === 0 ? (
            <EmptyState
              icon={Bell}
              title={t.reminders.noRemindersSent}
              description={t.reminders.noRemindersMatch}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b text-left">
                      <th className="p-4 font-medium">{t.reminders.recipient}</th>
                      <th className="p-4 font-medium">{t.reminders.customer}</th>
                      <th className="p-4 font-medium">{t.reminders.booking}</th>
                      <th className="p-4 font-medium">{t.reminders.channel}</th>
                      <th className="p-4 font-medium">{t.reminders.status}</th>
                      <th className="p-4 font-medium">{t.reminders.sentAt}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reminders.map((reminder) => (
                      <tr
                        key={reminder.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="p-4">
                          <p className="font-medium">{reminder.recipient}</p>
                          {reminder.subject && (
                            <p className="text-muted-foreground text-xs">
                              {reminder.subject}
                            </p>
                          )}
                        </td>
                        <td className="p-4">
                          {reminder.customer?.name || "-"}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {reminder.booking?.bookingId || "-"}
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                            {reminder.channel}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              reminder.status === "SENT"
                                ? "bg-green-100 text-green-800"
                                : reminder.status === "FAILED"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {reminder.status}
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {reminder.sentAt
                            ? formatDateTime(reminder.sentAt)
                            : formatDateTime(reminder.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t p-4">
                <p className="text-muted-foreground text-sm">
                  {interpolate(t.common.pageOf, { page, total: totalPages })}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t.common.prev}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    {t.common.next}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Send Reminder Dialog */}
      <ConfirmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={t.reminders.dialogTitle}
        description={t.reminders.dialogDescription}
        confirmLabel={sending ? t.common.sending : t.reminders.sendReminder}
        onConfirm={handleSendReminder}
        loading={sending}
      >
        <div className="space-y-4 py-2">
          <div>
            <Label>{t.reminders.bookingRequired}</Label>
            <Select value={selectedBookingId} onValueChange={setSelectedBookingId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={t.reminders.selectBooking} />
              </SelectTrigger>
              <SelectContent>
                {outstandingBookings.length === 0 ? (
                  <SelectItem value="_none" disabled>
                    {t.reminders.noOutstandingBookings}
                  </SelectItem>
                ) : (
                  outstandingBookings.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.bookingId} - {b.customer.name} ({b.customer.phone})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t.reminders.channelRequired}</Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EMAIL">{t.reminders.channelEmail}</SelectItem>
                <SelectItem value="WHATSAPP">{t.reminders.channelWhatsApp}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t.reminders.customMessage}</Label>
            <Textarea
              placeholder={t.reminders.messagePlaceholder}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
              className="mt-1"
            />
          </div>
        </div>
      </ConfirmDialog>
    </div>
  );
}
