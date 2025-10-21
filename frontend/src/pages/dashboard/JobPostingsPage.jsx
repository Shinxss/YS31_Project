import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// API base resolver
const RAW_API_BASE =
  (import.meta.env?.VITE_API_BASE ||
    (typeof window !== "undefined" && /:5173|:5174/.test(window.location.origin)
      ? "http://localhost:5000"
      : "")).trim();
const api = (p) => (RAW_API_BASE ? `${RAW_API_BASE}${p}` : p);

export default function JobPostingsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch job postings from the API
  const fetchJobPostings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(api("/api/company/jobs"), {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to load job postings");
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobPostings();
  }, []);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Format job status
  const getStatusClass = (status) => {
    switch (status) {
      case "Open":
        return "bg-green-100 text-green-700";
      case "Closed":
        return "bg-red-100 text-red-700";
      case "Pending Review":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-gray-800">Job Postings</h1>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search by title..."
            className="px-4 py-2 rounded-md border border-gray-300"
          />
          <select className="px-4 py-2 rounded-md border border-gray-300">
            <option value="all">All Categories</option>
            {/* Add categories */}
          </select>
          <select className="px-4 py-2 rounded-md border border-gray-300">
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="pending">Pending Review</option>
          </select>
          <select className="px-4 py-2 rounded-md border border-gray-300">
            <option value="date">Date Posted</option>
            <option value="applications">Applications</option>
          </select>
        </div>
      </div>

      {/* Job Postings Table */}
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="overflow-x-auto bg-white shadow-md rounded-md">
          <table className="min-w-full">
            <thead className="bg-gray-100 text-xs text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">Job Title</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Date Posted</th>
                <th className="px-4 py-3 text-left">Applications</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{job.title}</td>
                  <td className="px-4 py-3">{job.category}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs ${getStatusClass(
                        job.status
                      )}`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatDate(job.datePosted)}</td>
                  <td className="px-4 py-3">{job.applications.length}</td>
                  <td className="px-4 py-3 text-sm">
                    <Link
                      to={`/company/job/${job._id}`}
                      className="text-blue-500 hover:underline"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
