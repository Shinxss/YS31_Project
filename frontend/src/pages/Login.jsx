import React, { useState } from "react";
import { User, Building2, Mail, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { auth } from "../utils/auth";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function Login() {
  const [tab, setTab] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(null);
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: tab })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Login failed");

      auth.save({ token: data.token, role: data.role, profile: data.profile });

      if (data.role === "student") navigate("/student", { replace: true });
      else navigate("/company", { replace: true });
    } catch (err) {
      setMsg(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#ECF3FC] py-16">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[#F37526]"></div>
          <h1 className="text-3xl font-bold text-blue-900">InternConnect</h1>
        </div>
        <p className="text-gray-500 mt-2">Login Your Account</p>
      </div>

      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Welcome Back</h2>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md border ${tab==="student" ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-gray-100 border-gray-200 text-gray-700"}`}
            onClick={() => setTab("student")} type="button">
            <User className="w-4 h-4" /> Student
          </button>
          <button
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md border ${tab==="company" ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-gray-100 border-gray-200 text-gray-700"}`}
            onClick={() => setTab("company")} type="button">
            <Building2 className="w-4 h-4" /> Employer
          </button>
        </div>

        {msg && <div className="mb-4 text-sm">{msg}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input icon={<Mail />} placeholder="Enter your email" type="email" value={email} onChange={setEmail} />
          <Input icon={<Lock />} placeholder="Enter your password" type="password" value={password} onChange={setPassword} />
          <button
            disabled={loading}
            className="w-full bg-[#F37526] text-white py-3 rounded-md font-medium hover:bg-orange-600 transition disabled:opacity-60">
            {loading ? "Signing in..." : (tab === "student" ? "Sign in as Student" : "Sign in as Employer")}
          </button>
          <p className="text-center text-sm text-gray-600">
            Don’t have an account? <a href="/signup" className="text-blue-700 hover:underline">Sign up</a>
          </p>
          <p className="text-xs text-gray-500 text-center">
            By signing in, you agree to our <a className="underline">Terms of Service</a> and <a className="underline">Privacy Policy</a>
          </p>
        </form>
      </div>
    </div>
  );
}

function Input({ icon, placeholder, type="text", value, onChange }) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
      <input
        className="w-full border rounded-md pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(e)=>onChange(e.target.value)}
      />
    </div>
  );
}
