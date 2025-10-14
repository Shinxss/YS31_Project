import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, index: true },
    codeHash: { type: String, required: true }, // bcrypt hash of the 6-digit code
    expiresAt: { type: Date, required: true }, // ✅ removed inline index to avoid duplicate
    attempts: { type: Number, default: 0 },
    payload: { type: Object, required: true }, // signup data to finalize upon verify
  },
  { timestamps: true }
);

// ✅ TTL index (Mongo will auto-purge after expiry)
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ✅ quick helper to check expiry
OtpSchema.methods.isExpired = function () {
  return this.expiresAt && this.expiresAt < new Date();
};

export default mongoose.model("OtpToken", OtpSchema);
