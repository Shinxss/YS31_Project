// src/models/Notification.model.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    company: { type: Schema.Types.ObjectId, ref: "Company", index: true }, // scope
    type: { type: String, enum: ["application:new"], required: true },

    message: { type: String, required: true },
    application: { type: Schema.Types.ObjectId, ref: "Application" },
    job: { type: Schema.Types.ObjectId, ref: "Job" },
    student: { type: Schema.Types.ObjectId, ref: "Student" },

    // read state per *user id* (owner or employee)
    readBy: [{ type: Schema.Types.ObjectId, ref: "User", index: true }],

    // stays true until the application is moved to "Under Review"
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "notifications" }
);

export default mongoose.model("Notification", notificationSchema);
