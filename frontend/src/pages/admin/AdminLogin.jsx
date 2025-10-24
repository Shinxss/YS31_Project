// frontend/src/pages/AdminLogin.jsx
import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function AdminLogin() {
  const [email, setEmail] = useState("admin@internconnect.local");
  const [password, setPassword] = useState("Admin@12345");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Use env var for backend; fallback to 5000 (backend)
  const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:5000";

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      // debug: confirm what we're posting to at runtime
      console.log("Posting admin login to:", `${API_BASE}/api/auth/admin-login`);

      const res = await fetch(`${API_BASE}/api/auth/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data.message || `Login failed (${res.status})`;
        toast.error(msg);
        setLoading(false);
        return;
      }

      if (!data.token) {
        toast.error("Login did not return a token.");
        setLoading(false);
        return;
      }

      // Save token and role (dev: localStorage)
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("role", data.role || "admin");

      toast.success("Welcome back, Admin!");

      // Redirect to protected Admin Dashboard
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      console.error("admin login error", err);
      toast.error("Network error — could not contact server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 justify-center mb-4">
          <Shield size={28} className="text-orange-500" />
          <h2 className="text-2xl font-semibold text-center">Welcome Back, Admin</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 mt-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-sm placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-400" />
              </div>

              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full border border-gray-200 rounded-xl py-3 pl-12 pr-12 text-sm placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent transition"
              />

              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                aria-label="Toggle password visibility"
              >
                {show ? <EyeOff size={18} className="text-gray-500" /> : <Eye size={18} className="text-gray-500" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl text-white font-semibold text-lg shadow-md"
            style={{
              background: "#F37526",
              boxShadow: "0 6px 12px rgba(243,117,38,0.18)",
            }}
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in as Admin"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-5">
          Back to the main site? <Link to="/" className="text-blue-600 font-medium hover:underline">Go home</Link>
        </p>
      </div>
    </div>
  );
}
