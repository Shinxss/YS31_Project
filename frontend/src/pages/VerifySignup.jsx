import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function VerifySignup() {
  const urlEmail = new URLSearchParams(location.search).get("email") || "";
  const [email, setEmail] = useState(urlEmail || localStorage.getItem("ic_pending_email") || "");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (email) localStorage.setItem("ic_pending_email", email);
  }, [email]);

  async function verify(e) {
    e.preventDefault();
    setMsg(null);
    if (!email || !code) {
      setMsg("Please enter your email and the 6-digit code.");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/auth/signup-otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Verification failed");

      // success — clear pending and redirect to login
      localStorage.removeItem("ic_pending_email");
      setMsg("✅ Verified! Redirecting to login...");
      setTimeout(() => {
        location.replace("/login");
      }, 2000);
    } catch (err) {
      setMsg(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setMsg(null);
    if (!email) {
      setMsg("Enter the email you used during sign up first.");
      return;
    }
    try {
      setResending(true);
      const res = await fetch(`${API_BASE}/api/auth/signup-otp/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to resend");
      setMsg("📩 A new code has been sent to your email.");
    } catch (err) {
      setMsg(`❌ ${err.message}`);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#ECF3FC] grid place-items-center p-6">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-2">Verify your email</h1>
        <p className="text-center text-gray-600 mb-6">
          We’ve sent a 6-digit code to your email. Enter it below to complete your sign up.
        </p>

        {msg && <div className="mb-4 text-sm">{msg}</div>}

        <form className="space-y-4" onSubmit={verify}>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              className="w-full border rounded-md px-3 py-2 mt-1 outline-none focus:ring-2 focus:ring-blue-200"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Verification code</label>
            <input
              className="w-full border rounded-md px-3 py-2 mt-1 tracking-widest text-center outline-none focus:ring-2 focus:ring-blue-200"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e)=>setCode(e.target.value.replace(/\D/g,""))}
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-[#173B8A] text-white py-3 rounded-md font-medium hover:bg-blue-900 transition disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>

        <div className="flex items-center justify-between mt-4 text-sm">
          <button onClick={resend} disabled={resending} className="text-blue-700 hover:underline">
            {resending ? "Resending..." : "Resend code"}
          </button>
          <a href="/signup" className="text-gray-600 hover:underline">Start over</a>
        </div>
      </div>
    </div>
  );
}
