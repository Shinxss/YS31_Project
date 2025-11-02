// src/pages/admin/JobListingsReviewPage.jsx
import { useEffect, useState, useMemo } from "react";
import { Loader2, X, Building2, MapPin, Calendar, Clock, DollarSign, Briefcase, Search as SearchIcon, ChevronUp, MoreVertical } from "lucide-react";

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
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState("default");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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

  const filteredJobs = useMemo(() => {
    let list = [...jobs];

    // Apply search filter
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((job) =>
        (job.title || "").toLowerCase().includes(q) ||
        (job.companyName || "").toLowerCase().includes(q) ||
        (job.location || "").toLowerCase().includes(q)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      list = list.filter((job) => job.status === statusFilter);
    }

    // Apply sorting
    list.sort((a, b) => {
      if (sortField === "date") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortField === "az") {
        return (a.title || "").localeCompare(b.title || "");
      }
      return 0;
    });

    return list;
  }, [jobs, query, statusFilter, sortField]);

  // Pagination logic
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredJobs.slice(startIndex, endIndex);
  }, [filteredJobs, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter, sortField]);

  return (
    <section className="bg-white rounded-2xl shadow-sm p-6 h-[600px] md:h-[670px] flex flex-col">
      <div className="h-[640px] flex flex-col">
        {/* Header row (static) */}
        <div className="flex items-center justify-between mb-2 shrink-0">
          <h1 className="text-lg md:text-2xl font-semibold text-gray-800">
            Job Listings Review
          </h1>
          {!loading && (
            <span className="text-sm text-gray-500">
              {filteredJobs.length} shown
              {filteredJobs.length !== jobs.length ? ` of ${jobs.length}` : ""}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 mb-4 shrink-0">
          Manage all posted job listings
        </p>

        {/* Toolbar */}
        <div className="mb-4 shrink-0 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, company, or location…"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-white"
            />
          </div>

          {/* Filters and Sort */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-white text-sm"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="suspended">Suspended</option>
            </select>

            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-white text-sm"
            >
              <option value="default">Default</option>
              <option value="date">Date</option>
              <option value="az">A-Z</option>
            </select>
          </div>
        </div>

        {/* Table card */}
        <div className="flex-1 min-h-0">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden h-full flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-3 px-4">
                      <button
                        onClick={() => setSortField("az")}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        Title
                        {sortField === "az" && <ChevronUp className="h-4 w-4" />}
                      </button>
                    </th>
                    <th className="py-3 px-4">Company</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Job Type</th>
                    <th className="py-3 px-4">Salary</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Applications</th>
                    <th className="py-3 px-4">
                      <button
                        onClick={() => setSortField("date")}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        Created
                        {sortField === "date" && <ChevronUp className="h-4 w-4" />}
                      </button>
                    </th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-gray-500">
                        <Loader2 className="inline-block mr-2 h-4 w-4 animate-spin" />
                        Loading job listings…
                      </td>
                    </tr>
                  )}

                  {!loading && error && (
                    <tr>
                      <td colSpan={9} className="py-6 px-4">
                        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg">
                          {error}
                        </div>
                      </td>
                    </tr>
                  )}

                  {!loading && !error && filteredJobs.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-500">
                        No job listings found.
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    !error &&
                    paginatedJobs.map((job) => (
                      <tr key={job._id} className="border-b border-gray-100">
                        <td className="py-4 px-4">{job.title || "N/A"}</td>
                        <td className="py-4 px-4">{job.companyName || "N/A"}</td>
                        <td className="py-4 px-4">{job.location || "N/A"}</td>
                        <td className="py-4 px-4">{job.jobType || "N/A"}</td>
                        <td className="py-4 px-4">{job.salaryMax || "N/A"}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex px-3 py-1 rounded-full ${
                            job.status === "open" ? "bg-emerald-100 text-emerald-700" :
                            job.status === "suspended" ? "bg-rose-100 text-rose-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {(job.status || "N/A").charAt(0).toUpperCase() + (job.status || "N/A").slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4">{job.applicationsCount || 0}</td>
                        <td className="py-4 px-4">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              className="text-white bg-orange-500 py-1 px-5 border rounded-sm hover:bg-orange-400"
                              onClick={() => openModal(job)}
                            >
                              View
                            </button>
                            <div className="relative">
                              <button
                                onClick={() => setOpenDropdownId(openDropdownId === job._id ? null : job._id)}
                                className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                              >
                                <MoreVertical className="h-4 w-4 text-gray-500" />
                              </button>
                              {openDropdownId === job._id && (
                                <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                  <div className="py-1">
                                    <button
                                      onClick={() => {
                                        handleStatusChange(job._id, "open");
                                        setOpenDropdownId(null);
                                      }}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                      Open
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleStatusChange(job._id, "suspended");
                                        setOpenDropdownId(null);
                                      }}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                      Suspend
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredJobs.length)} of {filteredJobs.length} jobs
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      currentPage === page
                        ? 'text-white bg-blue-900 border border-blue-900'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Job Details Modal */}
      {isModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-sm">
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
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <span className={`inline-flex px-3 py-1 rounded-full ${
                  selectedJob.status === "open" ? "bg-emerald-100 text-emerald-700" :
                  selectedJob.status === "suspended" ? "bg-rose-100 text-rose-700" :
                  "bg-gray-100 text-gray-700"
                }`}>
                  {(selectedJob.status || "N/A").charAt(0).toUpperCase() + (selectedJob.status || "N/A").slice(1)}
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

    </section>
  );
}
