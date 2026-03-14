"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AdminBookingForm } from "./admin-booking-form";
import { useT } from "@/lib/i18n/language-context";
import { Plus } from "lucide-react";

export function DashboardActions() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const t = useT();

  return (
    <div className="space-y-4">
      <Button onClick={() => setShowForm(!showForm)} size="sm">
        <Plus className="mr-2 h-4 w-4" />
        {showForm ? t.common.close : t.dashboard.newBooking}
      </Button>
      {showForm && (
        <AdminBookingForm
          onSuccess={() => {
            setShowForm(false);
            router.refresh();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
