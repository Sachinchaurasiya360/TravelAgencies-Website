"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { formatCurrency } from "@/lib/helpers/currency";
import { useT } from "@/lib/i18n/language-context";
import { ArrowLeft, Truck, IndianRupee, MapPin, ChevronLeft, ChevronRight, Plus, UserCheck } from "lucide-react";

export const dynamic = "force-dynamic";

interface VendorInfo {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  vehicles: string | null;
  rateInfo: string | null;
  notes: string | null;
  isActive: boolean;
  drivers: VendorDriver[];
}

interface VendorDriver {
  id: string;
  name: string;
  phone: string | null;
  vehicleName: string | null;
  vehicleNumber: string | null;
  isActive: boolean;
  _count: { driverBookings: number };
}

interface VendorBooking {
  id: string;
  bookingId: string;
  status: string;
  travelDate: string;
  pickupLocation: string;
  dropLocation: string;
  vendorCost: string | number | null;
  totalAmount: string | number | null;
  customer: { name: string; phone: string };
}

interface BookingsData {
  bookings: VendorBooking[];
  summary: { totalTrips: number; totalVendorCost: string | number };
  pagination: { totalPages: number; currentPage: number; totalItems: number };
}

export default function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const t = useT();
  const [vendor, setVendor] = useState<VendorInfo | null>(null);
  const [data, setData] = useState<BookingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [driverDialogOpen, setDriverDialogOpen] = useState(false);
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [driverVehicleName, setDriverVehicleName] = useState("");
  const [driverVehicleNumber, setDriverVehicleNumber] = useState("");
  const [driverSaving, setDriverSaving] = useState(false);

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const [vendorRes, bookingsRes] = await Promise.all([
        fetch(`/api/vendors/${id}`),
        fetch(`/api/vendors/${id}/bookings?page=${p}&limit=20`),
      ]);
      const vendorResult = await vendorRes.json();
      const bookingsResult = await bookingsRes.json();

      if (vendorResult.success) setVendor(vendorResult.data);
      if (bookingsResult.success) setData(bookingsResult.data);
    } catch {
      toast.error(t.vendorDetail.fetchFailed);
    } finally {
      setLoading(false);
    }
  }, [id, t.vendorDetail.fetchFailed]);

  useEffect(() => {
    fetchData(page);
  }, [page, fetchData]);

  function openDriverDialog() {
    setDriverName("");
    setDriverPhone("");
    setDriverVehicleName("");
    setDriverVehicleNumber("");
    setDriverDialogOpen(true);
  }

  async function handleCreateDriver() {
    if (!driverName.trim() || !driverPhone.trim()) {
      toast.error(t.drivers.namePhoneRequired);
      return;
    }

    setDriverSaving(true);
    try {
      const payload: Record<string, string> = {
        name: driverName.trim(),
        phone: driverPhone.trim(),
        vendorId: id,
      };
      if (driverVehicleName.trim()) payload.vehicleName = driverVehicleName.trim();
      if (driverVehicleNumber.trim()) payload.vehicleNumber = driverVehicleNumber.trim();

      const res = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(t.drivers.driverAdded);
        setDriverDialogOpen(false);
        fetchData(page);
      } else {
        toast.error(result.error || t.drivers.saveFailed);
      }
    } catch {
      toast.error(t.drivers.saveFailed);
    } finally {
      setDriverSaving(false);
    }
  }

  if (loading && !vendor) return <LoadingSpinner />;
  if (!vendor) return <div className="p-8 text-center text-muted-foreground">{t.vendorDetail.fetchFailed}</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={vendor.name}
        description={`${vendor.phone}${vendor.city ? ` | ${vendor.city}` : ""}`}
      >
        <div className="flex gap-2">
          <StatusBadge status={vendor.isActive ? "ACTIVE" : "INACTIVE"} />
          <Button variant="outline" asChild>
            <Link href="/admin/vendors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t.common.back}
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* Vendor Info */}
      {(vendor.email || vendor.address || vendor.vehicles || vendor.rateInfo || vendor.notes) && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {vendor.email && (
                <div>
                  <p className="text-muted-foreground">{t.vendors.email}</p>
                  <p className="font-medium">{vendor.email}</p>
                </div>
              )}
              {vendor.address && (
                <div>
                  <p className="text-muted-foreground">{t.vendors.address}</p>
                  <p className="font-medium">{vendor.address}{vendor.state ? `, ${vendor.state}` : ""}</p>
                </div>
              )}
              {vendor.vehicles && (
                <div>
                  <p className="text-muted-foreground">{t.vendors.vehicles}</p>
                  <p className="font-medium">{vendor.vehicles}</p>
                </div>
              )}
              {vendor.rateInfo && (
                <div>
                  <p className="text-muted-foreground">{t.vendors.rateInfo}</p>
                  <p className="font-medium">{vendor.rateInfo}</p>
                </div>
              )}
              {vendor.notes && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <p className="text-muted-foreground">{t.vendors.notes}</p>
                  <p className="font-medium">{vendor.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {data && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t.vendorDetail.totalTrips}</CardTitle>
              <Truck className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.totalTrips}</div>
              <p className="text-muted-foreground text-xs">{t.vendorDetail.tripsAssigned}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t.vendorDetail.totalVendorCost}</CardTitle>
              <IndianRupee className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(data.summary.totalVendorCost)}
              </div>
              <p className="text-muted-foreground text-xs">{t.vendorDetail.paidToVendor}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Vendor Drivers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-500" />
              Vendor Drivers
            </span>
            <Button size="sm" onClick={openDriverDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Driver
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vendor.drivers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No drivers linked to this vendor yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b text-left">
                    <th className="p-3 font-medium">Name</th>
                    <th className="p-3 font-medium">Phone</th>
                    <th className="p-3 font-medium">Vehicle</th>
                    <th className="p-3 font-medium">Bookings</th>
                    <th className="p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vendor.drivers.map((driver) => (
                    <tr key={driver.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="p-3">
                        <Link href={`/admin/drivers/${driver.id}`} className="font-medium text-blue-600 hover:underline">
                          {driver.name}
                        </Link>
                      </td>
                      <td className="p-3">{driver.phone || "-"}</td>
                      <td className="p-3 text-muted-foreground">
                        {[driver.vehicleName, driver.vehicleNumber].filter(Boolean).join(" | ") || "-"}
                      </td>
                      <td className="p-3">{driver._count.driverBookings}</td>
                      <td className="p-3">
                        <StatusBadge status={driver.isActive ? "ACTIVE" : "INACTIVE"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t.vendorDetail.assignedBookings}</CardTitle>
        </CardHeader>
        <CardContent>
          {!data || data.bookings.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t.vendorDetail.noBookings}
            </p>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="divide-y sm:hidden">
                {data.bookings.map((b) => (
                  <div key={b.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <Link href={`/admin/bookings/${b.id}`} className="text-sm font-semibold text-blue-600 hover:underline">
                        {b.bookingId}
                      </Link>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">{b.customer.name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {b.pickupLocation} → {b.dropLocation}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>{new Date(b.travelDate).toLocaleDateString("en-IN")}</span>
                      {b.vendorCost && (
                        <span className="font-medium text-blue-600">{formatCurrency(b.vendorCost)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b text-left">
                      <th className="p-3 font-medium">{t.vendorDetail.bookingId}</th>
                      <th className="p-3 font-medium">{t.vendorDetail.customer}</th>
                      <th className="p-3 font-medium">{t.vendorDetail.travelDate}</th>
                      <th className="p-3 font-medium">{t.vendorDetail.route}</th>
                      <th className="p-3 font-medium text-right">{t.vendorDetail.vendorCost}</th>
                      <th className="p-3 font-medium">{t.vendorDetail.status}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bookings.map((b) => (
                      <tr key={b.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="p-3">
                          <Link href={`/admin/bookings/${b.id}`} className="font-medium text-blue-600 hover:underline">
                            {b.bookingId}
                          </Link>
                        </td>
                        <td className="p-3">
                          <p className="font-medium">{b.customer.name}</p>
                          <p className="text-xs text-muted-foreground">{b.customer.phone}</p>
                        </td>
                        <td className="p-3">{new Date(b.travelDate).toLocaleDateString("en-IN")}</td>
                        <td className="p-3 text-muted-foreground">
                          {b.pickupLocation} → {b.dropLocation}
                        </td>
                        <td className="p-3 text-right font-medium">
                          {b.vendorCost ? formatCurrency(b.vendorCost) : "-"}
                        </td>
                        <td className="p-3">
                          <StatusBadge status={b.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between border-t pt-4">
                  <p className="text-sm text-muted-foreground">
                    {t.common.page} {data.pagination.currentPage} / {data.pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={driverDialogOpen}
        onOpenChange={setDriverDialogOpen}
        title="Add vendor driver"
        description={`Create a driver linked to ${vendor.name}.`}
        confirmLabel={driverSaving ? t.common.saving : "Add Driver"}
        onConfirm={handleCreateDriver}
        loading={driverSaving}
      >
        <div className="space-y-4 py-2">
          <div>
            <Label>{t.drivers.nameRequired}</Label>
            <Input
              placeholder={t.drivers.namePlaceholder}
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>{t.drivers.phoneRequired}</Label>
            <Input
              placeholder={t.drivers.phonePlaceholder}
              value={driverPhone}
              onChange={(e) => setDriverPhone(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t.drivers.vehicleName}</Label>
              <Input
                placeholder={t.drivers.vehicleNamePlaceholder}
                value={driverVehicleName}
                onChange={(e) => setDriverVehicleName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{t.drivers.vehicleNumber}</Label>
              <Input
                placeholder={t.drivers.vehicleNumberPlaceholder}
                value={driverVehicleNumber}
                onChange={(e) => setDriverVehicleNumber(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </ConfirmDialog>
    </div>
  );
}
