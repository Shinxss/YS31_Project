import React, { useEffect, useState } from "react";
import Header from "@/components/Navbar";
import Footer from "@/components/Footer";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function About() {
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
    <div className="bg-[#E9F3FF]">
      <Header/>
      {/* ===== Hero ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#0F1D3B]">
          About{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#2A3D66] via-[#7E5CEF] to-[#FF5A00]">
            InternConnect
          </span>
        </h1>
        <p className="mt-4 text-sm sm:text-base text-[#5E6B85] max-w-3xl mx-auto">
          Bridging the gap between talented students and innovative companies through
          meaningful internship opportunities.
        </p>
      </section>

      {/* ===== Mission + Stats ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Mission */}
          <div className="lg:col-span-6">
            <Badge>Our Mission</Badge>
            <h2 className="mt-4 text-2xl sm:text-3xl font-semibold text-[#2A3D66]">
              Empowering the Next Generation
            </h2>
            <div className="mt-4 space-y-4 text-[13px] sm:text-sm leading-relaxed text-[#2B3040]">
              <p>
                At InternConnect, we believe that internships are more than just work
                experience—they’re stepping stones to successful careers. Our platform
                connects ambitious students with forward-thinking companies, creating
                opportunities that benefit both parties.
              </p>
              <p>
                We’re committed to making the internship search process transparent,
                efficient, and accessible to everyone, regardless of their background or
                location.
              </p>
            </div>
          </div>

          {/* Right: 2x2 Stat Cards */}
          <div className="lg:col-span-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard
                icon={<UserIcon />}
                value={formatCount(stats.activeStudents)}
                label="Students Connected"
                loading={loadingStats}
                error={statsError}
              />
              <StatCard
                icon={<BuildingIcon />}
                value={formatCount(stats.companies)}
                label="Partner Companies"
                loading={loadingStats}
                error={statsError}
              />
              <StatCard
                icon={<BriefcaseIcon />}
                value={formatCount(stats.internships)}
                label="Internships"
                loading={loadingStats}
                error={statsError}
              />
              <StatCard
                icon={<ChartIcon />}
                value="95%"
                label="Success Rate"
                loading={false}
                error=""
              />
            </div>
          </div>
        </div>
      </section>

      

      {/* ===== Values FIRST (moved up) ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="text-center">
          <Badge>Our Values</Badge>
          <h3 className="mt-3 text-xl sm:text-2xl font-semibold text-[#2A3D66]">
            What We Stand For
          </h3>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ValueCard title="Transparency">
            We believe in clear communication and honest interactions between students and
            employers.
          </ValueCard>
          <ValueCard title="Inclusivity">
            Equal opportunities for all students, regardless of their background, location,
            or circumstances.
          </ValueCard>
          <ValueCard title="Innovation">
            Continuously improving our platform to better serve students and companies
            alike.
          </ValueCard>
        </div>
      </section>

      {/* ===== Story AFTER values (swapped) ===== */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <Badge>Our Story</Badge>
        <h3 className="mt-3 text-xl sm:text-2xl font-semibold text-[#2A3D66]">
          How It All Started
        </h3>
        <p className="mt-3 text-[13px] sm:text-sm text-[#2B3040] leading-relaxed">
          Founded in 2025 by a group of students who witnessed the growing challenge of
          unemployment among interns in the Philippines, InternConnect was created to help
          bridge the gap between education and employment. Our goal is to provide students
          with better access to meaningful internships and connect companies with passionate
          young talents ready to learn and grow.
        </p>
      </section>

      <Footer />
    </div>
  );
}

/* ---------- UI helpers ---------- */

function Badge({ children }) {
  return (
    <span className="inline-block rounded-full px-3 py-1 text-[11px] font-medium bg-white text-[#2A3D66] shadow-sm">
      {children}
    </span>
  );
}

function ValueCard({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h4 className="text-lg font-semibold text-[#2A3D66]">{title}</h4>
      <p className="mt-3 text-[13px] text-[#5E6B85]">{children}</p>
    </div>
  );
}

function StatCard({ icon, value, label, loading, error }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex items-start gap-3">
      <div className="shrink-0">{icon}</div>
      <div>
        <div className="text-xl font-semibold text-[#0F1D3B]">
          {loading ? "…" : error ? "—" : value}
        </div>
        <div className="text-[11px] text-[#5E6B85]">{label}</div>
        {error && (
          <div className="text-[10px] text-red-500 mt-1" title={error}>
            couldn’t load
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Icons ---------- */

function UserIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="#2A3D66" strokeWidth="1.5" />
      <path d="M4 20c1.8-3.5 5.1-5.5 8-5.5S18.2 16.5 20 20" stroke="#2A3D66" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function BuildingIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="16" height="16" rx="2" stroke="#2A3D66" strokeWidth="1.5" />
      <path d="M8 8h2M8 12h2M8 16h2M14 8h2M14 12h2M14 16h2" stroke="#2A3D66" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function BriefcaseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="7" width="18" height="12" rx="2" stroke="#2A3D66" strokeWidth="1.5" />
      <path d="M9 7V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" stroke="#2A3D66" strokeWidth="1.5" />
      <path d="M3 12h18" stroke="#2A3D66" strokeWidth="1.5" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M4 20V10" stroke="#2A3D66" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 20V6" stroke="#2A3D66" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 20V14" stroke="#2A3D66" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 20h18" stroke="#2A3D66" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- formatting (no plus) ---------- */
function formatCount(n) {
  if (typeof n !== "number" || !isFinite(n)) return "0";
  return Intl.NumberFormat("en", { notation: "compact" }).format(n);
}
