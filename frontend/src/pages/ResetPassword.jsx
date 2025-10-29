import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // ✅ Password validation checks
  const checks = [
    { test: /.{8,}/, message: "At least 8 characters long" },
    { test: /[A-Z]/, message: "At least 1 uppercase letter (A–Z)" },
    { test: /[a-z]/, message: "At least 1 lowercase letter (a–z)" },
    { test: /\d/, message: "At least 1 number (0–9)" },
    {
      test: /[!@#$%^&*(),.?":{}|<>]/,
      message: "At least 1 special character (!@#$%^&*)",
    },
    { test: /^\S*$/, message: "No spaces allowed" },
  ];

  const failedRule = checks.find((rule) => !rule.test.test(newPassword));
  const isPasswordValid = !failedRule;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!isPasswordValid) {
      setError(`Password must be valid: ${failedRule?.message}`);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/auth/password/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(email).trim(),
          code: String(code).trim(),
          newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to reset password");
      setDone(true);
    } catch (err) {
      setError(err?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#ECF3FC] py-16">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-4">Reset Password</h1>

        {done ? (
          <div className="text-center">
            <p className="text-green-700 mb-4">Your password has been updated.</p>
            <a href="/login" className="text-blue-700 hover:underline">
              Back to login
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-md px-3 py-2 focus:ring focus:ring-blue-100"
                placeholder="you@example.com"
                required
              />
            </div>

            {/* OTP Code */}
            <div>
              <label className="block text-sm font-medium mb-1">OTP Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full border rounded-md px-3 py-2 focus:ring focus:ring-blue-100"
                placeholder="6-digit code"
                required
              />
            </div>

            {/* Password field */}
            <div>
              <label className="block text-sm font-medium mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full border rounded-md px-3 py-2 pr-10 focus:ring ${
                    newPassword.length > 0 && !isPasswordValid
                      ? "border-red-500 focus:ring-red-100"
                      : "border-gray-300 focus:ring-blue-100"
                  }`}
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Show only one message */}
              {newPassword.length > 0 && !isPasswordValid && (
                <p className="text-xs text-red-600 mt-2">
                  {failedRule?.message}
                </p>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              disabled={loading}
              className="w-full bg-[#F37526] text-white py-2 rounded-md font-medium hover:bg-[#e0691f] disabled:opacity-60 transition"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <div className="text-center mt-4">
          <a href="/forgot-password" className="text-blue-700 hover:underline">
            Back to forgot password
          </a>
        </div>
      </div>
    </div>
  );
}
