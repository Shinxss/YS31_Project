// frontend/src/pages/LandingPage.jsx
import React, { useEffect, useState, useMemo } from "react";
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

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function LandingPage() {
  // ---- Stats state (from backend) ----
  const [stats, setStats] = useState({
    activeStudents: 0,
    companies: 0,
    internships: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState("");

  useEffect(() => {
    let ignore = false;
    const ctrl = new AbortController();

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

    return () => {
      ignore = true;
      ctrl.abort();
    };
  }, []);

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
          <button className="bg-blue-900 text-white font-medium px-8 py-3 rounded-md hover:bg-blue-800 transition inline-flex items-center gap-2">
            <Users className="w-5 h-5" />
            Find Internships
          </button>
          <button className="border border-gray-300 px-8 py-3 rounded-md font-medium hover:border-blue-900 transition inline-flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Post Opportunities
          </button>
        </div>

        {/* Search */}
        <div className="w-full max-w-[1000px] h-[90px] bg-white shadow-md rounded-xl mt-10 flex items-center p-4 gap-4 mx-auto">
          <input
            type="text"
            placeholder="Search Internships, companies, or skills..."
            className="flex-1 border rounded-md px-4 py-2 h-[60px] outline-none"
          />
          <input
            type="text"
            placeholder="Location"
            className="w-1/3 border rounded-md px-4 py-2 h-[60px] outline-none"
          />
          <button className="bg-[#F37526] h-[60px] text-white px-6 py-2 rounded-md font-medium hover:bg-orange-600 transition">
            Search
          </button>
        </div>

        {/* Stats (live) */}
        <div className="max-w-[1000px] mx-auto mt-8 flex justify-between text-center">
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
            label="Internships"
            value={stats.internships}
            loading={loadingStats}
            error={statsError}
          />
          <div>
            <h3 className="text-2xl font-bold text-blue-900">95%</h3>
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

      {/* ===== FEATURED OPPORTUNITIES ===== */}
      <section className="bg-[#ECF3FC] pt-16 pb-20">
        <SectionTitle
          title="Featured"
          gradient="Opportunities"
          subtitle="Discover internships from top companies actively hiring students like you."
        />

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-gray-200 shadow-lg rounded-2xl p-8 min-h-[520px]">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center font-semibold">
                      T
                    </div>
                    <div>
                      <div className="font-semibold text-lg leading-tight">TechCorp</div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span>4.8</span>
                      </div>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium">
                    2 days ago
                  </span>
                </div>

                <h3 className="mt-5 text-2xl font-bold leading-snug">
                  Software Engineering Intern
                </h3>
                <p className="text-gray-600 mt-3">
                  Join our engineering team to build cutting-edge web applications using React and Node.js.
                  You'll work on real projects that impact millions of users.
                </p>

                <div className="mt-5 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>Dagupan City</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock3 className="w-4 h-4 text-gray-500" />
                    <span>3 months · Full-time</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-gray-500" />
                    <span>Technology</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="text-xs border border-gray-300 rounded-full px-3 py-1">React</span>
                  <span className="text-xs border border-gray-300 rounded-full px-3 py-1">JavaScript</span>
                  <span className="text-xs border border-gray-300 rounded-full px-3 py-1">Node.js</span>
                </div>

                <button className="mt-6 w-full bg-[#F37526] hover:bg-orange-600 text-white py-3 rounded-md font-medium transition">
                  Apply Now
                </button>
              </div>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <button className="border border-gray-300 hover:border-[#F37526] px-6 py-2 rounded-md">
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
              <button className="mt-30 bg-[#F37526] hover:bg-orange-600 text-white px-8 py-3 rounded-md font-medium transition">
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
              <button className="mt-30 border border-gray-300 hover:border-[#F37526] px-8 py-3 rounded-md font-medium transition">
                Post your First Job →
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
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
