// frontend/src/pages/Signup.jsx
import React, { useEffect, useRef, useState } from "react";
import { User, Building2, Mail, Lock, University, BookOpen, ChevronDown, Check } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function Signup() {
  const [tab, setTab] = useState("student"); // student | company
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  // OTP modal
  const [otpOpen, setOtpOpen] = useState(false);
  const [otp, setOtp] = useState("");

  // Student state
  const [student, setStudent] = useState({
    firstName: "", lastName: "", email: "",
    school: "", course: "", major: "",
    password: "", confirmPassword: ""
  });

  // Company state (no location/description here)
  const [company, setCompany] = useState({
    companyName: "", firstName: "", lastName: "",
    companyRole: "Owner", email: "", industry: "Technology",
    password: "", confirmPassword: ""
  });

  // holds last email used (to verify OTP against)
  const [pendingEmail, setPendingEmail] = useState("");

  async function handleSendOtp(e) {
    e.preventDefault();
    setMsg(null);
    try {
      setLoading(true);

      let body;
      if (tab === "student") {
        if (student.password !== student.confirmPassword) {
          setMsg("Passwords do not match");
          return;
        }
        body = {
          role: "student",
          email: student.email,
          password: student.password,
          firstName: student.firstName,
          lastName: student.lastName,
          school: student.school,
          course: student.course,
          major: student.major,
        };
      } else {
        if (company.password !== company.confirmPassword) {
          setMsg("Passwords do not match");
          return;
        }
        body = {
          role: "company",
          email: company.email,
          password: company.password,
          companyName: company.companyName,
          firstName: company.firstName,
          lastName: company.lastName,
          companyRole: company.companyRole, // Owner/Recruiter/HR/Manager
          industry: company.industry,
        };
      }

      const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to send OTP");

      setPendingEmail(tab === "student" ? student.email : company.email);
      setOtpOpen(true);
      setMsg("🔐 OTP sent to your email. Check your inbox.");
    } catch (err) {
      setMsg(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, code: otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Verification failed");

      setMsg("✅ Account verified & created. You can now sign in.");
      setOtp("");
      setOtpOpen(false);

      // reset forms
      setStudent({ firstName:"", lastName:"", email:"", school:"", course:"", major:"", password:"", confirmPassword:"" });
      setCompany({ companyName:"", firstName:"", lastName:"", companyRole:"Owner", email:"", industry:"Technology", password:"", confirmPassword:"" });
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
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md border ${tab==="student" ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-gray-100 border-gray-200 text-gray-700"}`}
            onClick={() => setTab("student")}
            type="button"
          >
            <User className="w-4 h-4" /> Student
          </button>
          <button
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md border ${tab==="company" ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-gray-100 border-gray-200 text-gray-700"}`}
            onClick={() => setTab("company")}
            type="button"
          >
            <Building2 className="w-4 h-4" /> Employer
          </button>
        </div>

        {msg && <div className="mb-4 text-sm">{msg}</div>}

        <form onSubmit={handleSendOtp} className="space-y-4">
          {tab === "student" ? (
            <>
              <TwoCols>
                <Input icon={<User />} placeholder="First Name" value={student.firstName} onChange={v=>setStudent(s=>({...s, firstName:v}))}/>
                <Input icon={<User />} placeholder="Last Name" value={student.lastName} onChange={v=>setStudent(s=>({...s, lastName:v}))}/>
              </TwoCols>
              <Input icon={<Mail />} placeholder="Enter your email" type="email" value={student.email} onChange={v=>setStudent(s=>({...s, email:v}))}/>
              <Input icon={<University />} placeholder="University" value={student.school} onChange={v=>setStudent(s=>({...s, school:v}))}/>
              <Input icon={<BookOpen />} placeholder="Course" value={student.course} onChange={v=>setStudent(s=>({...s, course:v}))}/>
              <Input icon={<BookOpen />} placeholder="Major (optional)" value={student.major} onChange={v=>setStudent(s=>({...s, major:v}))}/>
              <Input icon={<Lock />} placeholder="Create a strong password" type="password" value={student.password} onChange={v=>setStudent(s=>({...s, password:v}))}/>
              <Input icon={<Lock />} placeholder="Confirm your password" type="password" value={student.confirmPassword} onChange={v=>setStudent(s=>({...s, confirmPassword:v}))}/>
            </>
          ) : (
            <>
              <Input icon={<Building2 />} placeholder="Company Name" value={company.companyName} onChange={v=>setCompany(s=>({...s, companyName:v}))}/>
              <TwoCols>
                <Input icon={<User />} placeholder="First Name" value={company.firstName} onChange={v=>setCompany(s=>({...s, firstName:v}))}/>
                <Input icon={<User />} placeholder="Last Name" value={company.lastName} onChange={v=>setCompany(s=>({...s, lastName:v}))}/>
              </TwoCols>

              {/* NEW: pretty dropdowns */}
              <PrettySelect
                label="Role"
                value={company.companyRole}
                onChange={(v)=>setCompany(s=>({...s, companyRole:v}))}
                options={["Owner","Recruiter","HR","Manager"]}
              />
              <Input icon={<Mail />} placeholder="Enter your email" type="email" value={company.email} onChange={v=>setCompany(s=>({...s, email:v}))}/>

              <PrettySelect
                label="Industry"
                value={company.industry}
                onChange={(v)=>setCompany(s=>({...s, industry:v}))}
                options={["Technology","Finance","Healthcare","Education","Retail"]}
              />

              <Input icon={<Lock />} placeholder="Create a strong password" type="password" value={company.password} onChange={v=>setCompany(s=>({...s, password:v}))}/>
              <Input icon={<Lock />} placeholder="Confirm your password" type="password" value={company.confirmPassword} onChange={v=>setCompany(s=>({...s, confirmPassword:v}))}/>
            </>
          )}

          <button disabled={loading} className="w-full bg-[#F37526] text-white py-3 rounded-md font-medium hover:bg-orange-600 transition disabled:opacity-60">
            {loading ? "Sign up..." : "Sign up"}
          </button>

          <p className="text-center text-sm text-gray-600">
            Already have an account? <a href="/login" className="text-blue-700 hover:underline">Sign In</a>
          </p>
        </form>
      </div>

      {/* OTP modal */}
      {otpOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Enter Verification Code</h3>
              <button onClick={()=>setOtpOpen(false)} className="text-gray-500 hover:text-gray-700" type="button">✕</button>
            </div>
            <form onSubmit={handleVerifyOtp} className="p-6 space-y-4">
              <p className="text-sm text-gray-600">We sent a 6-digit code to <span className="font-medium">{pendingEmail}</span>.</p>
              <input
                className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200 tracking-widest text-center text-lg"
                placeholder="••••••"
                value={otp}
                onChange={(e)=>setOtp(e.target.value)}
                maxLength={6}
                inputMode="numeric"
                required
              />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={()=>setOtpOpen(false)} className="px-4 py-2 rounded-md border">Cancel</button>
                <button disabled={loading || otp.length !== 6} className="px-4 py-2 rounded-md bg-[#173B8A] text-white disabled:opacity-60">
                  Verify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- small UI helpers ---- */
function TwoCols({children}) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
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

/** A11y-friendly custom select (styled dropdown) */
function PrettySelect({ label, value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(() => Math.max(0, options.indexOf(value)));
  const containerRef = useRef(null);

  // close on outside click
  useEffect(() => {
    function onClick(e) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // keep highlight in range if options change
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
      setHighlight(h => (h + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight(h => (h - 1 + options.length) % options.length);
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
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        onKeyDown={handleKeyDown}
        className="w-full border rounded-md px-3 py-2 text-left flex items-center justify-between hover:border-gray-300 focus:ring-2 focus:ring-blue-200"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate flex items-center gap-2">
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
          {value}
        </span>
        <span className="text-gray-400 text-xs">Press ⌄</span>
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
