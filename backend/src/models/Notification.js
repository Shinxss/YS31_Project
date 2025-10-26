// ESM module
import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    // Required (matches your earlier validation error)
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: ["application", "status", "system"], default: "application" },

    // Status for workflow (you asked to save it)
    status: {
      type: String,
      enum: ["Applied", "Submitted", "Accepted", "Rejected", "Seen", "Unread"],
      default: "Applied",
    },

    // Target (company-side notification)
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", index: true },
    recipientEmail: { type: String, trim: true },

    // Optional: who caused it
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },

    // Arbitrary metadata bag (safe & flexible)
    data: {
      jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
      jobTitle: String,
      companyName: String,
      companyEmail: String,
      applicantId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
      applicantName: String,
      applicantEmail: String,
      message: String,
      appliedAt: Date,
      // add more fields anytime without changing the schema
    },

    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", NotificationSchema);
