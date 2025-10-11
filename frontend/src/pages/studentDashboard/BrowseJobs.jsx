import React, { useState, useEffect } from "react";
import { MapPin, Clock, Briefcase, Search, Star } from "lucide-react";
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

  // ✅ UPDATED FILTER FUNCTION
  const filteredJobs = jobs.filter((job) => {
    const matchesQuery =
      job.title?.toLowerCase().includes(query.toLowerCase()) ||
      job.companyName?.toLowerCase().includes(query.toLowerCase()) ||
      job.skills?.some((s) => s.toLowerCase().includes(query.toLowerCase()));

    const matchesField =
      field === "All Fields" ||
      (job.workType && job.workType.toLowerCase() === field.toLowerCase());

    // ✅ FIXED: Detects jobType or workType (instead of durationMonths)
    const matchesType =
      type === "All Types" ||
      (job.jobType && job.jobType.toLowerCase() === type.toLowerCase()) ||
      (job.workType && job.workType.toLowerCase() === type.toLowerCase());

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
        <div className="text-center text-gray-500 mt-10">
          No job postings yet.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <div
              key={job._id}
              className="border border-blue-200 rounded-lg bg-white p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                {/* LEFT SIDE */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-md bg-blue-900 text-white flex items-center justify-center font-bold text-lg">
                    {job.companyName?.[0] || "C"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 text-[16px]">
                      {job.title}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <span>{job.companyName}</span>
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 ml-1" />
                      <span>4.8</span>
                    </div>
                    <p className="text-gray-600 text-sm mt-1 max-w-xl">
                      {job.description?.slice(0, 120) ||
                        "Join our engineering team to build cutting-edge web applications using React and Node.js."}
                    </p>

                    {/* Info row */}
                    <div className="flex flex-wrap gap-5 mt-2 text-gray-600 text-sm">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{job.location || "Pangasinan"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Full-time</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        <span>{job.workType || "Technology"}</span>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {(job.skills || ["React", "Javascript", "Node.js"]).map(
                        (skill) => (
                          <span
                            key={skill}
                            className="bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded-full border border-gray-200"
                          >
                            {skill}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT SIDE */}
                <div className="flex flex-col items-end gap-2">
                  <span className="text-blue-800 text-sm bg-blue-100 px-2 py-0.5 rounded-full">
                    2 days ago
                  </span>
                  <p className="text-blue-900 font-semibold text-lg">
                    {job.salaryMax || "4,000"}/month
                  </p>
                  <button className="bg-[#F37526] hover:bg-[#e36210] text-white text-sm px-4 py-1.5 rounded-md font-medium">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
