import bcrypt from "bcryptjs";
import User from "../../models/user.model.js";   

// Accepts cookie-session or Bearer JWT (see helper below)
function getAuthUserId(req) {
  return (
    req.user?.id ||
    req.user?._id ||
    req.auth?.id ||
    req.session?.userId ||
    req.userId ||
    null
  );
}

const pwPattern = /^(?=.*[A-Z])(?=.*\d).{6,}$/;  // ≥6 chars, 1 uppercase, 1 number

export async function changePassword(req, res) {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated." });

    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required." });
    }
    if (!pwPattern.test(newPassword)) {
      return res.status(400).json({
        message: "Password must be at least 6 characters and include 1 uppercase letter and 1 number."
      });
    }

    // IMPORTANT: If your schema has select:false on password, keep .select('+password')
    const user = await User.findById(userId).select("+password");
    if (!user) return res.status(404).json({ message: "User not found." });

    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) return res.status(400).json({ message: "Current password is incorrect." });

    const sameAsOld = await bcrypt.compare(newPassword, user.password);
    if (sameAsOld) {
      return res.status(400).json({ message: "New password must be different from the old one." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordChangedAt = new Date();          // optional field
    await user.save();

    // Optional: invalidate refresh tokens / sessions here if you use them

    return res.status(200).json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("changePassword error:", err);
    return res.status(500).json({ message: "Server error." });
  }
}
