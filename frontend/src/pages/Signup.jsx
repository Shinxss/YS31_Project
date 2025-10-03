// src/pages/Signup.jsx
import React, { useState } from "react";
import { User, Building2, Mail, Lock, University, BookOpen, MapPin, FileText, ChevronDown } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function Signup() {
  const [tab, setTab] = useState("student"); // 'student' | 'company'
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  // Student form state
  const [student, setStudent] = useState({
    firstName: "", lastName: "", email: "",
    school: "", course: "", major: "",
    password: "", confirmPassword: ""
  });

  // Company form state
  const [company, setCompany] = useState({
    companyName: "", firstName: "", lastName: "",
    companyRole: "Owner", // <- the person's title (Owner/Recruiter/etc)
    email: "", industry: "Technology",
    location: "", companyDescription: "",
    password: "", confirmPassword: ""
  });

  async function handleSubmit(e) {
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
          role: "student", // <-- required by backend users collection
          email: student.email,
          password: student.password,
          firstName: student.firstName,
          lastName: student.lastName,
          school: student.school,
          course: student.course,
          major: student.major
        };
      } else {
        if (company.password !== company.confirmPassword) {
          setMsg("Passwords do not match");
          return;
        }

        body = {
          role: "company", // <-- EXACTLY 'company'
          email: company.email,
          password: company.password,

          companyName: company.companyName,
          firstName: company.firstName,
          lastName: company.lastName,

          // send the person’s title as companyRole (NOT 'role')
          companyRole: company.companyRole,

          industry: company.industry,
          location: company.location,
          companyDescription: company.companyDescription
        };
      }

      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Sign up failed");

      setMsg("✅ Account created successfully. You can now sign in.");

      // reset forms
      setStudent({
        firstName: "", lastName: "", email: "",
        school: "", course: "", major: "",
        password: "", confirmPassword: ""
      });
      setCompany({
        companyName: "", firstName: "", lastName: "",
        companyRole: "Owner",
        email: "", industry: "Technology",
        location: "", companyDescription: "",
        password: "", confirmPassword: ""
      });
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

        {/* Tabs */}
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

        <form onSubmit={handleSubmit} className="space-y-4">
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

              {/* Person's role/title inside the company */}
              <Select
                id="companyRole"
                icon={<ChevronDown />}
                placeholder="Role (Owner / Recruiter)"
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
              <Input icon={<MapPin />} placeholder="Company Location (optional)" value={company.location} onChange={v=>setCompany(s=>({...s, location:v}))}/>
              <Textarea icon={<FileText />} placeholder="Brief description of your company and what you do..." value={company.companyDescription} onChange={v=>setCompany(s=>({...s, companyDescription:v}))}/>
              <Input icon={<Lock />} placeholder="Create a strong password" type="password" value={company.password} onChange={v=>setCompany(s=>({...s, password:v}))}/>
              <Input icon={<Lock />} placeholder="Confirm your password" type="password" value={company.confirmPassword} onChange={v=>setCompany(s=>({...s, confirmPassword:v}))}/>
            </>
          )}

          <button disabled={loading} className="w-full bg-[#F37526] text-white py-3 rounded-md font-medium hover:bg-orange-600 transition disabled:opacity-60">
            {loading
              ? "Creating account..."
              : tab === "student"
              ? "Create Student Account"
              : "Create Company Account"}
          </button>

          <p className="text-center text-sm text-gray-600">
            Already have an account? <a href="/login" className="text-blue-700 hover:underline">Sign In</a>
          </p>
          <p className="text-xs text-gray-500 text-center">
            By signing in, you agree to our <a className="underline">Terms of Service</a> and <a className="underline">Privacy Policy</a>
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
function Textarea({ icon, placeholder, value, onChange }) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-3 text-gray-400">{icon}</div>
      <textarea
        className="w-full border rounded-md pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-200 min-h-[110px]"
        placeholder={placeholder}
        value={value}
        onChange={(e)=>onChange(e.target.value)}
      />
    </div>
  );
}
function Select({ id, icon, placeholder, value, onChange, options=[] }) {
  // using an <input list="..."> + <datalist> for a simple dropdown-like UX
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
