import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock3, Tag, Star } from "lucide-react";
import axios from "axios"; // You can use axios or fetch

const JobCard = () => {
  const [jobs, setJobs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/jobs/random"); // Adjust to your API
        setJobs(response.data);
      } catch (error) {
        console.error("Error fetching jobs", error);
      }
    };
    fetchJobs();
  }, []);

  const handleApplyClick = () => {
    setShowModal(true);
  };

  const handleLoginRedirect = () => {
    navigate("/login");
  };

  const handleSignupRedirect = () => {
    navigate("/signup");
  };

  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid md:grid-cols-3 gap-8">
        {jobs.map((job) => (
          <div key={job._id} className="bg-white border border-gray-200 shadow-lg rounded-2xl p-8 min-h-[520px]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center font-semibold">
                  T
                </div>
                <div>
                  <div className="font-semibold text-lg leading-tight">{job.companyName}</div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span>{job.rating}</span>
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium">
                {job.postedAgo}
              </span>
            </div>

            <h3 className="mt-5 text-2xl font-bold leading-snug">{job.position}</h3>
            <p className="text-gray-600 mt-3">{job.description}</p>

            <div className="mt-5 space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock3 className="w-4 h-4 text-gray-500" />
                <span>{job.duration} · {job.employmentType}</span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-500" />
                <span>{job.category}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {job.skills.map((skill) => (
                <span key={skill} className="text-xs border border-gray-300 rounded-full px-3 py-1">
                  {skill}
                </span>
              ))}
            </div>

            <button onClick={handleApplyClick} className="mt-6 w-full bg-[#F37526] hover:bg-orange-600 text-white py-3 rounded-md font-medium transition">
              Apply Now
            </button>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-80">
            <h3 className="text-lg font-semibold mb-4">Login Required</h3>
            <p className="mb-4">You need to log in to apply for this job.</p>
            <div className="flex justify-between">
              <button onClick={handleLoginRedirect} className="bg-blue-500 text-white px-4 py-2 rounded-md">
                Login
              </button>
              <button onClick={handleSignupRedirect} className="bg-green-500 text-white px-4 py-2 rounded-md">
                Sign Up
              </button>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="mt-4 text-sm text-gray-500"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobCard;
