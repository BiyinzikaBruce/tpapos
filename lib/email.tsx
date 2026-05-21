import { Resend } from "resend";
import { OTPTemplate } from "@/components/emails/otp-template";
import { ResetPasswordTemplate } from "@/components/emails/reset-password-template";
import { WelcomeTemplate } from "@/components/emails/welcome-template";
import { LowStockTemplate } from "@/components/emails/low-stock-template";
import { TransferRequestTemplate } from "@/components/emails/transfer-request-template";
import { formatUGX } from "@/lib/format";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? "placeholder");
}

export async function sendVerificationEmail(email: string, otp: string) {
  try {
    console.log(`Attempting to send OTP email to ${email}...`);

    if (!process.env.RESEND_API_KEY) {
      console.warn("WARNING: RESEND_API_KEY is not set. Email sending will likely fail.");
    }

    const { data, error } = await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: email,
      subject: "Your Verification Code",
      react: <OTPTemplate otp={otp} />,
    });

    if (error) {
      console.error("Resend API Error:", error);
      throw error;
    }

    console.log(`Email sent successfully to ${email}. ID:`, data?.id);
    return data;
  } catch (error) {
    console.error("Failed to send verification email:", error);
    if (error instanceof Error) {
      console.error("Error Message:", error.message);
      console.error("Error Stack:", error.stack);
    }
    throw error;
  }
}

export async function sendResetPasswordEmail(email: string, url: string) {
  try {
    console.log(`Attempting to send Reset Password email to ${email}...`);

    if (!process.env.RESEND_API_KEY) {
      console.warn("WARNING: RESEND_API_KEY is not set. Email sending will likely fail.");
    }

    const { data, error } = await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: email,
      subject: "Reset your password",
      react: <ResetPasswordTemplate url={url} />,
    });

    if (error) {
      console.error("Resend API Error:", error);
      throw error;
    }

    console.log(`Reset Password email sent successfully to ${email}. ID:`, data?.id);
    return data;
  } catch (error) {
    console.error("Failed to send reset password email:", error);
    if (error instanceof Error) {
      console.error("Error Message:", error.message);
      console.error("Error Stack:", error.stack);
    }
    throw error;
  }
}

export async function sendDailyReportEmail(opts: {
  to: string;
  adminName: string;
  cashierName: string;
  branchName: string;
  date: string;
  totalSales: number;
  cashAmount: number;
  momoAmount: number;
  salesCount: number;
  notes?: string;
}) {
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0D0D1A;color:#F1F0FF;padding:32px;border-radius:12px">
      <h2 style="color:#7C3AED;margin-top:0">Daily Sales Report</h2>
      <p>Hi ${opts.adminName},</p>
      <p><strong>${opts.cashierName}</strong> submitted the daily report for <strong>${opts.branchName}</strong> on ${opts.date}.</p>
      <table style="width:100%;border-collapse:collapse;margin:24px 0">
        <tr><td style="padding:8px 0;color:#A09EC0">Total Sales</td><td style="text-align:right;font-weight:bold">${formatUGX(opts.totalSales)}</td></tr>
        <tr><td style="padding:8px 0;color:#A09EC0">Cash</td><td style="text-align:right">${formatUGX(opts.cashAmount)}</td></tr>
        <tr><td style="padding:8px 0;color:#A09EC0">Mobile Money</td><td style="text-align:right">${formatUGX(opts.momoAmount)}</td></tr>
        <tr><td style="padding:8px 0;color:#A09EC0">No. of Sales</td><td style="text-align:right">${opts.salesCount}</td></tr>
        ${opts.notes ? `<tr><td style="padding:8px 0;color:#A09EC0">Notes</td><td style="text-align:right">${opts.notes}</td></tr>` : ""}
      </table>
      <p style="color:#5C5A7A;font-size:12px">TPAPOS — Run Every Branch. Own Every Sale.</p>
    </div>
  `;

  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "noreply@tpapos.co.ug",
    to: opts.to,
    subject: `Daily Report: ${opts.branchName} — ${opts.date}`,
    html,
  });
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://tpapos.vercel.app";

export async function sendWelcomeEmail(opts: {
  to: string;
  name: string;
  tempPassword: string;
  role: string;
  orgName: string;
}) {
  try {
    await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "noreply@tpapos.co.ug",
      to: opts.to,
      subject: `Welcome to ${opts.orgName} — Your TPAPOS account`,
      react: (
        <WelcomeTemplate
          name={opts.name}
          email={opts.to}
          tempPassword={opts.tempPassword}
          role={opts.role}
          orgName={opts.orgName}
          loginUrl={`${APP_URL}/login`}
        />
      ),
    });
  } catch (err) {
    console.error("sendWelcomeEmail failed:", err);
  }
}

export async function sendLowStockEmail(opts: {
  to: string[];
  productName: string;
  sku: string;
  branchName: string;
  currentQty: number;
  threshold: number;
}) {
  if (!opts.to.length) return;
  try {
    await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "noreply@tpapos.co.ug",
      to: opts.to,
      subject: `Low Stock Alert: ${opts.productName} at ${opts.branchName}`,
      react: (
        <LowStockTemplate
          productName={opts.productName}
          sku={opts.sku}
          branchName={opts.branchName}
          currentQty={opts.currentQty}
          threshold={opts.threshold}
          loginUrl={`${APP_URL}/store/inventory`}
        />
      ),
    });
  } catch (err) {
    console.error("sendLowStockEmail failed:", err);
  }
}

export async function sendTransferRequestEmail(opts: {
  to: string[];
  requesterName: string;
  productName: string;
  sku: string;
  quantity: number;
  fromBranch: string;
  toBranch: string;
  notes?: string;
}) {
  if (!opts.to.length) return;
  try {
    await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "noreply@tpapos.co.ug",
      to: opts.to,
      subject: `Transfer Request: ${opts.quantity}x ${opts.productName} → ${opts.toBranch}`,
      react: (
        <TransferRequestTemplate
          requesterName={opts.requesterName}
          productName={opts.productName}
          sku={opts.sku}
          quantity={opts.quantity}
          fromBranch={opts.fromBranch}
          toBranch={opts.toBranch}
          notes={opts.notes}
          loginUrl={`${APP_URL}/store/inventory/transfers`}
        />
      ),
    });
  } catch (err) {
    console.error("sendTransferRequestEmail failed:", err);
  }
}
