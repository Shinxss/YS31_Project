// routes/student.notifications.routes.js
import { Router } from "express";
import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import Student from "../models/student.model.js";
import { protect } from "../middlewares/auth.js"; // your auth middleware

const router = Router();

/** Build the recipient filter for the logged-in student */
async function buildStudentNotifFilter(req) {
  const uid = req.user?.id;
  const email = (req.user?.email || "").toLowerCase();

  // Try to find the student profile (either by linked user or email)
  const studentDoc =
    (uid ? await Student.findOne({ user: uid }).select("_id email").lean() : null) ||
    (email ? await Student.findOne({ email }).select("_id email").lean() : null);

  const studentId = studentDoc?._id;
  const studentEmail = (studentDoc?.email || email || "").toLowerCase();

  // Match notifications targeted to this student
  const or = [];
  if (studentEmail) {
    or.push({ recipientEmail: studentEmail });
    or.push({ "data.applicantEmail": studentEmail });
  }
  if (studentId && mongoose.isValidObjectId(studentId)) {
    or.push({ "data.studentId": studentId });
  }

  // If we have nothing, make an impossible filter to return none
  if (!or.length) or.push({ _id: new mongoose.Types.ObjectId().toString() });

  return { $or: or };
}

/** GET /api/student/notifications?limit=&page= */
router.get("/", protect, async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const skip = (page - 1) * limit;

    const filter = await buildStudentNotifFilter(req);

    const [list, total] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(filter),
    ]);

    res.json({ notifications: list, total, page, limit });
  } catch (e) {
    console.error("student notifications list error:", e);
    res.status(500).json({ message: "Failed to load notifications" });
  }
});

/** PATCH /api/student/notifications/:id/read */
router.patch("/:id/read", protect, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid notification id" });
    }

    const filter = await buildStudentNotifFilter(req);
    const doc = await Notification.findOneAndUpdate(
      { _id: id, ...filter },
      { $set: { isRead: true } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Notification not found" });
    res.json({ message: "Marked as read", notification: doc });
  } catch (e) {
    console.error("student notif mark read error:", e);
    res.status(500).json({ message: "Failed to mark as read" });
  }
});

/** PATCH /api/student/notifications/read-all */
router.patch("/read-all", protect, async (req, res) => {
  try {
    const filter = await buildStudentNotifFilter(req);
    const result = await Notification.updateMany({ ...filter, isRead: false }, { $set: { isRead: true } });
    res.json({ message: "All marked as read", modified: result.modifiedCount ?? result.nModified });
  } catch (e) {
    console.error("student notif read-all error:", e);
    res.status(500).json({ message: "Failed to mark all as read" });
  }
});

/** DELETE /api/student/notifications/:id */
router.delete("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid notification id" });
    }
    const filter = await buildStudentNotifFilter(req);
    const result = await Notification.findOneAndDelete({ _id: id, ...filter });
    if (!result) return res.status(404).json({ message: "Notification not found" });
    res.json({ message: "Deleted" });
  } catch (e) {
    console.error("student notif delete error:", e);
    res.status(500).json({ message: "Failed to delete notification" });
  }
});

export default router;
