import Notification from "../models/Notification.js";
import { sendPlainEmail } from "../utils/mailer.js";
import mongoose from 'mongoose';

/**
 * POST /api/company/notifications
 * Body: {
 *   title, body, type, status,
 *   companyId, recipientEmail,
 *   data: {
 *     jobId, jobTitle, companyName, companyEmail,
 *     applicantId, applicantName, applicantEmail, message, appliedAt
 *   }
 * }
 */
export async function createCompanyNotification(req, res) {
  try {
    const {
      title,
      body,
      type = "application",
      status = "Applied",
      companyId,
      recipientEmail,
      data = {},
    } = req.body;

    if (!title || !body || !type) {
      return res.status(400).json({ message: "title, body, and type are required" });
    }

    const doc = await Notification.create({
      title,
      body,
      type,
      status,
      companyId,
      recipientEmail,
      createdBy: req.user?.id || data.applicantId || undefined, // if you have auth middleware
      data,
    });

    return res.status(201).json({ message: "Notification created", notification: doc });
  } catch (err) {
    console.error("createCompanyNotification error:", err);
    return res.status(500).json({ message: "Failed to create notification" });
  }
}

/**
 * POST /api/company/notifications/email
 * Body: { to, subject, text }
 */
export async function sendCompanyEmail(req, res) {
  try {
    const { to, subject, text } = req.body;
    if (!to || !subject || !text) {
      return res.status(400).json({ message: "to, subject, and text are required" });
    }

    const result = await sendPlainEmail({ to, subject, text });
    return res.status(200).json({ message: "Email processed", result });
  } catch (err) {
    console.error("sendCompanyEmail error:", err);
    return res.status(500).json({ message: "Failed to send email" });
  }
}


//NEW
function emailScope(req) {
  const email = (req.user?.email || "").toLowerCase();
  if (!email) return { _id: { $exists: false } }; // empty result when no auth
  return {
    $or: [
      { recipientEmail: email },
      { "data.companyEmail": email },
    ],
  };
}

/** GET /api/company/notifications?limit=20&page=1 */
export async function listCompanyNotifications(req, res) {
  try {
    const page  = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit || "20", 10)));
    const skip  = (page - 1) * limit;

    const q = emailScope(req);

    const [rows, total] = await Promise.all([
      Notification.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(q),
    ]);

    return res.json({ notifications: rows, total });
  } catch (err) {
    console.error("listCompanyNotifications error:", err);
    return res.status(200).json({ notifications: [], total: 0 }); // never 500 to UI
  }
}

/** PATCH /api/company/notifications/:id/read */
export async function markNotificationRead(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const q = { _id: id, ...emailScope(req) };
    const doc = await Notification.findOneAndUpdate(q, { $set: { isRead: true } }, { new: true }).lean();
    if (!doc) return res.status(404).json({ message: "Notification not found" });
    return res.json({ message: "Marked as read" });
  } catch (err) {
    console.error("markNotificationRead error:", err);
    return res.status(500).json({ message: "Failed to update" });
  }
}

/** PATCH /api/company/notifications/read-all */
export async function markAllNotificationsRead(req, res) {
  try {
    const q = emailScope(req);
    await Notification.updateMany(q, { $set: { isRead: true } });
    return res.json({ message: "All marked as read" });
  } catch (err) {
    console.error("markAllNotificationsRead error:", err);
    return res.status(500).json({ message: "Failed to update" });
  }
}

/** DELETE /api/company/notifications/:id */
export async function deleteNotification(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const q = { _id: id, ...emailScope(req) };
    const doc = await Notification.findOneAndDelete(q).lean();
    if (!doc) return res.status(404).json({ message: "Notification not found" });
    return res.json({ message: "Deleted" });
  } catch (err) {
    console.error("deleteNotification error:", err);
    return res.status(500).json({ message: "Failed to delete" });
  }
}