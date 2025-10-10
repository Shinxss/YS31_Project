import JobList from "@/components/dashboard/JobList.jsx";
import { useNavigate } from "react-router-dom";

export default function JobPostingsPage({ token }) {
  const navigate = useNavigate();
  return (
    <section className="bg-white rounded-xl shadow-sm border p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Job Postings</h3>
        <button
          onClick={() => navigate("/dashboard/post-job")}
          className="px-3 py-2 rounded-md bg-[#F37526] text-white hover:bg-orange-600"
        >
          Post New Job
        </button>
      </div>
      <JobList token={token} />
    </section>
  );
}
