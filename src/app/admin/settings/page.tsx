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
import { Building2, Bell, Save, Smartphone } from "lucide-react";
import { useT } from "@/lib/i18n/language-context";

interface Settings {
  // Company Info
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  companyWebsite: string;
  // Notification Toggles
  emailNotifications: boolean;
  smsNotifications: boolean;
  whatsappNotifications: boolean;
  paymentReminders: boolean;
  bookingConfirmations: boolean;
  // SMS Gate
  smsGateUser: string;
  smsGatePassword: string;
}

const defaultSettings: Settings = {
  companyName: "",
  companyEmail: "",
  companyPhone: "",
  companyAddress: "",
  companyWebsite: "",
  emailNotifications: true,
  smsNotifications: false,
  whatsappNotifications: false,
  paymentReminders: true,
  bookingConfirmations: true,
  smsGateUser: "",
  smsGatePassword: "",
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
                <p className="text-sm font-medium">{t.settings.smsNotifications}</p>
                <p className="text-muted-foreground text-xs">
                  {t.settings.smsNotificationsDesc}
                </p>
              </div>
              <Switch
                checked={settings.smsNotifications}
                onCheckedChange={(checked) =>
                  updateField("smsNotifications", checked)
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

        {/* SMS Gate Configuration */}
        {settings.smsNotifications && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Smartphone className="h-5 w-5" />
                {t.settings.smsGateConfig}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-xs">
                {t.settings.smsGateDesc}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="smsGateUser">{t.settings.smsGateUser}</Label>
                  <Input
                    id="smsGateUser"
                    value={settings.smsGateUser}
                    onChange={(e) => updateField("smsGateUser", e.target.value)}
                    className="mt-1"
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <Label htmlFor="smsGatePassword">{t.settings.smsGatePassword}</Label>
                  <Input
                    id="smsGatePassword"
                    type="password"
                    value={settings.smsGatePassword}
                    onChange={(e) => updateField("smsGatePassword", e.target.value)}
                    className="mt-1"
                    placeholder="Enter password"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
