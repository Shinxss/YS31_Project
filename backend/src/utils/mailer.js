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
