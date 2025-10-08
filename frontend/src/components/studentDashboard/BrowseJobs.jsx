import React, { useState, useEffect } from "react";
import { MapPin, Clock, Briefcase, Search } from "lucide-react";
import { getAllJobs } from "@/services/api";
import { toast } from "react-toastify";

export default function BrowseJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [field, setField] = useState("All Fields");
  const [type, setType] = useState("All Types");
  const [location, setLocation] = useState("All Locations");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await getAllJobs();

        // ✅ ADD THIS SAFE HANDLING LINE
        const list = Array.isArray(data) ? data : data.jobs || [];

        setJobs(list);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load job listings");
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter((job) => {
    const matchesQuery =
      job.title?.toLowerCase().includes(query.toLowerCase()) ||
      job.companyName?.toLowerCase().includes(query.toLowerCase()) ||
      job.skills?.some((s) => s.toLowerCase().includes(query.toLowerCase()));

    const matchesField =
      field === "All Fields" ||
      (job.workType && job.workType.toLowerCase() === field.toLowerCase());

    const matchesType =
      type === "All Types" ||
      (job.durationMonths &&
        String(job.durationMonths).includes(type.replace(" months", "")));

    const matchesLocation =
      location === "All Locations" ||
      (job.location &&
        job.location.toLowerCase().includes(location.toLowerCase()));

    return matchesQuery && matchesField && matchesType && matchesLocation;
  });

  return (
    <div className="p-6 bg-[#ECF3FC] min-h-screen overflow-y-auto">
      {/* ===== HEADER ===== */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-blue-900">
          Find Your Perfect <span className="text-[#F37526]">Internship</span>
        </h1>
        <p className="text-gray-600 mt-1">
          Discover {filteredJobs.length} opportunities from top companies
        </p>
      </div>

      {/* ===== SEARCH + FILTER BAR ===== */}
      <div className="bg-white rounded-lg shadow p-4 mb-8 flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="flex items-center bg-[#ECF3FC] rounded-md px-3 py-2 flex-1 min-w-[250px]">
          <Search className="w-4 h-4 text-gray-500 mr-2" />
          <input
            type="text"
            placeholder="Search jobs, companies, or skills..."
            className="bg-transparent outline-none w-full text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Field Filter */}
        <select
          className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700"
          value={field}
          onChange={(e) => setField(e.target.value)}
        >
          <option>All Fields</option>
          <option>Technology</option>
          <option>Design</option>
          <option>Business</option>
          <option>Education</option>
        </select>

        {/* Type Filter */}
        <select
          className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option>All Types</option>
          <option>Full-time</option>
          <option>Part-time</option>
          <option>Remote</option>
        </select>

        {/* Location Filter */}
        <select
          className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        >
          <option>All Locations</option>
          <option>Dagupan City</option>
          <option>Manila</option>
          <option>San Fabian</option>
          <option>Pangasinan</option>
        </select>
      </div>

      {/* ===== JOB CARDS ===== */}
      {loading ? (
        <div className="text-center text-gray-600 mt-10">
          Loading job listings...
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">No job postings yet.</div>
      ) : (
        <div className="space-y-5">
          {filteredJobs.map((job) => (
            <div
              key={job._id}
              className="bg-white rounded-lg shadow p-5 border border-gray-100"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    {job.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {job.companyName} • {job.location}
                  </p>
                </div>
                <p className="text-blue-700 font-semibold text-sm">
                  {job.salaryCurrency} {job.salaryMax}/month
                </p>
              </div>
              <p className="text-gray-600 text-sm mb-3">
                {job.description || "No description available."}
              </p>
              <div className="flex flex-wrap gap-2">
                {(job.skills || []).map((skill) => (
                  <span
                    key={skill}
                    className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
