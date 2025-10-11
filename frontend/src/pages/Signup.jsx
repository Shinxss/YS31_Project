// frontend/src/pages/Signup.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  User,
  Building2,
  Mail,
  Lock,
  BookOpen,
  ChevronDown,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function Signup() {
  const [tab, setTab] = useState("student");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [agreed, setAgreed] = useState(false); // ✅ added for terms checkbox

  // Student state
  const [student, setStudent] = useState({
    firstName: "",
    lastName: "",
    email: "",
    course: "",
    password: "",
    confirmPassword: "",
  });

  // Company state
  const [company, setCompany] = useState({
    companyName: "",
    firstName: "",
    lastName: "",
    companyRole: "Owner",
    companyRoleOther: "",
    email: "",
    industry: "Technology",
    industryOther: "",
    password: "",
    confirmPassword: "",
  });

  // 👁️ password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCompanyPassword, setShowCompanyPassword] = useState(false);
  const [showCompanyConfirm, setShowCompanyConfirm] = useState(false);

  function requireIf(condition, value, label) {
    if (!condition) return;
    if (!value || !String(value).trim()) throw new Error(`${label} is required`);
  }

  async function handleSendOtp(e) {
    e.preventDefault();
    setMsg(null);

    try {
      if (!agreed) throw new Error("You must agree to our Terms and Privacy Policy"); // ✅ validation

      setLoading(true);
      let body;
      let emailToUse;

      if (tab === "student") {
        if (student.password !== student.confirmPassword)
          throw new Error("Passwords do not match");

        ["firstName", "lastName", "email", "course", "password"].forEach((k) => {
          if (!String(student[k] || "").trim()) throw new Error(`${k} is required`);
        });

        body = {
          role: "student",
          email: student.email,
          password: student.password,
          firstName: student.firstName,
          lastName: student.lastName,
          course: student.course,
        };
        emailToUse = student.email;
      } else {
        if (company.password !== company.confirmPassword)
          throw new Error("Passwords do not match");

        const finalRole =
          company.companyRole === "Others"
            ? company.companyRoleOther.trim()
            : company.companyRole;

        const finalIndustry =
          company.industry === "Others"
            ? company.industryOther.trim()
            : company.industry;

        ["companyName", "firstName", "lastName", "email", "password"].forEach((k) => {
          if (!String(company[k] || "").trim()) throw new Error(`${k} is required`);
        });
        requireIf(company.companyRole === "Others", finalRole, "Custom role");
        if (company.companyRole === "Owner") {
          requireIf(company.industry === "Others", finalIndustry, "Custom industry");
        }

        body = {
          role: "company",
          email: company.email,
          password: company.password,
          companyName: company.companyName,
          firstName: company.firstName,
          lastName: company.lastName,
          companyRole: finalRole,
          ...(company.companyRole === "Owner" && { industry: finalIndustry }),
        };
        emailToUse = company.email;
      }

      const res = await fetch(`${API_BASE}/api/auth/signup-otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to send OTP");

      localStorage.setItem("ic_pending_email", emailToUse);
      location.href = `/verify?email=${encodeURIComponent(emailToUse)}`;
    } catch (err) {
      setMsg(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#ECF3FC] py-16">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-blue-900">Join InternConnect</h1>
        <p className="text-gray-600 mt-2">Create your account to get started</p>
      </div>

      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Sign up</h2>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md border ${
              tab === "student"
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "bg-gray-100 border-gray-200 text-gray-700"
            }`}
            onClick={() => setTab("student")}
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
            onClick={() => setTab("company")}
            type="button"
          >
            <Building2 className="w-4 h-4" /> Company
          </button>
        </div>

        {msg && <div className="mb-4 text-sm">{msg}</div>}

        <form onSubmit={handleSendOtp} className="space-y-4">
          {tab === "student" ? (
            <>
              <TwoCols>
                <Input
                  label="First Name"
                  icon={<User />}
                  placeholder="First Name"
                  value={student.firstName}
                  onChange={(v) => setStudent((s) => ({ ...s, firstName: v }))}
                />
                <Input
                  label="Last Name"
                  icon={<User />}
                  placeholder="Last Name"
                  value={student.lastName}
                  onChange={(v) => setStudent((s) => ({ ...s, lastName: v }))}
                />
              </TwoCols>

              <Input
                label="Email"
                icon={<Mail />}
                placeholder="Enter your email"
                type="email"
                value={student.email}
                onChange={(v) => setStudent((s) => ({ ...s, email: v }))}
              />

              <Input
                label="Course"
                icon={<BookOpen />}
                placeholder="Course"
                value={student.course}
                onChange={(v) => setStudent((s) => ({ ...s, course: v }))}
              />

              <PasswordInput
                label="Password"
                value={student.password}
                onChange={(v) => setStudent((s) => ({ ...s, password: v }))}
                show={showPassword}
                setShow={setShowPassword}
              />
              <PasswordInput
                label="Confirm Password"
                value={student.confirmPassword}
                onChange={(v) =>
                  setStudent((s) => ({ ...s, confirmPassword: v }))
                }
                show={showConfirm}
                setShow={setShowConfirm}
              />

              {/* ✅ Terms Checkbox */}
              <div className="flex items-start gap-2 text-sm mt-3">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 accent-[#F37526]"
                />
                <p className="text-gray-700">
                  By signing up you agree to our{" "}
                  <a href="/terms" className="text-blue-700 hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" className="text-blue-700 hover:underline">
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </>
          ) : (
            <>
              <Input
                label="Company Name"
                icon={<Building2 />}
                placeholder="Company Name"
                value={company.companyName}
                onChange={(v) => setCompany((s) => ({ ...s, companyName: v }))}
              />
              <TwoCols>
                <Input
                  label="First Name"
                  icon={<User />}
                  placeholder="First Name"
                  value={company.firstName}
                  onChange={(v) => setCompany((s) => ({ ...s, firstName: v }))}
                />
                <Input
                  label="Last Name"
                  icon={<User />}
                  placeholder="Last Name"
                  value={company.lastName}
                  onChange={(v) => setCompany((s) => ({ ...s, lastName: v }))}
                />
              </TwoCols>

              <PrettySelect
                label="Role"
                value={company.companyRole}
                onChange={(v) => setCompany((s) => ({ ...s, companyRole: v }))}
                options={["Owner", "Recruiter", "HR", "Manager", "Others"]}
              />
              {company.companyRole === "Others" && (
                <Input
                  label="Custom Role"
                  icon={<User />}
                  placeholder="Enter your role"
                  value={company.companyRoleOther}
                  onChange={(v) =>
                    setCompany((s) => ({ ...s, companyRoleOther: v }))
                  }
                />
              )}

              <Input
                label="Email"
                icon={<Mail />}
                placeholder="Enter your email"
                type="email"
                value={company.email}
                onChange={(v) => setCompany((s) => ({ ...s, email: v }))}
              />

              {/* ✅ Only show industry when role = Owner */}
              {company.companyRole === "Owner" && (
                <>
                  <PrettySelect
                    label="Industry"
                    value={company.industry}
                    onChange={(v) =>
                      setCompany((s) => ({ ...s, industry: v }))
                    }
                    options={[
                      "Technology",
                      "Finance",
                      "Healthcare",
                      "Education",
                      "Retail",
                      "Others",
                    ]}
                  />
                  {company.industry === "Others" && (
                    <Input
                      label="Custom Industry"
                      icon={<Building2 />}
                      placeholder="Enter your industry"
                      value={company.industryOther}
                      onChange={(v) =>
                        setCompany((s) => ({ ...s, industryOther: v }))
                      }
                    />
                  )}
                </>
              )}

              <PasswordInput
                label="Password"
                value={company.password}
                onChange={(v) => setCompany((s) => ({ ...s, password: v }))}
                show={showCompanyPassword}
                setShow={setShowCompanyPassword}
              />
              <PasswordInput
                label="Confirm Password"
                value={company.confirmPassword}
                onChange={(v) =>
                  setCompany((s) => ({ ...s, confirmPassword: v }))
                }
                show={showCompanyConfirm}
                setShow={setShowCompanyConfirm}
              />

              {/* ✅ Terms Checkbox for company */}
              <div className="flex items-start gap-2 text-sm mt-3">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 accent-[#F37526]"
                />
                <p className="text-gray-700">
                  By signing up you agree to our{" "}
                  <a href="/terms" className="text-blue-700 hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" className="text-blue-700 hover:underline">
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </>
          )}

          <button
            disabled={loading}
            className="w-full bg-[#F37526] text-white py-3 rounded-md font-medium hover:bg-orange-600 transition disabled:opacity-60"
          >
            {loading ? "Sign up..." : "Sign up"}
          </button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <a href="/login" className="text-blue-700 hover:underline">
              Sign In
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}

/* ---------- small UI helpers ---------- */
function TwoCols({ children }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

function Input({ label, icon, placeholder, type = "text", value, onChange }) {
  return (
    <div className="relative">
      {label && (
        <div className="mb-1 font-semibold text-gray-900 text-[0.95rem]">
          {label}
        </div>
      )}
      <div className="absolute left-3 top-[2.85rem] -translate-y-1/2 text-gray-400 pointer-events-none">
        {icon}
      </div>
      <input
        className="w-full border rounded-md pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function PasswordInput({ label, value, onChange, show, setShow }) {
  return (
    <div className="relative">
      {label && (
        <div className="mb-1 font-semibold text-gray-900 text-[0.95rem]">
          {label}
        </div>
      )}
      <div className="absolute left-3 top-[2.85rem] -translate-y-1/2 text-gray-400 pointer-events-none">
        <Lock />
      </div>
      <input
        className="w-full border rounded-md pl-10 pr-10 py-2 outline-none focus:ring-2 focus:ring-blue-200"
        placeholder={label}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-[3rem] -translate-y-1/2 text-gray-500 hover:text-gray-700"
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

function PrettySelect({ label, value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(() =>
    Math.max(0, options.indexOf(value))
  );
  const containerRef = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const idx = options.indexOf(value);
    if (idx >= 0) setHighlight(idx);
  }, [value, options]);

  function handleKeyDown(e) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + options.length) % options.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      onChange(options[highlight]);
      setOpen(false);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <div className="mb-1 font-semibold text-gray-900 text-[0.95rem]">
          {label}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        className="w-full border rounded-md px-3 py-2 text-left flex items-center justify-between hover:border-gray-300 focus:ring-2 focus:ring-blue-200"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{value}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          tabIndex={-1}
          className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-md border bg-white shadow-lg"
          onKeyDown={handleKeyDown}
        >
          {options.map((opt, i) => {
            const active = i === highlight;
            const selected = opt === value;
            return (
              <li
                key={opt}
                role="option"
                aria-selected={selected}
                className={`px-3 py-2 cursor-pointer flex items-center justify-between ${
                  active ? "bg-indigo-50" : ""
                }`}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
              >
                <span className="truncate">{opt}</span>
                {selected && <Check className="w-4 h-4 text-indigo-600" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
