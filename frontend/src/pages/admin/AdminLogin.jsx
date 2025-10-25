// src/pages/admin/AdminLogin.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveAdminAuth, isLoggedIn } from "../../utils/adminAuth";
import { MdEmail, MdLock } from "react-icons/md";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isLoggedIn()) navigate("/admin/dashboard", { replace: true });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      saveAdminAuth({ token: data.token, admin: data.admin });
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Login error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-slate-100 p-6">
      <div className="w-[420px] bg-white rounded-xl border border-slate-200 shadow-[0_6px_24px_rgba(16,24,40,0.08)] overflow-hidden">
        <div className="px-6 py-7">
          <h1 className="text-[26px] font-bold leading-tight text-[#233b8a] text-center">
            Welcome Back Admin
          </h1>
          <p className="mt-1 text-sm text-slate-500 text-center">
            Login Your Account
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-3" noValidate>
            <label className="text-sm text-slate-900">Email</label>
            <div className="flex items-center h-11 rounded-lg border border-slate-200 bg-white transition
                            focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-500/10">
              <span className="w-11 grid place-items-center text-slate-500">
                <MdEmail size={18} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                aria-label="email"
                className="flex-1 h-full bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400 pr-3"
              />
            </div>

            <label className="text-sm text-slate-900">Password</label>
            <div className="flex items-center h-11 rounded-lg border border-slate-200 bg-white transition
                            focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-500/10">
              <span className="w-11 grid place-items-center text-slate-500">
                <MdLock size={18} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                aria-label="password"
                className="flex-1 h-full bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400 pr-3"
              />
            </div>

            {error && (
              <div className="mt-1 rounded-lg border border-red-200 bg-red-100 text-red-800 text-sm px-3 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1.5 h-12 w-full rounded-lg bg-orange-500 text-white font-semibold text-[15px]
                         hover:brightness-95 active:translate-y-px disabled:opacity-60
                         transition-[filter,transform,opacity] duration-150"
            >
              {loading ? "Logging in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
