import React, { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/auth/password/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: String(email).trim(), code: String(code).trim(), newPassword }),
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
            <a href="/login" className="text-blue-700 hover:underline">Back to login</a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">OTP Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
                placeholder="6-digit code"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
                placeholder="Enter new password"
                required
              />
            </div>
            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
            )}
            <button disabled={loading} className="w-full bg-[#F37526] text-white py-2 rounded-md disabled:opacity-60">
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
        <div className="text-center mt-4">
          <a href="/forgot-password" className="text-blue-700 hover:underline">Back to forgot password</a>
        </div>
      </div>
    </div>
  );
}

 
