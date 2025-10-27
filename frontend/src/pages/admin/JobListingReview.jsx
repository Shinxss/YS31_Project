// src/pages/admin/JobListingsReviewPage.jsx
import { useEffect, useState } from "react";
import { Loader2, X, Building2, MapPin, Calendar, Clock, DollarSign, Briefcase } from "lucide-react";

// API base resolver
function resolveApiBase() {
  let raw = (import.meta.env?.VITE_API_BASE || "").trim();
  
  raw = raw.replace(/\/+$/, "");
  
  if (/^:/.test(raw)) {
    raw = `${window.location.protocol}//localhost${raw}`;
  } else if (/^localhost(?::\d+)?$/.test(raw)) {
    raw = `${window.location.protocol}//${raw}`;
  }
  
  if (!raw && typeof window !== "undefined" && /:5173|:5174/.test(window.location.origin)) {
    raw = "http://localhost:5000";
  }
  
  return raw;
}

const RAW_API_BASE = resolveApiBase();
const api = (p) => (RAW_API_BASE ? `${RAW_API_BASE}${p}` : p);

// API endpoint for fetching job listings
const API = {
  jobs: api("/api/admin/jobs"),
};

export default function JobListingsReviewPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedJob(null);
  };

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      // Get admin auth token from localStorage
      const adminAuth = JSON.parse(localStorage.getItem("adminAuth") || "{}");
      const token = adminAuth?.token || "";

      const res = await fetch(api(`/api/admin/jobs/${jobId}/status`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.message || "Failed to update status");
      }

      // Update local state
      setJobs((prev) =>
        prev.map((job) =>
          job._id === jobId ? { ...job, status: newStatus } : job
        )
      );

      // Update selected job if modal is open
      if (selectedJob && selectedJob._id === jobId) {
        setSelectedJob({ ...selectedJob, status: newStatus });
      }
    } catch (err) {
      console.error("Error updating job status:", err);
      alert(`Failed to update status: ${err.message}`);
    }
  };

  // Fetch job listings on page load
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError("");
        
        // Get admin auth token from localStorage
        const adminAuth = JSON.parse(localStorage.getItem("adminAuth") || "{}");
        const token = adminAuth?.token || "";
        
        const res = await fetch(API.jobs, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        // Check if response is ok
        if (!res.ok) {
          throw new Error("Failed to fetch job listings");
        }

        // Try parsing JSON response
        const data = await res.json();
        setJobs(data); // Set the job data
      } catch (err) {
        console.error("Error fetching jobs:", err);
        setError("Failed to fetch jobs: " + err.message); // Handle errors
      } finally {
        setLoading(false); // Stop loading state
      }
    };

    fetchJobs();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900">Job Listings Review</h1>
      <p className="text-sm text-gray-500">Manage all posted job listings</p>

      {/* Loading or Error State */}
      {loading && (
        <div className="py-10 text-center text-gray-500">
          <Loader2 className="inline-block h-5 w-5 animate-spin mr-2" />
          Loading job listings…
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 flex items-start gap-2">
          <div>{error}</div>
        </div>
      )}

      {/* Job Listings Table */}
      {!loading && !error && jobs.length === 0 && (
        <div className="py-10 text-center text-gray-500">No job listings found.</div>
      )}

      {!loading && !error && jobs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Job Type</th>
                <th className="py-3 px-4">Salary</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Applications Count</th>
                <th className="py-3 px-4">Created At</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job._id} className="border-b border-gray-100">
                  <td className="py-4 px-4">{job.title || "N/A"}</td>
                  <td className="py-4 px-4">{job.companyName || "N/A"}</td>
                  <td className="py-4 px-4">{job.location || "N/A"}</td>
                  <td className="py-4 px-4">{job.jobType || "N/A"}</td>
                  <td className="py-4 px-4">{job.salaryMax || "N/A"}</td>
                  <td className="py-4 px-4">{job.status || "N/A"}</td>
                  <td className="py-4 px-4">{job.applicationsCount || 0}</td>
                  <td className="py-4 px-4">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        className="text-indigo-600 hover:text-indigo-900 hover:underline"
                        onClick={() => openModal(job)}
                      >
                        View
                      </button>
                      <select
                        value={job.status || "open"}
                        onChange={(e) => handleStatusChange(job._id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="px-2 py-1 rounded-md text-xs border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="open">Open</option>
                        <option value="pending">Pending</option>
                        <option value="closed">Closed</option>
                        <option value="archived">Archived</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Job Details Modal */}
      {isModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900">{selectedJob.title}</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Building2 className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Company</p>
                    <p className="font-medium">{selectedJob.companyName || "N/A"}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{selectedJob.location || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Briefcase className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Job Type</p>
                    <p className="font-medium">{selectedJob.jobType || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <DollarSign className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Salary</p>
                    <p className="font-medium">{selectedJob.salaryMax || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Department</p>
                    <p className="font-medium">{selectedJob.department || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Clock className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Work Type</p>
                    <p className="font-medium">{selectedJob.workType || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Status Badge with Change Button */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">Status</p>
                  <select
                    value={selectedJob.status || "open"}
                    onChange={(e) => {
                      handleStatusChange(selectedJob._id, e.target.value);
                    }}
                    className="px-3 py-1 rounded-md text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="open">Open</option>
                    <option value="pending">Pending</option>
                    <option value="closed">Closed</option>
                    <option value="archived">Archived</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                  selectedJob.status === "open" ? "bg-green-100 text-green-700" :
                  selectedJob.status === "closed" ? "bg-red-100 text-red-700" :
                  selectedJob.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                  selectedJob.status === "suspended" ? "bg-orange-100 text-orange-700" :
                  "bg-gray-100 text-gray-700"
                }`}>
                  {selectedJob.status || "N/A"}
                </span>
              </div>

              {/* Description */}
              {selectedJob.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedJob.description}</p>
                </div>
              )}

              {/* Skills */}
              {selectedJob.skills && selectedJob.skills.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Skills Required</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.skills.map((skill, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Requirements */}
              {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Requirements</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {selectedJob.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Responsibilities */}
              {selectedJob.responsibilities && selectedJob.responsibilities.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Responsibilities</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {selectedJob.responsibilities.map((resp, index) => (
                      <li key={index}>{resp}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Offers */}
              {selectedJob.offers && selectedJob.offers.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">What We Offer</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {selectedJob.offers.map((offer, index) => (
                      <li key={index}>{offer}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Important Dates */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                {selectedJob.startDateRange && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Start Date Range</p>
                    <p className="font-medium">
                      {new Date(selectedJob.startDateRange.from).toLocaleDateString()} - {new Date(selectedJob.startDateRange.to).toLocaleDateString()}
                    </p>
                  </div>
                )}
                
                {selectedJob.applicationDeadline && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Application Deadline</p>
                    <p className="font-medium">
                      {new Date(selectedJob.applicationDeadline).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-500 mb-1">Applications Received</p>
                  <p className="font-medium">{selectedJob.applicationsCount || 0} application(s)</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Created</p>
                  <p className="font-medium">
                    {new Date(selectedJob.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
