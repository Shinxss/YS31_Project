// src/pages/dashboard/DashboardHome.jsx
import React from "react";
import { Send, CheckCircle2, XCircle, BarChart3 } from "lucide-react";
import NoteTaskCard from "@/components/dashboard/NoteTaskCard.jsx";

export default function DashboardHome({ person }) {
  const firstName = person?.firstName || person?.name || "John Doe";
  const userKey = person?._id || person?.id || "company";

  // sample figures
  const data = { sent: 12, accepted: 2, rejected: 10 };
  const successRate =
    data.sent > 0 ? ((data.accepted / data.sent) * 100).toFixed(2) : "0.00";

  return (
    <div className="space-y-6 px-6 py-5">
      {/* Welcome + wide pill tabs (floating) */}
      <header className="space-y-3">
        <h2 className="text-2xl font-semibold">Welcome back, {firstName}!</h2>
        <p className="text-gray-600">
          Manage your internship program and track recruitment progress
        </p>

        <div className="w-full">
          <div className="w-full rounded-xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-1">
            <div className="grid grid-cols-3">
              <button
                className="h-10 rounded-full text-sm font-medium bg-blue-100/70 text-gray-900"
                aria-current="page"
              >
                Overview
              </button>
              <button className="h-10 rounded-full text-sm text-gray-600 hover:bg-gray-50 transition">
                Job Postings
              </button>
              <button className="h-10 rounded-full text-sm text-gray-600 hover:bg-gray-50 transition">
                Applications
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Floating stats row (no borders, h-36) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <FloatStatCard
          icon={<Send className="w-5 h-5" />}
          label="Application Sent"
          value={data.sent}
          sub="+4 from last week"
        />
        <FloatStatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Application Accepted"
          value={data.accepted}
          sub="+1 from last week"
        />
        <FloatStatCard
          icon={<XCircle className="w-5 h-5" />}
          label="Application Rejected"
          value={data.rejected}
          sub="+5 from this week"
        />
        <ProgressStatCard
          icon={<BarChart3 className="w-5 h-5" />}
          label="Success Rate"
          value={`${successRate}%`}
          percent={parseFloat(successRate)}
        />
      </section>

      {/* Main content: left lists + right Notes/Tasks */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Applicants — floating, with light grey separators */}
          <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Applicants</h3>
              <button className="text-sm text-blue-700 hover:underline">
                View all
              </button>
            </div>
            {/* ⬇️ light grey separators added */}
            <ul className="divide-y divide-gray-200">
              {[
                { name: "Alex Santos", role: "Frontend Intern", status: "New" },
                { name: "Jamie Cruz", role: "Backend Intern", status: "Shortlisted" },
                { name: "Pat Dela Rosa", role: "UI/UX Intern", status: "Interview" },
              ].map((a, i) => (
                <li
                  key={i}
                  className="py-3 flex items-center justify-between px-1"
                >
                  <div>
                    <p className="font-medium">{a.name}</p>
                    <p className="text-sm text-gray-500">{a.role}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                    {a.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Open Positions — floating */}
          <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Open Positions</h3>
              <button className="text-sm text-blue-700 hover:underline">
                Manage
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { title: "React Frontend Intern", applicants: 42 },
                { title: "Node.js Backend Intern", applicants: 31 },
                { title: "UI/UX Design Intern", applicants: 28 },
                { title: "QA Intern", applicants: 23 },
              ].map((j, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-white shadow-sm hover:shadow-md transition p-3"
                >
                  <p className="font-medium">{j.title}</p>
                  <p className="text-sm text-gray-500">
                    {j.applicants} applicants
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notes/Tasks — floating, taller height */}
        <div className="lg:col-span-1">
          <NoteTaskCard
            title="Notes & Tasks"
            userKey={userKey}
            className="border-0 shadow-[0_8px_30px_rgba(0,0,0,0.08)] h-[19rem] h-75"
          />
        </div>
      </section>
    </div>
  );
}

/* --- Components --- */

function FloatStatCard({ icon, label, value, sub }) {
  return (
    <div className="relative h-36 rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_10px_36px_rgba(0,0,0,0.12)] transition-all duration-200 hover:-translate-y-0.5 p-5">
      <div className="absolute top-4 right-4 text-gray-300">{icon}</div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-[#0D2F6F]">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

function ProgressStatCard({ icon, label, value, percent = 0 }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="relative h-36 rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_10px_36px_rgba(0,0,0,0.12)] transition-all duration-200 hover:-translate-y-0.5 p-5">
      <div className="absolute top-4 right-4 text-gray-300">{icon}</div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-[#0D2F6F]">{value}</p>
      <div className="mt-3 h-2.5 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-700 to-orange-400"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
