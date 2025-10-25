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
