// controllers/admin.notifications.controller.js
import Notification from "../models/Notification.js";

/** GET /api/admin/notifications */
export const getAdminNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      type: "company_registration",
      recipientEmail: process.env.ADMIN_EMAIL || "admin@internconnect.com"
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ notifications });
  } catch (err) {
    console.error("getAdminNotifications error:", err);
    return res.status(500).json({ message: "Failed to load notifications" });
  }
};

/** PATCH /api/admin/notifications/:id/read */
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { $set: { isRead: true } },
      { new: true }
    ).lean();

    if (!notification) return res.status(404).json({ message: "Notification not found" });

    return res.json(notification);
  } catch (err) {
    console.error("markNotificationAsRead error:", err);
    return res.status(500).json({ message: "Failed to mark notification as read" });
  }
};

/** DELETE /api/admin/notifications/:id */
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndDelete(id).lean();

    if (!notification) return res.status(404).json({ message: "Notification not found" });

    return res.json({ message: "Notification deleted" });
  } catch (err) {
    console.error("deleteNotification error:", err);
    return res.status(500).json({ message: "Failed to delete notification" });
  }
};
