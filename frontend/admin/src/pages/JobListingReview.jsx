import React, { useState, useEffect } from "react";

export default function JobListingReview() {
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobListings, setJobListings] = useState([]);

  useEffect(() => {
    async function fetchJobs() {
      const data = [
        {
          id: 1,
          title: "Senior Developer",
          company: "Tech Corp",
          field: "Software Engineering",
          location: "San Francisco, CA",
          salary: "$120,000 - $160,000",
          posted: "2025-10-20",
          description:
            "We are looking for an experienced Senior Developer to join our growing team. You will work on cutting-edge technologies and lead a team of developers.",
          requirements: [
            "5+ years experience",
            "React/Node.js expertise",
            "Team leadership skills",
          ],
        },
        {
          id: 2,
          title: "Product Manager",
          company: "StartUp Inc",
          field: "Product Management",
          location: "Austin, TX",
          salary: "$90,000 - $120,000",
          posted: "2025-10-18",
          description:
            "Join our fast-paced environment as a Product Manager to lead product development and strategy initiatives.",
          requirements: [
            "3+ years experience",
            "Strong communication skills",
            "Agile development knowledge",
          ],
        },
      ];
      setJobListings(data);
    }
    fetchJobs();
  }, []);

  return (
    <div className="ml-72 pt-28 p-8 relative">
      {/* Header */}
      <h1 className="text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">
        Job Listing Review
      </h1>
      <p className="text-xl text-gray-600 mb-10">
        Review and approve pending job listings
      </p>

      {/* Job Cards */}
      <div className="bg-white shadow-sm rounded-2xl border border-gray-200 p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-3">
          Pending Verification Queue
        </h2>
        <p className="text-lg text-gray-500 mb-8">
          Job listings awaiting approval
        </p>

        <div className="space-y-5">
          {jobListings.map((job) => (
            <div
              key={job.id}
              className="flex justify-between items-center p-6 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all duration-200"
            >
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">
                  {job.title}
                </h3>
                <p className="text-lg text-gray-700">
                  {job.company} • {job.field}
                </p>
                <p className="text-lg text-gray-700">{job.location}</p>
                <p className="text-base text-gray-500">Posted: {job.posted}</p>
              </div>
              <button
                onClick={() => setSelectedJob(job)}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white text-lg font-medium rounded-lg shadow transition"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Popup */}
      {selectedJob && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Dim background */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setSelectedJob(null)}
          ></div>

          {/* Popup content */}
          <div className="relative bg-white rounded-2xl p-10 w-full max-w-3xl shadow-2xl z-50">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-3xl font-extrabold text-gray-900">
                {selectedJob.title}
              </h3>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
              >
                ×
              </button>
            </div>

            <p className="text-lg text-gray-600 mb-6">
              Job listing verification details
            </p>

            {/* Job Info */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <h4 className="font-bold text-gray-800 text-lg mb-1">
                  Job Title
                </h4>
                <p className="text-gray-700 text-lg">{selectedJob.title}</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-lg mb-1">
                  Company
                </h4>
                <p className="text-gray-700 text-lg">{selectedJob.company}</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-lg mb-1">Field</h4>
                <p className="text-gray-700 text-lg">{selectedJob.field}</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-lg mb-1">
                  Location
                </h4>
                <p className="text-gray-700 text-lg">{selectedJob.location}</p>
              </div>
              <div className="col-span-2">
                <h4 className="font-bold text-gray-800 text-lg mb-1">
                  Salary Range
                </h4>
                <p className="text-gray-700 text-lg">{selectedJob.salary}</p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h4 className="font-bold text-gray-800 text-lg mb-2">
                Job Description
              </h4>
              <p className="text-gray-700 text-lg leading-relaxed">
                {selectedJob.description}
              </p>
            </div>

            {/* Requirements */}
            <div className="mb-8">
              <h4 className="font-bold text-gray-800 text-lg mb-2">
                Requirements
              </h4>
              <ul className="list-disc list-inside text-gray-700 text-lg space-y-1">
                {selectedJob.requirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-5">
              <button className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold text-lg rounded-lg shadow-md transition">
                Approve Listing
              </button>
              <button
                onClick={() => setSelectedJob(null)}
                className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-lg rounded-lg shadow-md transition"
              >
                Reject Listing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
