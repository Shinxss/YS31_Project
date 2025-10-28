import nodemailer from "nodemailer";

export function makeTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP is not fully configured in .env");
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendMail({ to, subject, html, text }) {
  const transporter = makeTransport();
  const from = process.env.MAIL_FROM || `${process.env.APP_NAME || "App"} <${process.env.SMTP_USER}>`;
  // verify is best-effort (don’t throw if it fails)
  try { await transporter.verify(); } catch (_) {}
  return transporter.sendMail({ from, to, subject, html, text });
}

let transporter = null;
let verified = false;

export function getTransporter() {
  if (transporter) return transporter;

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE = "false",
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM,
    MAIL_ENABLED = "true",
  } = process.env;

  if (String(MAIL_ENABLED) !== "true") {
    console.warn("📧 Mail disabled via MAIL_ENABLED=false. Emails will be skipped.");
    return null;
  }

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_FROM) {
    console.warn("📧 Mailer not configured (missing SMTP_HOST/PORT/FROM). Emails will be skipped.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(SMTP_SECURE) === "true",
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });

  // Validate credentials once
  transporter.verify((err, success) => {
    if (err) {
      console.error("📧 SMTP verify failed:", err.message);
    } else if (success) {
      verified = true;
      console.log("📧 SMTP transporter verified.");
    }
  });

  return transporter;
}

export async function sendPlainEmail({ to, subject, text }) {
  const from = process.env.SMTP_FROM || "no-reply@example.com";
  const tx = getTransporter();

  if (!to || !subject || !text) throw new Error("to, subject, and text are required");
  if (!tx) {
    console.warn("📧 Skipping email (no transporter).", { to, subject });
    return { skipped: true };
  }

  try {
    const info = await tx.sendMail({ from, to, subject, text });
    return { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected };
  } catch (e) {
    console.error("📧 sendMail error:", e.message);
    throw e;
  }
}

export async function sendOtpEmail({ to, otp, expiryTime }) {
  const from = process.env.SMTP_FROM || "no-reply@example.com";
  const subject = "Your One-Time Password (OTP) for InternConnect";
  
  const html = `
    <p>Dear User,</p>
    <p>You recently requested a One-Time Password (OTP) to securely verify your identity for creating a new account.</p>
    <p>Please use the following code to complete your process:</p>
    <h2 style="font-size: 24px; font-weight: normal; color: #DEE4FF;">${otp}</h2>
    <p>This code is valid for <strong>${expiryTime}</strong> minutes and will expire after that time for security reasons.</p>
    <p><strong>Security Notice: Do Not Share This Code:</strong><br>
    For your security, it is absolutely critical that you do not share this One-Time Password with anyone, including friends, family, or any supposed staff member of InternConnect.<br>
    We will never ask you for this code. If anyone contacts you requesting this OTP, they are likely attempting a scam.</p>
    <p><strong>If You Did Not Request This Code:</strong><br>
    If you did not initiate this request, please ignore this email immediately. No action is needed on your part, and your account remains secure.</p>
    <p>Sincerely,<br>The InternConnect Security Team</p>
    <p>This email was sent from an automated system. Do not reply to this.</p>
  `;

  const text = `
    Dear User,

    You recently requested a One-Time Password (OTP) to securely verify your identity for creating a new account.
    Please use the following code to complete your process: ${otp}

    This code is valid for ${expiryTime} minutes and will expire after that time for security reasons.

    Security Notice: Do Not Share This Code:
    For your security, it is absolutely critical that you do not share this One-Time Password with anyone, including friends, family, or any supposed staff member of InternConnect.
    We will never ask you for this code. If anyone contacts you requesting this OTP, they are likely attempting a scam.

    If You Did Not Request This Code:
    If you did not initiate this request, please ignore this email immediately. No action is needed on your part, and your account remains secure.

    Sincerely,
    The InternConnect Security Team

    This email was sent from an automated system. Do not reply to this.
  `;

  const transporter = makeTransport();

  if (!transporter) {
    console.warn("📧 Skipping email (no transporter).", { to, subject });
    return { skipped: true };
  }

  try {
    const info = await transporter.sendMail({ from, to, subject, html, text });
    return { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected };
  } catch (e) {
    console.error("📧 sendOtpEmail error:", e.message);
    throw e;
  }
}