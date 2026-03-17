"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useT } from "@/lib/i18n/language-context";
import { interpolate } from "@/lib/i18n";
import { UserCheck, Plus, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import Link from "next/link";

interface Driver {
  id: string;
  name: string;
  phone: string | null;
  vehicleName: string | null;
  vehicleNumber: string | null;
  isActive: boolean;
  _count: { driverBookings: number };
}

export default function DriversPage() {
  const t = useT();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  // Add/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formVehicleName, setFormVehicleName] = useState("");
  const [formVehicleNumber, setFormVehicleNumber] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/drivers?${params}`);
      const result = await res.json();
      if (result.success) {
        setDrivers(result.data.drivers);
        setTotalPages(result.data.pagination.totalPages);
      }
    } catch {
      toast.error(t.drivers.fetchFailed);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  function openAddDialog() {
    setEditingDriver(null);
    setFormName("");
    setFormPhone("");
    setFormVehicleName("");
    setFormVehicleNumber("");
    setDialogOpen(true);
  }

  function openEditDialog(driver: Driver) {
    setEditingDriver(driver);
    setFormName(driver.name);
    setFormPhone(driver.phone || "");
    setFormVehicleName(driver.vehicleName || "");
    setFormVehicleNumber(driver.vehicleNumber || "");
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!formName.trim() || !formPhone.trim()) {
      toast.error(t.drivers.namePhoneRequired);
      return;
    }
    setSaving(true);
    try {
      const url = editingDriver ? `/api/drivers/${editingDriver.id}` : "/api/drivers";
      const method = editingDriver ? "PATCH" : "POST";
      const payload: Record<string, string> = {
        name: formName.trim(),
        phone: formPhone.trim(),
      };
      if (formVehicleName.trim()) payload.vehicleName = formVehicleName.trim();
      if (formVehicleNumber.trim()) payload.vehicleNumber = formVehicleNumber.trim();

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(editingDriver ? t.drivers.driverUpdated : t.drivers.driverAdded);
        setDialogOpen(false);
        fetchDrivers();
      } else {
        toast.error(result.error || t.drivers.saveFailed);
      }
    } catch {
      toast.error(t.drivers.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(driver: Driver) {
    try {
      const res = await fetch(`/api/drivers/${driver.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !driver.isActive }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(driver.isActive ? t.drivers.driverDeactivated : t.drivers.driverActivated);
        fetchDrivers();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error(t.drivers.statusFailed);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.drivers.title}
        description={t.drivers.subtitle}
      >
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          {t.drivers.addDriver}
        </Button>
      </PageHeader>

      {/* Search */}
      <div className="flex gap-3">
        <Input
          placeholder={t.drivers.searchPlaceholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <LoadingSpinner />
          ) : drivers.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title={t.drivers.noDriversFound}
              description={t.drivers.noDriversMatch}
            />
          ) : (
            <>
              {/* Mobile card view */}
              <div className="divide-y divide-gray-100 sm:hidden">
                {drivers.map((driver) => (
                  <div key={driver.id} className="px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{driver.name}</p>
                        <p className="text-xs text-gray-500">{driver.phone || "-"}</p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          driver.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {driver.isActive ? t.common.active : t.common.inactive}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{[driver.vehicleName, driver.vehicleNumber].filter(Boolean).join(" · ") || "-"}</span>
                      <span>{driver._count.driverBookings} {t.drivers.rides.toLowerCase()}</span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" asChild>
                        <Link href={`/admin/drivers/${driver.id}`}>
                          <Eye className="mr-1 h-3 w-3" />
                          {t.common.view}
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => openEditDialog(driver)}>
                        {t.common.edit}
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => toggleActive(driver)}>
                        {driver.isActive ? t.drivers.deactivate : t.drivers.activate}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b text-left">
                      <th className="p-4 font-medium">{t.drivers.name}</th>
                      <th className="p-4 font-medium">{t.drivers.phone}</th>
                      <th className="p-4 font-medium">{t.drivers.vehicleName}</th>
                      <th className="p-4 font-medium">{t.drivers.rides}</th>
                      <th className="p-4 font-medium">{t.drivers.status}</th>
                      <th className="p-4 font-medium">{t.common.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drivers.map((driver) => (
                      <tr key={driver.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="p-4 font-medium">{driver.name}</td>
                        <td className="p-4">{driver.phone || "-"}</td>
                        <td className="p-4 text-gray-500">
                          {driver.vehicleName || driver.vehicleNumber
                            ? [driver.vehicleName, driver.vehicleNumber].filter(Boolean).join(" · ")
                            : "-"}
                        </td>
                        <td className="p-4">{driver._count.driverBookings}</td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              driver.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {driver.isActive ? t.common.active : t.common.inactive}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/admin/drivers/${driver.id}`}>
                                {t.common.view}
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(driver)}>
                              {t.common.edit}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleActive(driver)}
                            >
                              {driver.isActive ? t.drivers.deactivate : t.drivers.activate}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t p-4">
                  <p className="text-muted-foreground text-sm">
                    {interpolate(t.common.pageOf, { page, total: totalPages })}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                      <ChevronLeft className="h-4 w-4" /> {t.common.prev}
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                      {t.common.next} <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <ConfirmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingDriver ? t.drivers.editDialogTitle : t.drivers.addDialogTitle}
        description={editingDriver ? t.drivers.editDialogDescription : t.drivers.addDialogDescription}
        confirmLabel={saving ? t.common.saving : editingDriver ? t.common.update : t.drivers.addDriver}
        onConfirm={handleSave}
        loading={saving}
      >
        <div className="space-y-4 py-2">
          <div>
            <Label>{t.drivers.nameRequired}</Label>
            <Input
              placeholder={t.drivers.namePlaceholder}
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>{t.drivers.phoneRequired}</Label>
            <Input
              placeholder={t.drivers.phonePlaceholder}
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t.drivers.vehicleName}</Label>
              <Input
                placeholder={t.drivers.vehicleNamePlaceholder}
                value={formVehicleName}
                onChange={(e) => setFormVehicleName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{t.drivers.vehicleNumber}</Label>
              <Input
                placeholder={t.drivers.vehicleNumberPlaceholder}
                value={formVehicleNumber}
                onChange={(e) => setFormVehicleNumber(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </ConfirmDialog>
    </div>
  );
}
