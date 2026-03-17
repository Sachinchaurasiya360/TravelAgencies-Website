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
import { Truck, Plus, ChevronLeft, ChevronRight } from "lucide-react";

interface Vendor {
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
  _count: { bookings: number };
}

export default function VendorsPage() {
  const t = useT();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  // Add/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formState, setFormState] = useState("");
  const [formVehicles, setFormVehicles] = useState("");
  const [formRateInfo, setFormRateInfo] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/vendors?${params}`);
      const result = await res.json();
      if (result.success) {
        setVendors(result.data.vendors);
        setTotalPages(result.data.pagination.totalPages);
      }
    } catch {
      toast.error(t.vendors.fetchFailed);
    } finally {
      setLoading(false);
    }
  }, [page, search, t.vendors.fetchFailed]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  function openAddDialog() {
    setEditingVendor(null);
    setFormName("");
    setFormPhone("");
    setFormEmail("");
    setFormAddress("");
    setFormCity("");
    setFormState("");
    setFormVehicles("");
    setFormRateInfo("");
    setFormNotes("");
    setDialogOpen(true);
  }

  function openEditDialog(vendor: Vendor) {
    setEditingVendor(vendor);
    setFormName(vendor.name);
    setFormPhone(vendor.phone);
    setFormEmail(vendor.email || "");
    setFormAddress(vendor.address || "");
    setFormCity(vendor.city || "");
    setFormState(vendor.state || "");
    setFormVehicles(vendor.vehicles || "");
    setFormRateInfo(vendor.rateInfo || "");
    setFormNotes(vendor.notes || "");
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!formName.trim() || !formPhone.trim()) {
      toast.error(t.vendors.namePhoneRequired);
      return;
    }
    setSaving(true);
    try {
      const url = editingVendor
        ? `/api/vendors/${editingVendor.id}`
        : "/api/vendors";
      const method = editingVendor ? "PATCH" : "POST";
      const payload: Record<string, string> = {
        name: formName.trim(),
        phone: formPhone.trim(),
      };
      if (formEmail.trim()) payload.email = formEmail.trim();
      if (formAddress.trim()) payload.address = formAddress.trim();
      if (formCity.trim()) payload.city = formCity.trim();
      if (formState.trim()) payload.state = formState.trim();
      if (formVehicles.trim()) payload.vehicles = formVehicles.trim();
      if (formRateInfo.trim()) payload.rateInfo = formRateInfo.trim();
      if (formNotes.trim()) payload.notes = formNotes.trim();

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(
          editingVendor ? t.vendors.vendorUpdated : t.vendors.vendorAdded
        );
        setDialogOpen(false);
        fetchVendors();
      } else {
        toast.error(result.error || t.vendors.saveFailed);
      }
    } catch {
      toast.error(t.vendors.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(vendor: Vendor) {
    try {
      const res = await fetch(`/api/vendors/${vendor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !vendor.isActive }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(
          vendor.isActive
            ? t.vendors.vendorDeactivated
            : t.vendors.vendorActivated
        );
        fetchVendors();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error(t.vendors.statusFailed);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t.vendors.title} description={t.vendors.subtitle}>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          {t.vendors.addVendor}
        </Button>
      </PageHeader>

      {/* Search */}
      <div className="flex gap-3">
        <Input
          placeholder={t.vendors.searchPlaceholder}
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
          ) : vendors.length === 0 ? (
            <EmptyState
              icon={Truck}
              title={t.vendors.noVendorsFound}
              description={t.vendors.noVendorsMatch}
            />
          ) : (
            <>
              {/* Mobile card view */}
              <div className="divide-y divide-gray-100 sm:hidden">
                {vendors.map((vendor) => (
                  <div key={vendor.id} className="px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {vendor.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {vendor.phone}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          vendor.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {vendor.isActive
                          ? t.common.active
                          : t.common.inactive}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{vendor.city || "-"}</span>
                      <span>
                        {vendor._count.bookings}{" "}
                        {t.vendors.bookings.toLowerCase()}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => openEditDialog(vendor)}
                      >
                        {t.common.edit}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => toggleActive(vendor)}
                      >
                        {vendor.isActive
                          ? t.vendors.deactivate
                          : t.vendors.activate}
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
                      <th className="p-4 font-medium">{t.vendors.name}</th>
                      <th className="p-4 font-medium">{t.vendors.phone}</th>
                      <th className="p-4 font-medium">{t.vendors.city}</th>
                      <th className="p-4 font-medium">
                        {t.vendors.bookings}
                      </th>
                      <th className="p-4 font-medium">
                        {t.vendors.status}
                      </th>
                      <th className="p-4 font-medium">
                        {t.common.actions}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map((vendor) => (
                      <tr
                        key={vendor.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{vendor.name}</p>
                            {vendor.email && (
                              <p className="text-xs text-gray-500">
                                {vendor.email}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">{vendor.phone}</td>
                        <td className="p-4 text-gray-500">
                          {vendor.city || "-"}
                        </td>
                        <td className="p-4">{vendor._count.bookings}</td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              vendor.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {vendor.isActive
                              ? t.common.active
                              : t.common.inactive}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(vendor)}
                            >
                              {t.common.edit}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleActive(vendor)}
                            >
                              {vendor.isActive
                                ? t.vendors.deactivate
                                : t.vendors.activate}
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
                    {interpolate(t.common.pageOf, {
                      page,
                      total: totalPages,
                    })}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" /> {t.common.prev}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                    >
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
        title={
          editingVendor
            ? t.vendors.editDialogTitle
            : t.vendors.addDialogTitle
        }
        description={
          editingVendor
            ? t.vendors.editDialogDescription
            : t.vendors.addDialogDescription
        }
        confirmLabel={
          saving
            ? t.common.saving
            : editingVendor
              ? t.common.update
              : t.vendors.addVendor
        }
        onConfirm={handleSave}
        loading={saving}
      >
        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
          <div>
            <Label>{t.vendors.nameRequired}</Label>
            <Input
              placeholder={t.vendors.namePlaceholder}
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>{t.vendors.phoneRequired}</Label>
            <Input
              placeholder={t.vendors.phonePlaceholder}
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>
              {t.vendors.email}{" "}
              <span className="text-gray-400">({t.common.optional})</span>
            </Label>
            <Input
              type="email"
              placeholder={t.vendors.emailPlaceholder}
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>
              {t.vendors.address}{" "}
              <span className="text-gray-400">({t.common.optional})</span>
            </Label>
            <Input
              placeholder="Full address"
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>
                {t.vendors.city}{" "}
                <span className="text-gray-400">({t.common.optional})</span>
              </Label>
              <Input
                value={formCity}
                onChange={(e) => setFormCity(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>
                {t.vendors.state}{" "}
                <span className="text-gray-400">({t.common.optional})</span>
              </Label>
              <Input
                value={formState}
                onChange={(e) => setFormState(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label>
              {t.vendors.vehicles}{" "}
              <span className="text-gray-400">({t.common.optional})</span>
            </Label>
            <textarea
              placeholder="List of vehicles available (e.g., Innova, Ertiga, Swift Dzire)"
              value={formVehicles}
              onChange={(e) => setFormVehicles(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              rows={2}
            />
          </div>
          <div>
            <Label>
              {t.vendors.rateInfo}{" "}
              <span className="text-gray-400">({t.common.optional})</span>
            </Label>
            <textarea
              placeholder="Rate/pricing information"
              value={formRateInfo}
              onChange={(e) => setFormRateInfo(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              rows={2}
            />
          </div>
          <div>
            <Label>
              {t.vendors.notes}{" "}
              <span className="text-gray-400">({t.common.optional})</span>
            </Label>
            <textarea
              placeholder="Additional notes"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              rows={2}
            />
          </div>
        </div>
      </ConfirmDialog>
    </div>
  );
}
