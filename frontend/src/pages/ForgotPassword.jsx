import React, { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/auth/password/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: String(email).trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to send OTP");
      setSent(true);
    } catch (err) {
      setError(err?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#ECF3FC] py-16">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-4">Forgot Password</h1>
        {sent ? (
          <div className="text-center">
            <p className="text-green-700 mb-3">If that email exists, an OTP has been sent.</p>
            <a href="/reset-password" className="text-blue-700 hover:underline">Have a code? Reset password</a>
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
            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
            )}
            <button disabled={loading} className="w-full bg-[#F37526] text-white py-2 rounded-md disabled:opacity-60">
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}
        <div className="text-center mt-4">
          <a href="/login" className="text-blue-700 hover:underline">Back to login</a>
        </div>
      </div>
    </div>
  );
}

