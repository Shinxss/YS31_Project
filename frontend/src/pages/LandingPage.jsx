// src/pages/LandingPage.jsx
import React, { useEffect, useState } from "react";
import Header from "../components/Navbar";
import Footer from "../components/Footer";
import {
  Search as SearchIcon,
  Bell,
  FileText,
  Megaphone,
  BarChart3,
  BadgeCheck,
  Users,
  Building2,
  Star,
  MapPin,
  Clock3,
  Tag,
  ClipboardList,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const JOBS_URL = `${API_BASE}/api/jobs`;

export default function LandingPage() {
  // ---- Stats state (from backend) ----
  const [stats, setStats] = useState({
    activeStudents: 0,
    companies: 0,
    internships: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState("");

  // Success rate state (now real)
  const [acceptedCount, setAcceptedCount] = useState(null);
  const [totalCount, setTotalCount] = useState(null);
  const [successRate, setSuccessRate] = useState(null);
  const [loadingSuccessRate, setLoadingSuccessRate] = useState(true);

  const navigate = useNavigate();

  // login modal state (for apply/login flow)
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);

  // search inputs
  const [searchQ, setSearchQ] = useState("");
  const [searchLocation, setSearchLocation] = useState("");

  useEffect(() => {
    let ignore = false;
    const ctrl = new AbortController();

    // Public counters
    (async () => {
      try {
        setLoadingStats(true);
        setStatsError("");
        const res = await fetch(`${API_BASE}/api/stats/public`, {
          signal: ctrl.signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to load stats");
        if (!ignore) {
          setStats({
            activeStudents: data.activeStudents ?? 0,
            companies: data.companies ?? 0,
            internships: data.internships ?? 0,
          });
        }
      } catch (e) {
        if (!ignore && e.name !== "AbortError") {
          setStatsError(e.message || "Failed to load stats");
        }
      } finally {
        if (!ignore) setLoadingStats(false);
      }
    })();

    // Real success rate
    (async () => {
      try {
        setLoadingSuccessRate(true);
        setAcceptedCount(null);
        setTotalCount(null);

        const r = await fetch(`${API_BASE}/api/applications/success-rate`, {
          signal: ctrl.signal,
        });
        if (!r.ok) throw new Error("Failed to load success rate");
        const d = await r.json();

        if (!ignore) {
          const accepted = Number(d.accepted ?? d.acceptedApplications ?? d.hired ?? d.hires ?? 0);
          const total = Number(d.total ?? d.totalApplications ?? d.applications ?? 0);
          setAcceptedCount(accepted);
          setTotalCount(total);
          setSuccessRate(total > 0 ? Math.round((accepted / total) * 100) : 0);
        }
      } catch (e) {
        if (!ignore && e.name !== "AbortError") {
          // leave nulls so UI shows "—"
          setAcceptedCount(null);
          setTotalCount(null);
          setSuccessRate(null);
        }
      } finally {
        if (!ignore) setLoadingSuccessRate(false);
      }
    })();

    return () => {
      ignore = true;
      ctrl.abort();
    };
  }, []);

  // --- handlers for buttons/navigation/modal ---
  const goToInternships = () => navigate("/internships");
  const goToPostOpportunities = () => navigate("/company");

  const openLoginModalForJob = (jobId) => {
    setSelectedJobId(jobId || null);
    setLoginModalOpen(true);
  };

  const handleNavigateToLogin = () => {
    const redirect = selectedJobId ? `/jobs/${selectedJobId}` : "/jobs";
    navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
  };

  const handleNavigateToSignup = () => {
    const redirect = selectedJobId ? `/jobs/${selectedJobId}` : "/jobs";
    navigate(`/signup?redirect=${encodeURIComponent(redirect)}`);
  };

  const onSearchSubmit = (e) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (searchQ?.trim()) params.set("q", searchQ.trim());
    if (searchLocation?.trim()) params.set("location", searchLocation.trim());
    const qs = params.toString();
    navigate(`/internships${qs ? `?${qs}` : ""}`);
  };

  return (
    <>
      <Header />

      {/* HERO */}
      <section className="bg-[#ECF3FC] pt-16 pb-10">
        <div className="text-center max-w-4xl mx-auto px-6">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            Connect Your Future with <br />
            <span className="bg-gradient-to-r from-blue-900 to-[#F37526] bg-clip-text text-transparent">
              the Perfect Internship
            </span>
          </h1>
          <p className="text-gray-600 mt-4">
            Join thousands of students finding meaningful internships and companies discovering top talent.
            Your career journey starts here.
          </p>
        </div>

        {/* Buttons with icons */}
        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={goToInternships}
            className="bg-blue-900 text-white font-medium px-8 py-3 rounded-md hover:bg-blue-800 transition inline-flex items-center gap-2"
          >
            <Users className="w-5 h-5" />
            Find Internships
          </button>

          <button
            onClick={goToPostOpportunities}
            className="border border-gray-300 px-8 py-3 rounded-md font-medium hover:border-blue-900 transition inline-flex items-center gap-2"
          >
            <ClipboardList className="w-5 h-5" />
            Post Opportunities
          </button>
        </div>

        {/* Search */}
        <form onSubmit={onSearchSubmit} className="w-full max-w-[1000px] h-[90px] bg-white shadow-md rounded-xl mt-10 flex items-center p-4 gap-4 mx-auto">
          <input
            type="text"
            placeholder="Search Internships, companies, or skills..."
            className="flex-1 border rounded-md px-4 py-2 h-[60px] outline-none"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
          <input
            type="text"
            placeholder="Location"
            className="w-1/3 border rounded-md px-4 py-2 h-[60px] outline-none"
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
          />
          <button
            type="submit"
            className="bg-[#F37526] h-[60px] text-white px-6 py-2 rounded-md font-medium hover:bg-orange-600 transition"
          >
            Search
          </button>
        </form>

        {/* Stats (live) */}
        <div className="max-w-[1000px] mx-auto mt-8 flex justify-between text-center items-center">
          <Stat
            label="Active Students"
            value={stats.activeStudents}
            loading={loadingStats}
            error={statsError}
          />
          <Stat
            label="Companies"
            value={stats.companies}
            loading={loadingStats}
            error={statsError}
          />
          <Stat
            label="Opportunities"
            value={stats.internships}
            loading={loadingStats}
            error={statsError}
          />

          {/* Success Rate */}
          <div className="min-w-[160px]">
            <h3
              className="text-2xl font-bold text-blue-900"
              title={
                acceptedCount != null && totalCount != null
                  ? `${acceptedCount} accepted of ${totalCount} applications`
                  : undefined
              }
            >
              {loadingSuccessRate ? "…" : successRate != null ? `${successRate}%` : "—"}
            </h3>
            <p className="text-gray-600">Success Rate</p>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="bg-[#ffffff] pt-16 pb-20">
        <SectionTitle
          title="Everything You Need to"
          gradient="Succeed"
          subtitle="Whether you're a student seeking opportunities or a company looking for talent, we have the tools to make it happen."
        />

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-[#1A33A2] rounded-lg">
                  <Users className="w-7 h-7  text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-blue-900">For Students</h3>
              </div>
              <FeatureCard
                icon={<SearchIcon className="w-7 h-7 text-blue-900" />}
                iconBg="bg-indigo-100"
                title="Search & Apply Easily"
                text="Easily find internships or part-time jobs by location, skills, or field."
              />
              <FeatureCard
                icon={<Bell className="w-7 h-7 text-blue-900" />}
                iconBg="bg-indigo-100"
                title="Real-time Notifications"
                text="Get instant updates on your application status."
              />
              <FeatureCard
                icon={<FileText className="w-7 h-7 text-blue-900" />}
                iconBg="bg-indigo-100"
                title="Application Tracking"
                text="Manage all your applications in one place with detailed status updates."
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-[#F37526] rounded-lg">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-[#1A33A2]">For Companies</h3>
              </div>

              <FeatureCard
                icon={<Megaphone className="w-7 h-7 text-[#F37526]" />}
                iconBg="bg-orange-100"
                title="Post Opportunities"
                text="Easily list internships or part-time jobs for students."
              />
              <FeatureCard
                icon={<BarChart3 className="w-7 h-7 text-[#F37526]" />}
                iconBg="bg-orange-100"
                title="Analytics Dashboard"
                text="Manage applications in one place with detailed status updates."
              />
              <FeatureCard
                icon={<BadgeCheck className="w-7 h-7 text-[#F37526]" />}
                iconBg="bg-orange-100"
                title="Company Branding"
                text="Set up a profile to showcase your brand and attract candidates."
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURED OPPORTUNITIES (Dynamic) ===== */}
      <section className="bg-[#ECF3FC] pt-16 pb-20">
        <SectionTitle
          title="Featured"
          gradient="Opportunities"
          subtitle="Discover internships from top companies actively hiring students like you."
        />

        <div className="max-w-7xl mx-auto px-6">
          <FeaturedJobsGrid onRequestLogin={openLoginModalForJob} />
          <div className="mt-10 flex justify-center">
            <button
              onClick={() => navigate("/internships")}
              className="border border-gray-300 hover:border-[#F37526] px-6 py-2 rounded-md bg-white"
            >
              View All Opportunities
            </button>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="bg-[#ffffff] pt-16 pb-20">
        <SectionTitle
          title="Ready to"
          gradient="Get Started?"
          subtitle="Join thousands of students and companies who have found success through InternConnect."
        />

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-10">
            <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-10 text-center min-h-[360px]">
              <div className="mx-auto w-14 h-14 rounded-xl bg-blue-900/10 text-blue-900 flex items-center justify-center mb-5">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold">For Students</h3>
              <p className="text-gray-600 mt-3">
                Create your profile and start applying to internships from top companies. Build your career with meaningful opportunities.
              </p>
              <button
                onClick={() => navigate("/signup")}
                className="mt-30 bg-[#F37526] hover:bg-orange-600 text-white px-8 py-3 rounded-md font-medium transition"
              >
                Start your journey →
              </button>
            </div>

            <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-10 text-center min-h-[460px]">
              <div className="mx-auto w-14 h-14 rounded-xl bg-blue-900/10 text-blue-900 flex items-center justify-center mb-5">
                <Building2 className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold">For Companies</h3>
              <p className="text-gray-600 mt-3">
                Connect with pre-screened students from top universities. Post your internship opportunities and find the perfect talent.
              </p>
              <button
                onClick={goToPostOpportunities}
                className="mt-30 border border-gray-300 hover:border-[#F37526] px-8 py-3 rounded-md font-medium transition"
              >
                Post your First Job →
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* LOGIN REQUIRED MODAL */}
      {loginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setLoginModalOpen(false)} />
          <div className="relative z-10 w-full max-w-sm mx-4">
            <div className="bg-white rounded-xl border-4 border-blue-500 shadow-lg overflow-hidden">
              <button
                onClick={() => setLoginModalOpen(false)}
                aria-label="Close"
                className="absolute right-3 top-3 z-20 text-blue-700 hover:text-blue-900"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.28 4.28a.75.75 0 011.06 0L10 8.94l4.66-4.66a.75.75 0 111.06 1.06L11.06 10l4.66 4.66a.75.75 0 11-1.06 1.06L10 11.06l-4.66 4.66a.75.75 0 11-1.06-1.06L8.94 10 4.28 5.34a.75.75 0 010-1.06z" clipRule="evenodd" />
                </svg>
              </button>

              <div className="p-6 pt-8 text-center">
                <h2 className="text-blue-700 font-bold text-xl">Login Required</h2>
                <p className="text-sm text-gray-600 mt-2">
                  Please login or sign up to apply for this job
                </p>

                <div className="mt-5 space-y-3">
                  <button
                    onClick={handleNavigateToLogin}
                    className="w-full block bg-[#F37526] hover:bg-[#e36210] text-white py-3 rounded-md text-lg font-medium shadow-sm focus:outline-none"
                  >
                    Login
                  </button>

                  <button
                    onClick={handleNavigateToSignup}
                    className="w-full block bg-[#F37526] hover:bg-[#e36210] text-white py-3 rounded-md text-lg font-medium shadow-sm focus:outline-none"
                  >
                    Sign Up
                  </button>
                </div>

                <button
                  onClick={() => setLoginModalOpen(false)}
                  className="mt-4 text-xs text-gray-500 underline"
                >
                  Continue browsing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- helpers ---------- */
function SectionTitle({ title, gradient, subtitle }) {
  return (
    <div className="text-center max-w-4xl mx-auto mb-10 px-6">
      <h2 className="text-4xl font-bold">
        {title}{" "}
        <span className="bg-gradient-to-r from-blue-900 via-blue-700 to-[#F37526] bg-clip-text text-transparent">
          {gradient}
        </span>
      </h2>
      <p className="text-gray-600 mt-3">{subtitle}</p>
    </div>
  );
}

function Stat({ value, label, loading, error }) {
  const formatted =
    typeof value === "number"
      ? Intl.NumberFormat("en", { notation: "compact" }).format(value)
      : value;

  return (
    <div className="min-w-[160px]">
      <h3 className="text-2xl font-bold text-blue-900">
        {loading ? "…" : error ? "—" : formatted}
      </h3>
      <p className="text-gray-600">{label}</p>
      {error && (
        <p className="text-xs text-red-500 mt-1" title={error}>
          couldn’t load
        </p>
      )}
    </div>
  );
}

function FeatureCard({ icon, iconBg, title, text }) {
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-7 mb-6 min-h-[160px]">
      <div className="flex gap-5">
        <div className={`w-14 h-14 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div>
          <h4 className="text-xl font-semibold">{title}</h4>
          <p className="text-gray-600 mt-2">{text}</p>
        </div>
      </div>
    </div>
  );
}

/** Small, dependency-free "time ago" helper */
function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff) || diff < 0) return "";
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (day > 30) return "1 month ago";
  if (day >= 7) return `${Math.floor(day / 7)} week${Math.floor(day / 7) > 1 ? "s" : ""} ago`;
  if (day >= 1) return `${day} day${day > 1 ? "s" : ""} ago`;
  if (hr >= 1) return `${hr} hour${hr > 1 ? "s" : ""} ago`;
  if (min >= 1) return `${min} minute${min > 1 ? "s" : ""} ago`;
  return "just now";
}

/* ---------- Dynamic Featured Jobs Grid ---------- */
function FeaturedJobsGrid({ onRequestLogin }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancel = false;
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(JOBS_URL, { signal: ac.signal });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to load jobs");
        const list = Array.isArray(data.jobs) ? data.jobs.slice(0, 3) : [];
        if (!cancel) setJobs(list);
      } catch (e) {
        if (!cancel && e.name !== "AbortError") setError(e.message || "Failed to load jobs");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; ac.abort(); };
  }, []);

  if (loading) {
    return (
      <div className="grid md:grid-cols-3 gap-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white border border-gray-200 shadow-lg rounded-2xl p-8 animate-pulse min-h-[520px]"/>
        ))}
      </div>
    );
  }

  if (error) return <div className="text-center text-red-600">{error}</div>;
  if (!jobs.length) return <div className="text-center text-gray-600">No open jobs yet.</div>;

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {jobs.map((job, i) => {
        const company = job.companyName || "Company";
        const jobTitle = job.title || "Internship";
        const description = job.description || "";
        const location = job.location || "—";
        const jobType = job.jobType || job.workType || "";
        const category = job.department || "—";
        const skills = Array.isArray(job.skills) ? job.skills.slice(0, 6) : [];
        const posted = timeAgo(job.createdAt);

        return (
          <div key={job._id || i} className="bg-white border border-gray-200 shadow-lg rounded-2xl p-8 min-h-[520px]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center font-semibold">
                  {company.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-lg leading-tight">{company}</div>
                </div>
              </div>
              {posted && (
                <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium">
                  {posted}
                </span>
              )}
            </div>

            <h3 className="mt-5 text-2xl font-bold leading-snug">{jobTitle}</h3>
            <p className="text-gray-600 mt-3 line-clamp-4">{description}</p>

            <div className="mt-5 space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>{location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock3 className="w-4 h-4 text-gray-500" />
                <span>{jobType || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-500" />
                <span>{category}</span>
              </div>
            </div>

            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 max-h-[60px] overflow-hidden">
                {skills.map((s, idx) => (
                  <span key={idx} className="text-xs border border-gray-300 rounded-full px-3 py-1">
                    {s}
                  </span>
                ))}
              </div>
            )}

            <button
              onClick={() => onRequestLogin?.(job._id)}
              className="mt-6 block w-full text-center bg-[#F37526] hover:bg-orange-600 text-white py-3 rounded-md font-medium transition"
            >
              Apply Now
            </button>
          </div>
        );
      })}
    </div>
  );
}
