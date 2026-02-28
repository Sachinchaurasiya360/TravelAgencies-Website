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
        toast.error("Failed to fetch settings");
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
        toast.success("Settings saved successfully");
      } else {
        toast.error(result.error || "Failed to save settings");
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your business configuration"
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={settings.companyName}
                  onChange={(e) => updateField("companyName", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="companyEmail">Email</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={settings.companyEmail}
                  onChange={(e) => updateField("companyEmail", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="companyPhone">Phone</Label>
                <Input
                  id="companyPhone"
                  value={settings.companyPhone}
                  onChange={(e) => updateField("companyPhone", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="companyWebsite">Website</Label>
                <Input
                  id="companyWebsite"
                  value={settings.companyWebsite}
                  onChange={(e) => updateField("companyWebsite", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="companyAddress">Address</Label>
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
              GST Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="gstNumber">GST Number</Label>
                <Input
                  id="gstNumber"
                  value={settings.gstNumber}
                  onChange={(e) => updateField("gstNumber", e.target.value)}
                  placeholder="e.g., 27AAAAA0000A1Z5"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="gstRate">GST Rate (%)</Label>
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
                <Label htmlFor="sacCode">SAC Code</Label>
                <Input
                  id="sacCode"
                  value={settings.sacCode}
                  onChange={(e) => updateField("sacCode", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="placeOfSupply">Place of Supply</Label>
                <Input
                  id="placeOfSupply"
                  value={settings.placeOfSupply}
                  onChange={(e) => updateField("placeOfSupply", e.target.value)}
                  placeholder="e.g., Maharashtra"
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
              Bank Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={settings.bankName}
                  onChange={(e) => updateField("bankName", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="bankAccountHolder">Account Holder Name</Label>
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
                <Label htmlFor="bankAccountNumber">Account Number</Label>
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
                <Label htmlFor="bankIfscCode">IFSC Code</Label>
                <Input
                  id="bankIfscCode"
                  value={settings.bankIfscCode}
                  onChange={(e) => updateField("bankIfscCode", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="bankBranch">Branch</Label>
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
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Email Notifications</p>
                <p className="text-muted-foreground text-xs">
                  Send notifications via email
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
                <p className="text-sm font-medium">SMS Notifications</p>
                <p className="text-muted-foreground text-xs">
                  Send notifications via SMS
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
                <p className="text-sm font-medium">WhatsApp Notifications</p>
                <p className="text-muted-foreground text-xs">
                  Send notifications via WhatsApp
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
                <p className="text-sm font-medium">Payment Reminders</p>
                <p className="text-muted-foreground text-xs">
                  Automatically send payment due reminders
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
                <p className="text-sm font-medium">Booking Confirmations</p>
                <p className="text-muted-foreground text-xs">
                  Send booking confirmation notifications to customers
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
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
