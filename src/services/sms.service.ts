/**
 * SMS Gate service — sends SMS via SMS Gateway for Android.
 * Cloud API: https://api.sms-gate.app/3rdparty/v1
 * Docs: https://docs.sms-gate.app
 */

const SMS_GATE_BASE_URL = "https://api.sms-gate.app/3rdparty/v1";

interface SendSmsParams {
  to: string;
  message: string;
}

interface SendSmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("91") && cleaned.length === 12) return `+${cleaned}`;
  if (cleaned.length === 10) return `+91${cleaned}`;
  return `+${cleaned}`;
}

export async function sendSms(
  params: SendSmsParams,
  credentials: { user: string; password: string }
): Promise<SendSmsResult> {
  if (!credentials.user || !credentials.password) {
    console.warn("SMS Gate credentials not configured, skipping SMS");
    return { success: false, error: "SMS Gate not configured" };
  }

  try {
    const basicAuth = Buffer.from(`${credentials.user}:${credentials.password}`).toString("base64");

    const res = await fetch(`${SMS_GATE_BASE_URL}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify({
        phoneNumbers: [formatPhone(params.to)],
        textMessage: {
          text: params.message,
        },
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const errMsg = (errBody as { message?: string }).message || `HTTP ${res.status}`;
      console.error("SMS Gate error:", errMsg);
      return { success: false, error: errMsg };
    }

    const data = await res.json();
    return {
      success: true,
      messageId: data.id || undefined,
    };
  } catch (error) {
    console.error("SMS send error:", error);
    return { success: false, error: String(error) };
  }
}
