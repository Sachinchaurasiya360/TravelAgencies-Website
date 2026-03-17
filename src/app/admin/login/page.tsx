"use client";

import { useState, useEffect, useCallback } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useT } from "@/lib/i18n/language-context";
import { Bus, Loader2, ArrowLeft } from "lucide-react";

const RESEND_COOLDOWN = 60; // seconds

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const t = useT();

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const sendOtp = useCallback(async () => {
    if (!email) {
      toast.error(t.login.fillAllFields);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await res.json();

      if (result.success) {
        setStep("otp");
        setCooldown(RESEND_COOLDOWN);
        toast.success(t.login.otpSent);
      } else {
        toast.error(result.error || t.login.genericError);
      }
    } catch {
      toast.error(t.login.genericError);
    } finally {
      setLoading(false);
    }
  }, [email, t]);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    await sendOtp();
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();

    if (!code || code.length !== 6) {
      toast.error(t.login.otpInvalid);
      return;
    }

    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        code,
        redirect: false,
      });

      if (result?.error) {
        toast.error(t.login.otpInvalid);
        return;
      }

      toast.success(t.login.success);
      router.push("/admin");
      router.refresh();
    } catch {
      toast.error(t.login.genericError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <Bus className="h-6 w-6 text-orange-500" />
          </div>
          <CardTitle className="text-2xl">{t.login.title}</CardTitle>
          <CardDescription>
            {step === "email" ? t.login.subtitle : t.login.otpSubtitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <Label htmlFor="email">{t.login.email}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t.login.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t.login.sendOtp}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <Label htmlFor="otp">{t.login.otpLabel}</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder={t.login.otpPlaceholder}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="mt-1 text-center text-2xl tracking-[0.5em] font-mono"
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t.login.verifyOtp}
              </Button>
              <div className="flex items-center justify-between text-sm">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-gray-500"
                  onClick={() => {
                    setStep("email");
                    setCode("");
                  }}
                >
                  <ArrowLeft className="mr-1 h-3 w-3" />
                  {t.login.changeEmail}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-gray-500"
                  disabled={cooldown > 0 || loading}
                  onClick={() => sendOtp()}
                >
                  {cooldown > 0
                    ? `${t.login.resendIn} ${cooldown}s`
                    : t.login.resendOtp}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
