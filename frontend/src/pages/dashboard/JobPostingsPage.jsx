import JobList from "@/components/dashboard/JobList.jsx";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

export default function JobPostingsPage({ token }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#E9EDF5] py-10">
      <div className="max-w-6xl mx-auto relative">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[#1A2B6D]">
            Job Postings
          </h1>

          <button
            onClick={() => navigate("/dashboard/post-job")}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#F37526] text-white font-semibold shadow-md hover:bg-[#24389D] transition"
          >
            <Plus size={18} /> Post New Job
          </button>
        </div>

        {/* Job Cards */}
        <div className="space-y-6">
          <JobList token={token} />
        </div>
      </div>
    </div>
  );
}
