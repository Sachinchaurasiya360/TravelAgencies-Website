import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { otpRequestSchema } from "@/validators/auth.validator";
import { sendEmail, otpEmail } from "@/services/email.service";

const OTP_EXPIRY_MINUTES = 10;
const OTP_RECIPIENT = "sarthaktourandtravelpune@gmail.com";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/auth/otp/send — Send OTP to fixed email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = otpRequestSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const { email } = parsed.data;

    // Check user exists, is active, and is not a DRIVER
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, isActive: true, role: true },
    });

    if (!user || !user.isActive || user.role === "DRIVER") {
      // Don't reveal whether account exists
      return successResponse({ sent: true });
    }

    // Delete any existing OTPs for this email
    await prisma.loginOtp.deleteMany({ where: { email } });

    // Generate and store OTP
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.loginOtp.create({
      data: { email, code, expiresAt },
    });

    // Send OTP email to fixed recipient
    const emailData = otpEmail({ otp: code, userEmail: email });
    await sendEmail({
      to: OTP_RECIPIENT,
      subject: emailData.subject,
      html: emailData.html,
    });

    return successResponse({ sent: true });
  } catch (error) {
    console.error("OTP send error:", error);
    return errorResponse("Failed to send OTP", 500);
  }
}
