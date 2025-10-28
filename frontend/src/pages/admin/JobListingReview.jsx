import { useEffect, useState } from "react";
import { Eye, Trash2, Loader2, X } from "lucide-react";
import { toast } from "react-toastify";

const API_BASE =
  (import.meta.env.VITE_API_BASE || "http://localhost:5000").replace(/\/+$/, "");

export default function JobListingReview() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function fetchJobs() {
    try {
      const res = await fetch(`${API_BASE}/api/admin/job-listings`);
      if (!res.ok) throw new Error("Failed to fetch jobs");
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch job listings");
    } finally {
      setLoading(false);
    }
  }

  async function deleteJob(id) {
    try {
      const res = await fetch(`${API_BASE}/api/admin/job-listings/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete job listing");
      toast.success("Job listing deleted successfully");
      setJobs((prev) => prev.filter((job) => job._id !== id));
      setSelectedJob(null);
      setConfirmDelete(false);
    } catch (err) {
      console.error(err);
      toast.error("Error deleting job listing");
    }
  }

  useEffect(() => {
    fetchJobs();
  }, []);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Listing Review</h1>
      <p className="text-lg text-gray-600 mb-8">
        Review and manage job listings submitted by companies.
      </p>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="animate-spin text-gray-500 w-8 h-8" />
        </div>
      ) : jobs.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">No job listings available.</p>
      ) : (
        <div className="space-y-5">
          {jobs.map((job) => (
            <div
              key={job._id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition p-6 flex justify-between items-center"
            >
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                <p className="text-gray-700 text-lg">{job.companyName}</p>
                <p className="text-gray-500 text-md">
                  {job.location} • {job.department}
                </p>
                <p className="text-gray-400 text-sm">
                  Posted: {new Date(job.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedJob(job)}
                className="flex items-center gap-2 text-blue-600 border border-blue-600 px-5 py-2 rounded-lg hover:bg-blue-600 hover:text-white transition"
              >
                <Eye size={18} /> View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ---------------------- Job Details Modal ---------------------- */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl p-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedJob(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
            >
              <X />
            </button>

            <h2 className="text-3xl font-bold text-gray-900 mb-1">{selectedJob.title}</h2>
            <p className="text-gray-600 text-lg mb-6">
              Detailed information about this job listing
            </p>

            <section className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Job Information
              </h3>
              <div className="grid grid-cols-2 gap-y-2 text-lg">
                <p>
                  <strong>Company:</strong> {selectedJob.companyName || "—"}
                </p>
                <p>
                  <strong>Department:</strong> {selectedJob.department || "—"}
                </p>
                <p>
                  <strong>Location:</strong> {selectedJob.location || "—"}
                </p>
                <p>
                  <strong>Work Type:</strong> {selectedJob.workType || "—"}
                </p>
                <p>
                  <strong>Job Type:</strong> {selectedJob.jobType || "—"}
                </p>
                <p>
                  <strong>Salary:</strong> {selectedJob.salaryMax || "—"}
                </p>
              </div>
            </section>

            <section className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Description</h3>
              <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">
                {selectedJob.description || "No description provided."}
              </p>
            </section>

            {selectedJob.skills?.length > 0 && (
              <section className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Skills</h3>
                <ul className="list-disc pl-6 text-gray-700 text-lg">
                  {selectedJob.skills.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </section>
            )}

            {selectedJob.requirements?.length > 0 && (
              <section className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Requirements
                </h3>
                <ul className="list-disc pl-6 text-gray-700 text-lg">
                  {selectedJob.requirements.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </section>
            )}

            {selectedJob.responsibilities?.length > 0 && (
              <section className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Responsibilities
                </h3>
                <ul className="list-disc pl-6 text-gray-700 text-lg">
                  {selectedJob.responsibilities.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </section>
            )}

            {selectedJob.offers?.length > 0 && (
              <section className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Offers</h3>
                <ul className="list-disc pl-6 text-gray-700 text-lg">
                  {selectedJob.offers.map((o, i) => (
                    <li key={i}>{o}</li>
                  ))}
                </ul>
              </section>
            )}

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setConfirmDelete(true)}
                className="bg-red-600 text-white px-6 py-2 text-lg rounded-lg flex items-center gap-2 hover:bg-red-700 transition"
              >
                <Trash2 size={18} /> Delete Listing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------- Confirm Delete ---------------------- */}
      {confirmDelete && selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-[400px] shadow-lg text-center">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Delete Job Listing?
            </h3>
            <p className="text-gray-600 mb-6 text-lg">
              Are you sure you want to permanently delete{" "}
              <strong>{selectedJob.title}</strong>?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => deleteJob(selectedJob._id)}
                className="bg-red-600 text-white px-6 py-2 text-lg rounded-lg hover:bg-red-700 transition"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="bg-gray-200 text-gray-800 px-6 py-2 text-lg rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
