import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Clock, Briefcase, ArrowLeft, Building2 } from "lucide-react";
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

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/jobs/${jobId}`);
        const data = await res.json();
        setJob(data.job || data);
      } catch (err) {
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

  if (loading)
    return <div className="p-6 text-gray-600">Loading job details...</div>;

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

  // ✅ Helper: Convert field to array safely
  const toArray = (field) => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === "string") return field.split("\n");
    return [];
  };

  const requirements = toArray(job.requirements);
  const responsibilities = toArray(job.responsibilities);
  const offers = toArray(job.offers);

  return (
    <div className="min-h-screen bg-[#F4F7FB] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft size={16} /> Back to Jobs
        </button>

        {/* Main Container */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* LEFT SIDE */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-blue-900">
                  {job.title}
                </h1>
                <span className="text-[#F37526] font-semibold text-lg">
                  {job.salaryMax
                    ? `${job.salaryMax}/month`
                    : job.salary || "Salary not specified"}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-4 text-gray-600 text-sm">
                <span className="flex items-center gap-1">
                  <Building2 size={16} /> {job.companyName || "Company"}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={16} /> {job.location || "Location not specified"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={16} /> {job.workType || "On-site"}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase size={16} /> {job.jobType || "Full-time"}
                </span>
              </div>
            </div>

            {/* About This Role */}
            <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">
                About This Role
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {job.description ||
                  "No description available for this role at the moment."}
              </p>
            </div>

            {/* Requirements */}
            {requirements.length > 0 && (
              <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-blue-900 mb-2">
                  Requirements
                </h2>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  {requirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Responsibilities */}
            {responsibilities.length > 0 && (
              <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-blue-900 mb-2">
                  Responsibilities
                </h2>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  {responsibilities.map((res, i) => (
                    <li key={i}>{res}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* What We Offer */}
            {offers.length > 0 && (
              <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-blue-900 mb-2">
                  What We Offer
                </h2>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  {offers.map((offer, i) => (
                    <li key={i}>{offer}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* RIGHT SIDE */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-6">
              <button
                onClick={handleApply}
                disabled={isApplying}
                className={`w-full py-2 font-medium rounded-md ${
                  isApplying
                    ? "bg-gray-400"
                    : "bg-[#F37526] hover:bg-[#e36210] text-white"
                }`}
              >
                {isApplying ? "Applying..." : "Apply Now"}
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                Join thousands of successful applicants
              </p>
            </div>

            {/* Key Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">
                Key Details
              </h3>
              <div className="space-y-2 text-gray-700 text-sm">
                <p><strong>Duration:</strong> {job.duration || "3 months"}</p>
                <p><strong>Job Type:</strong> {job.jobType || "Full-time"}</p>
                <p><strong>Category:</strong> {job.category || "Technology"}</p>
                <p><strong>Posted:</strong> {job.postedDate || "2 days ago"}</p>
              </div>
            </div>

            {/* Skills Required */}
            {job.skills?.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">
                  Skills Required
                </h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 text-xs bg-[#FFF3E9] text-[#F37526] rounded-full border border-[#F37526]/20"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* About Company */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">
                About {job.companyName || "the Company"}
              </h3>
              <p className="text-sm text-gray-700">
                {job.companyDescription ||
                  "Information about the company will appear here."}
              </p>
              <div className="mt-3 text-sm text-gray-600">
                <p>
                  <strong>Company Size:</strong>{" "}
                  {job.companySize || "Not specified"}
                </p>
                {job.contactEmail && (
                  <p>
                    <strong>Contact:</strong> {job.contactEmail}
                  </p>
                )}
                {job.website && (
                  <p>
                    <strong>Website:</strong>{" "}
                    <a
                      href={job.website}
                      target="_blank"
                      className="text-[#F37526] hover:underline"
                    >
                      {job.website}
                    </a>
                  </p>
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
