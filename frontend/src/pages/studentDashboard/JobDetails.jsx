import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapPin,
  Briefcase,
  ArrowLeft,
  Building2,
  Star,
  CalendarDays,
  CircleDollarSign,
  Tag,
  Globe,
  Mail,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";
import ApplyModal from "@/components/studentDashboard/ApplyModal.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function JobDetails() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const [companyProfile, setCompanyProfile] = useState(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/jobs/${jobId}`);
        const data = await res.json();
        setJob(data.job || data);
        setCompanyProfile(data.company);
      } catch {
        toast.error("Failed to load job details");
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [jobId]);

  const handleApply = () => {
    const token = localStorage.getItem("ic_token");
    if (!token) {
      toast.error("Please login first to apply.");
      navigate("/student/login");
      return;
    }
    setShowApplyModal(true);
  };

  if (loading) return <div className="p-6 text-gray-600">Loading job details...</div>;

  if (!job)
    return (
      <div className="p-6 text-gray-600">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <p className="mt-3">Job not found.</p>
      </div>
    );

  // ---------------- helpers ----------------
  const toArray = (field) => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === "string") return field.split("\n").filter(Boolean);
    return [];
  };

  const getInitials = (str) => {
    const s = (str || "").trim();
    if (!s) return "T";
    const parts = s.split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase()).join("");
  };

  const formatMoney = (v) => {
    if (v == null || v === "") return null;
    if (typeof v === "string" && /[^0-9.,]/.test(v)) return v; // already formatted like "₱100000"
    const num = Number(String(v).replace(/[,]/g, ""));
    if (Number.isNaN(num)) return String(v);
    return num.toLocaleString(undefined, {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 0,
    });
  };

  const salaryDisplay = () => {
    const min = formatMoney(job.salaryMin);
    const max = formatMoney(job.salaryMax);
    if (min && max) return `${min} - ${max} / month`;
    if (max) return `${max} / month`;
    if (min) return `${min} / month`;
    if (job.salary) return job.salary; // raw fallback
    return "Salary not specified";
  };

  const fmtDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    if (isNaN(dt)) return "—";
    return dt.toLocaleString(undefined, {
      month: "short", // Oct
      day: "numeric",
      year: "numeric",
    });
  };

  const timeAgo = (dateLike) => {
    const d = dateLike ? new Date(dateLike) : null;
    if (!d || isNaN(d)) return "—";
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return "just now";
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
    const years = Math.floor(months / 12);
    return `${years} year${years > 1 ? "s" : ""} ago`;
  };

  // ---------------- derived ----------------
  const requirements = toArray(job.requirements);
  const responsibilities = toArray(job.responsibilities);
  const offers = toArray(job.offers);

  const companyName = job.companyName || job.company?.name || "Company";
  const companyLogo =
    job.companyLogoUrl || job.companyLogo || job.company?.logoUrl || null;

  const locationText =
    job.location || job.city || job.companyLocation || "Location";
  const jobType = job.jobType || "Full-time";
  const category = job.category || "Technology";
  const postedWhen = timeAgo(job.postedAt || job.createdAt) || "—";

  const workType = job.workType || job.workArrangement || "On-site";
  const startFrom = job.startDateRange?.from;
  const startTo = job.startDateRange?.to;
  const applicationDeadline = job.applicationDeadline;

  // ---------------- UI ----------------
  // Build company logo URL
  const buildCompanyLogoUrl = () => {
    if (companyProfile?.profileImage) {
      return `${API_BASE}/uploads/company/${companyProfile.profileImage}`;
    }
    return companyLogo;
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft size={16} /> Back to Jobs
        </button>

        {/* ===== COMPANY PROFILE SECTION ===== */}
        {companyProfile && (
          <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">About the Company</h3>
            <div className="flex items-start gap-4">
              {companyProfile.profileImage ? (
                <img
                  src={`${API_BASE}/uploads/company/${companyProfile.profileImage}`}
                  alt={`${companyName}`}
                  className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-blue-100 flex items-center justify-center border border-blue-200">
                  <Building2 size={24} className="text-blue-600" />
                </div>
              )}
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{companyName}</h4>
                {companyProfile.industry && (
                  <p className="text-sm text-gray-600 mt-1">{companyProfile.industry}</p>
                )}
                {companyProfile.city && (
                  <p className="text-sm text-gray-500 mt-1">
                    <MapPin size={14} className="inline mr-1" /> {companyProfile.city}
                  </p>
                )}
                {companyProfile.description && (
                  <p className="text-sm text-gray-700 mt-2">{companyProfile.description}</p>
                )}
                {companyProfile.website && (
                  <a
                    href={companyProfile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline mt-2 inline-flex items-center"
                  >
                    <Globe size={14} className="mr-1" /> Visit Website
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== TITLE CARD (no duration) ===== */}
        <div className="mt-4 bg-white rounded-xl shadow-sm border border-blue-200 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {buildCompanyLogoUrl() ? (
                <img
                  src={buildCompanyLogoUrl()}
                  alt={`${companyName} logo`}
                  className="h-9 w-9 rounded-md object-cover border border-gray-200"
                />
              ) : (
                <div className="h-9 w-9 rounded-md bg-blue-100 text-blue-700 grid place-items-center font-semibold border border-blue-200">
                  {getInitials(companyName).slice(0, 2)}
                </div>
              )}

              <div>
                <div className="text-[15px] sm:text-base font-semibold text-blue-900">
                  {job.title || "Job Title"}
                </div>

                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-gray-700">
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 size={14} />
                    {companyName}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={14} />
                    {locationText}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Tag size={14} />
                    {category}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase size={14} />
                    {jobType}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="inline-block text-[11px] px-2 py-1 rounded-full bg-blue-100 text-blue-800 mb-2">
                {postedWhen}
              </div>
              <div className="text-[#F37526] font-semibold text-base sm:text-lg">
                {salaryDisplay()}
              </div>
            </div>
          </div>
        </div>

        {/* ===== GRID ===== */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* LEFT SIDE */}
          <div className="md:col-span-2">
            {/* About This Role */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-blue-900 mb-2">
                About This Role
              </h2>
              <p className="text-[13px] text-gray-700 leading-relaxed">
                {job.description || "No description provided."}
              </p>
            </div>

            {/* Requirements */}
            {requirements.length > 0 && (
              <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">
                  Requirements
                </h3>
                <ul className="list-disc pl-6 text-[13px] text-gray-700 space-y-1.5">
                  {requirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Responsibilities */}
            {responsibilities.length > 0 && (
              <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">
                  Responsibilities
                </h3>
                <ul className="list-disc pl-6 text-[13px] text-gray-700 space-y-1.5">
                  {responsibilities.map((res, i) => (
                    <li key={i}>{res}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* What We Offer */}
            {offers.length > 0 && (
              <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">
                  What We Offer
                </h3>
                <ul className="list-disc pl-6 text-[13px] text-gray-700 space-y-1.5">
                  {offers.map((offer, i) => (
                    <li key={i}>{offer}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* RIGHT SIDE */}
          <div className="space-y-4">
            {/* Apply */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-6">
              <button
                onClick={handleApply}
                disabled={isApplying}
                className={`w-full py-2 font-medium rounded-md ${
                  isApplying
                    ? "bg-gray-400 text-white"
                    : "bg-[#F37526] hover:bg-[#e36210] text-white"
                }`}
              >
                {isApplying ? "Applying..." : "Apply Now"}
              </button>
              <p className="text-[11px] text-gray-500 text-center mt-2">
                Join thousands of successful applicants
              </p>
            </div>

            {/* ===== KEY DETAILS — EXACTLY THE 4 FIELDS ===== */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">Key Details</h3>

              <div className="divide-y divide-gray-200">
                {/* Salary (min/max fallback to salary) */}
                <div className="py-3 flex items-start gap-3">
                  <CircleDollarSign size={16} className="text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-[12px] text-gray-500">Salary</div>
                    <div className="text-[13px] text-gray-800 font-medium">
                      {salaryDisplay()}
                    </div>
                  </div>
                </div>

                {/* Application Deadline */}
                <div className="py-3 flex items-start gap-3">
                  <CalendarDays size={16} className="text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-[12px] text-gray-500">Application Deadline</div>
                    <div className="text-[13px] text-gray-800 font-medium">
                      {fmtDate(applicationDeadline)}
                    </div>
                  </div>
                </div>

                {/* Start Date (from – to) */}
                <div className="py-3 flex items-start gap-3">
                  <CalendarDays size={16} className="text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-[12px] text-gray-500">Start Date</div>
                    <div className="text-[13px] text-gray-800 font-medium">
                      {`${fmtDate(startFrom)} – ${fmtDate(startTo)}`}
                    </div>
                  </div>
                </div>

                {/* Work Type */}
                <div className="py-3 flex items-start gap-3">
                  <Briefcase size={16} className="text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-[12px] text-gray-500">Work Type</div>
                    <div className="text-[13px] text-gray-800 font-medium">{job.workType || "—"}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills Required */}
            {job.skills?.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">Skills Required</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((s, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 text-[11px] bg-[#FFF3E9] text-[#F37526] rounded-full border border-[#F37526]/30"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* About Company */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">
                About {companyName}
              </h3>

              <div className="divide-y divide-gray-200 text-[13px] text-gray-800">
                <div className="py-3 flex items-start gap-3">
                  <Users size={16} className="text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-[12px] text-gray-500">Company Size</div>
                    <div>{job.companySize || "Not specified"}</div>
                  </div>
                </div>

                {job.contactEmail && (
                  <div className="py-3 flex items-start gap-3">
                    <Mail size={16} className="text-gray-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-[12px] text-gray-500">Contact</div>
                      <div>{job.contactEmail}</div>
                    </div>
                  </div>
                )}

                {job.website && (
                  <div className="py-3 flex items-start gap-3">
                    <Globe size={16} className="text-gray-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-[12px] text-gray-500">Website</div>
                      <a
                        href={job.website}
                        target="_blank"
                        className="text-[#F37526] hover:underline"
                      >
                        {job.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <ApplyModal jobId={jobId} onClose={() => setShowApplyModal(false)} />
      )}
    </div>
  );
}