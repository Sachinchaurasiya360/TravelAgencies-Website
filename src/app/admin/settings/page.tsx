"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PageHeader } from "@/components/shared/page-header";
import { Building2, Receipt, Landmark, Bell, Save } from "lucide-react";
import { useT } from "@/lib/i18n/language-context";

interface Settings {
  // Company Info
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  companyWebsite: string;
  // GST Config
  gstNumber: string;
  gstRate: string;
  sacCode: string;
  placeOfSupply: string;
  // Bank Details
  bankName: string;
  bankAccountNumber: string;
  bankIfscCode: string;
  bankAccountHolder: string;
  bankBranch: string;
  // Notification Toggles
  emailNotifications: boolean;
  smsNotifications: boolean;
  whatsappNotifications: boolean;
  paymentReminders: boolean;
  bookingConfirmations: boolean;
}

const defaultSettings: Settings = {
  companyName: "",
  companyEmail: "",
  companyPhone: "",
  companyAddress: "",
  companyWebsite: "",
  gstNumber: "",
  gstRate: "5",
  sacCode: "9964",
  placeOfSupply: "",
  bankName: "",
  bankAccountNumber: "",
  bankIfscCode: "",
  bankAccountHolder: "",
  bankBranch: "",
  emailNotifications: true,
  smsNotifications: false,
  whatsappNotifications: false,
  paymentReminders: true,
  bookingConfirmations: true,
};

export default function SettingsPage() {
  const t = useT();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        const result = await res.json();
        if (result.success) {
          setSettings({ ...defaultSettings, ...result.data });
        }
      } catch {
        toast.error(t.settings.fetchFailed);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  function updateField(field: keyof Settings, value: string | boolean) {
    setSettings((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(t.settings.settingsSaved);
      } else {
        toast.error(result.error || t.settings.saveFailed);
      }
    } catch {
      toast.error(t.settings.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.settings.title}
        description={t.settings.subtitle}
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              {t.settings.companyInfo}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="companyName">{t.settings.companyName}</Label>
                <Input
                  id="companyName"
                  value={settings.companyName}
                  onChange={(e) => updateField("companyName", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="companyEmail">{t.settings.companyEmail}</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={settings.companyEmail}
                  onChange={(e) => updateField("companyEmail", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="companyPhone">{t.settings.companyPhone}</Label>
                <Input
                  id="companyPhone"
                  value={settings.companyPhone}
                  onChange={(e) => updateField("companyPhone", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="companyWebsite">{t.settings.companyWebsite}</Label>
                <Input
                  id="companyWebsite"
                  value={settings.companyWebsite}
                  onChange={(e) => updateField("companyWebsite", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="companyAddress">{t.settings.companyAddress}</Label>
              <Input
                id="companyAddress"
                value={settings.companyAddress}
                onChange={(e) => updateField("companyAddress", e.target.value)}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* GST Config */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Receipt className="h-5 w-5" />
              {t.settings.gstConfig}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="gstNumber">{t.settings.gstNumber}</Label>
                <Input
                  id="gstNumber"
                  value={settings.gstNumber}
                  onChange={(e) => updateField("gstNumber", e.target.value)}
                  placeholder={t.settings.gstNumberPlaceholder}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="gstRate">{t.settings.gstRate}</Label>
                <Input
                  id="gstRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.gstRate}
                  onChange={(e) => updateField("gstRate", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="sacCode">{t.settings.sacCode}</Label>
                <Input
                  id="sacCode"
                  value={settings.sacCode}
                  onChange={(e) => updateField("sacCode", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="placeOfSupply">{t.settings.placeOfSupply}</Label>
                <Input
                  id="placeOfSupply"
                  value={settings.placeOfSupply}
                  onChange={(e) => updateField("placeOfSupply", e.target.value)}
                  placeholder={t.settings.placeOfSupplyPlaceholder}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Landmark className="h-5 w-5" />
              {t.settings.bankDetails}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="bankName">{t.settings.bankName}</Label>
                <Input
                  id="bankName"
                  value={settings.bankName}
                  onChange={(e) => updateField("bankName", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="bankAccountHolder">{t.settings.accountHolderName}</Label>
                <Input
                  id="bankAccountHolder"
                  value={settings.bankAccountHolder}
                  onChange={(e) =>
                    updateField("bankAccountHolder", e.target.value)
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="bankAccountNumber">{t.settings.accountNumber}</Label>
                <Input
                  id="bankAccountNumber"
                  value={settings.bankAccountNumber}
                  onChange={(e) =>
                    updateField("bankAccountNumber", e.target.value)
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="bankIfscCode">{t.settings.ifscCode}</Label>
                <Input
                  id="bankIfscCode"
                  value={settings.bankIfscCode}
                  onChange={(e) => updateField("bankIfscCode", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="bankBranch">{t.settings.branch}</Label>
                <Input
                  id="bankBranch"
                  value={settings.bankBranch}
                  onChange={(e) => updateField("bankBranch", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Toggles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5" />
              {t.settings.notifications}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t.settings.emailNotifications}</p>
                <p className="text-muted-foreground text-xs">
                  {t.settings.emailNotificationsDesc}
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) =>
                  updateField("emailNotifications", checked)
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t.settings.whatsappNotifications}</p>
                <p className="text-muted-foreground text-xs">
                  {t.settings.whatsappNotificationsDesc}
                </p>
              </div>
              <Switch
                checked={settings.whatsappNotifications}
                onCheckedChange={(checked) =>
                  updateField("whatsappNotifications", checked)
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t.settings.paymentReminders}</p>
                <p className="text-muted-foreground text-xs">
                  {t.settings.paymentRemindersDesc}
                </p>
              </div>
              <Switch
                checked={settings.paymentReminders}
                onCheckedChange={(checked) =>
                  updateField("paymentReminders", checked)
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t.settings.bookingConfirmations}</p>
                <p className="text-muted-foreground text-xs">
                  {t.settings.bookingConfirmationsDesc}
                </p>
              </div>
              <Switch
                checked={settings.bookingConfirmations}
                onCheckedChange={(checked) =>
                  updateField("bookingConfirmations", checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={saving} size="lg">
            <Save className="mr-2 h-4 w-4" />
            {saving ? t.common.saving : t.settings.saveSettings}
          </Button>
        </div>
      </form>
    </div>
  );
}
