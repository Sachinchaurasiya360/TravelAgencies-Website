"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AdminBookingForm } from "./admin-booking-form";
import { useT } from "@/lib/i18n/language-context";
import { Plus } from "lucide-react";

export function DashboardActions() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const t = useT();

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" />
        {t.dashboard.newBooking}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.dashboard.newBooking}</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new booking.
            </DialogDescription>
          </DialogHeader>
          <AdminBookingForm
            onSuccess={() => {
              setOpen(false);
              router.refresh();
            }}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
