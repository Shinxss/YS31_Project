import Notification from "../models/Notification.model.js";
import { getCompanyForUser } from "../utils/companyContext.js";

export async function listNotifications(req, res) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

    const company = await getCompanyForUser(req);
    if (!company?._id) return res.json({ items: [], unread: 0 });

    const items = await Notification.find({ company: company._id })
      .sort({ createdAt: -1 })
      .limit(40)
      .populate({ path: "student", select: "firstName lastName profilePicture" })
      .populate({ path: "job", select: "title" })
      .populate({ path: "application", select: "status createdAt" })
      .lean();

    const userId = String(req.user.id);
    const unread = items.filter((n) => !(n.readBy || []).map(String).includes(userId)).length;

    const feed = items.map((n) => {
      const fullName = n.student
        ? [n.student.firstName, n.student.lastName].filter(Boolean).join(" ")
        : null;

      const status = (n.application?.status || "").toLowerCase();
      const highlight = n.isActive && status !== "under review";

      return {
        _id: n._id,
        type: n.type,
        message: n.message,
        createdAt: n.createdAt,
        highlight,
        isRead: (n.readBy || []).map(String).includes(userId),
        student: n.student
          ? { _id: n.student._id, fullName, profilePicture: n.student.profilePicture || "" }
          : null,
        job: n.job ? { _id: n.job._id, title: n.job.title } : null,
        application: n.application ? { _id: n.application._id, status: n.application.status } : null,
      };
    });

    res.json({ items: feed, unread });
  } catch (e) {
    console.error("listNotifications", e);
    res.status(500).json({ message: "Failed to load notifications" });
  }
}

export async function markAllRead(req, res) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });
    const company = await getCompanyForUser(req);
    if (!company?._id) return res.status(404).json({ message: "Not found" });

    await Notification.updateMany(
      { company: company._id, readBy: { $ne: req.user.id } },
      { $addToSet: { readBy: req.user.id } }
    );
    res.json({ ok: true });
  } catch (e) {
    console.error("markAllRead", e);
    res.status(500).json({ message: "Failed to update" });
  }
}

export async function markOneRead(req, res) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });
    await Notification.updateOne(
      { _id: req.params.id },
      { $addToSet: { readBy: req.user.id } }
    );
    res.json({ ok: true });
  } catch (e) {
    console.error("markOneRead", e);
    res.status(500).json({ message: "Failed to update" });
  }
}