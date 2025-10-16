// frontend/src/pages/Login.jsx
import React, { useEffect, useState } from "react";
import { User, Building2, Mail, Lock, Eye, EyeOff } from "lucide-react"; // 👁️ Eye icons
import { useNavigate } from "react-router-dom";
import { auth } from "../utils/auth";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

/* ✅ simple email validator */
const isValidEmail = (val = "") => /^\s*[^@\s]+@[^@\s]+\.[^@\s]+\s*$/.test(val);

export default function Login() {
  const [tab, setTab] = useState("student"); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 
  const [errors, setErrors] = useState({ email: "", password: "" }); 

  const navigate = useNavigate();

  // If already logged in, bounce to the proper dashboard
  useEffect(() => {
    const token = localStorage.getItem("ic_token");
    const role = localStorage.getItem("ic_role");
    if (token && role) {
      navigate(role === "company" ? "/company" : "/student", { replace: true });
    }
  }, [navigate]);

  function validate() {
    const next = { email: "", password: "" };
    const trimmed = String(email).trim();

    if (!trimmed) next.email = "Email is required";
    else if (!isValidEmail(trimmed)) next.email = "Enter a valid email address";

    if (!password) next.password = "Password is required";

    setErrors(next);
    return !next.email && !next.password;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(null);

    // ✅ client-side check; stop early if invalid
    if (!validate()) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: String(email).trim(), password, role: tab }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          // ⛔ highlight both fields
          setErrors({
            email: "Invalid email or password",
            password: "Invalid email or password",
          });
          throw new Error("Invalid email or password");
        }
        if (res.status === 403) {
          setErrors((prev) => ({ ...prev, email: "Wrong role selected for this account" }));
          throw new Error("Invalid role selected");
        }
        throw new Error(data?.message || "Login failed");
      }

      auth.save({ token: data.token, role: data.role, profile: data.profile });
      navigate(data.role === "company" ? "/company" : "/student", { replace: true });
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
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md border ${
              tab === "student"
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "bg-gray-100 border-gray-200 text-gray-700"
            }`}
            onClick={() => {
              setTab("student");
              setMsg(null);
            }}
            type="button"
          >
            <User className="w-4 h-4" /> Student
          </button>
          <button
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md border ${
              tab === "company"
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "bg-gray-100 border-gray-200 text-gray-700"
            }`}
            onClick={() => {
              setTab("company");
              setMsg(null);
            }}
            type="button"
          >
            <Building2 className="w-4 h-4" /> Company
          </button>
        </div>

        {msg && (
          <div className="mb-4 text-sm rounded-md bg-red-50 border border-red-200 text-red-700 px-3 py-2">
            {msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            icon={<Mail />}
            placeholder="Enter your email"
            type="email"
            value={email}
            onChange={(v) => {
              setEmail(v);
              if (errors.email) setErrors((e) => ({ ...e, email: "" }));
            }}
            error={errors.email} // ✅ inline error state
            label="Email"
          />

          {/* 👁️ Password with show/hide + red state */}
          <PasswordField
            value={password}
            onChange={(v) => {
              setPassword(v);
              if (errors.password) setErrors((e) => ({ ...e, password: "" }));
            }}
            show={showPassword}
            setShow={setShowPassword}
            error={errors.password}
            label="Password"
          />

          <button
            disabled={loading}
            className="w-full bg-[#F37526] text-white py-3 rounded-md font-medium hover:bg-orange-600 transition disabled:opacity-60"
          >
            {loading
              ? "Signing in..."
              : tab === "student"
              ? "Sign in"
              : "Sign in"}
          </button>

          <p className="text-center text-sm text-gray-600">
            Don’t have an account?{" "}
            <a href="/signup" className="text-blue-700 hover:underline">
              Sign up
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}

function Input({ icon, placeholder, type = "text", value, onChange, error, label }) {
  const base =
    "w-full border rounded-md pl-10 pr-3 py-2 outline-none focus:ring-2";
  const ring = error ? "focus:ring-red-200" : "focus:ring-blue-200";
  const border = error ? "border-red-500" : "border-gray-300";
  const text = error ? "text-red-900 placeholder-red-300" : "";
  return (
    <div className="relative">
      {label && (
        <div className="mb-1 font-semibold text-gray-900 text-[0.95rem]">{label}</div>
      )}
      <div
        className={`absolute left-3 top-[2.85rem] -translate-y-1/2 ${
          error ? "text-red-500" : "text-gray-400"
        }`}
      >
        {icon}
      </div>
      <input
        className={`${base} ${ring} ${border} ${text}`}
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={type === "password" ? "current-password" : "email"}
        aria-invalid={!!error}
        aria-describedby={error ? `${label?.toLowerCase()}-error` : undefined}
      />
      {error && (
        <p id={`${label?.toLowerCase()}-error`} className="text-xs text-red-600 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

function PasswordField({ value, onChange, show, setShow, error, label = "Password" }) {
  const base =
    "w-full border rounded-md pl-10 pr-10 py-2 outline-none focus:ring-2";
  const ring = error ? "focus:ring-red-200" : "focus:ring-blue-200";
  const border = error ? "border-red-500" : "border-gray-300";
  const text = error ? "text-red-900 placeholder-red-300" : "";
  return (
    <div className="relative">
      {label && (
        <div className="mb-1 font-semibold text-gray-900 text-[0.95rem]">
          {label}
        </div>
      )}
      <div
        className={`absolute left-3 top-[2.85rem] -translate-y-1/2 ${
          error ? "text-red-500" : "text-gray-400"
        }`}
      >
        <Lock />
      </div>
      <input
        className={`${base} ${ring} ${border} ${text}`}
        placeholder="Enter your password"
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="current-password"
        aria-invalid={!!error}
        aria-describedby={error ? "password-error" : undefined}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className={`absolute right-3 top-[3rem] -translate-y-1/2 ${
          error ? "text-red-500" : "text-gray-500 hover:text-gray-700"
        }`}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
      {error && (
        <p id="password-error" className="text-xs text-red-600 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
