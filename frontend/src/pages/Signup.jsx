// frontend/src/pages/Signup.jsx
import React, { useMemo, useState } from "react";
import { User, Building2, Mail, Lock, University, BookOpen, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function Signup() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("student"); // student | company
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

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

  // --- simple client-side validation ---
  const studentValid = useMemo(() => {
    const s = student;
    return (
      s.firstName.trim() &&
      s.lastName.trim() &&
      s.email.trim() &&
      s.school.trim() &&
      s.course.trim() &&
      s.password &&
      s.confirmPassword &&
      s.password === s.confirmPassword
    );
  }, [student]);

  const companyValid = useMemo(() => {
    const c = company;
    return (
      c.companyName.trim() &&
      c.firstName.trim() &&
      c.lastName.trim() &&
      c.email.trim() &&
      c.companyRole.trim() &&
      c.industry.trim() &&
      c.password &&
      c.confirmPassword &&
      c.password === c.confirmPassword
    );
  }, [company]);

  async function handleSendOtp(e) {
    e.preventDefault();
    setMsg(null);

    try {
      setLoading(true);

      let body, emailForVerify;
      if (tab === "student") {
        if (!studentValid) return setMsg("Please fill all required fields and make sure passwords match.");

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
        emailForVerify = student.email;
      } else {
        if (!companyValid) return setMsg("Please fill all required fields and make sure passwords match.");

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
        emailForVerify = company.email;
      }

      // NOTE: using the new routes: /signup-otp/send
      const res = await fetch(`${API_BASE}/api/auth/signup-otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to send OTP");

      // Persist pending email & go to dedicated verify page (so users can't get stuck)
      localStorage.setItem("ic_pending_email", emailForVerify);
      navigate(`/verify?email=${encodeURIComponent(emailForVerify)}`, { replace: true });
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
              <Select
                id="companyRole"
                icon={<ChevronDown />}
                placeholder="Role (Owner / Recruiter / HR / Manager)"
                value={company.companyRole}
                onChange={v=>setCompany(s=>({...s, companyRole:v}))}
                options={["Owner","Recruiter","HR","Manager"]}
              />
              <Input icon={<Mail />} placeholder="Enter your email" type="email" value={company.email} onChange={v=>setCompany(s=>({...s, email:v}))}/>
              <Select
                id="industry"
                icon={<ChevronDown />}
                placeholder="Industry"
                value={company.industry}
                onChange={v=>setCompany(s=>({...s, industry:v}))}
                options={["Technology","Finance","Healthcare","Education","Retail"]}
              />
              <Input icon={<Lock />} placeholder="Create a strong password" type="password" value={company.password} onChange={v=>setCompany(s=>({...s, password:v}))}/>
              <Input icon={<Lock />} placeholder="Confirm your password" type="password" value={company.confirmPassword} onChange={v=>setCompany(s=>({...s, confirmPassword:v}))}/>
            </>
          )}

          <button
            disabled={loading || (tab === "student" ? !studentValid : !companyValid)}
            className="w-full bg-[#F37526] text-white py-3 rounded-md font-medium hover:bg-orange-600 transition disabled:opacity-60"
          >
            {loading ? "Sending OTP..." : "Sign up"}
          </button>

          <p className="text-center text-sm text-gray-600">
            Already have an account? <a href="/login" className="text-blue-700 hover:underline">Sign In</a>
          </p>
        </form>
      </div>
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
function Select({ id, icon, placeholder, value, onChange, options=[] }) {
  const listId = id || `list-${placeholder.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
      <input
        className="w-full border rounded-md pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
        placeholder={placeholder}
        value={value}
        onChange={(e)=>onChange(e.target.value)}
        list={listId}
      />
      <datalist id={listId}>
        {options.map(o => <option key={o} value={o} />)}
      </datalist>
    </div>
  );
}
