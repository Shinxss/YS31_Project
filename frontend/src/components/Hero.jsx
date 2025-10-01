import React from "react";
import { Search, Users, Building2 } from "lucide-react";

export default function Hero() {
  return (
    <section className="bg-blue-50 py-16">
      <div className="max-w-4xl mx-auto text-center px-6">
        <h2 className="text-4xl md:text-6xl font-bold">
          Connect Your Future with <br />
          <span className="bg-gradient-to-r from-blue-900 to-orange-500 bg-clip-text text-transparent">
            the Perfect Internship
          </span>
        </h2>
        <p className="mt-6 text-gray-600">
          Join thousands of students finding meaningful internships and companies
          discovering top talent. Your career journey starts here.
        </p>

        {/* Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <button className="btn-primary-2 flex items-center gap-2">
            <Users size={18} /> Find Internships
          </button>
          <button className="btn-outline-2 flex items-center gap-2">
            <Building2 size={18} /> Post Opportunities
          </button>
        </div>

        {/* Search Box */}
        <div className="bg-white shadow-md rounded-xl mt-10 flex flex-col md:flex-row items-center p-4 gap-4 max-w-3xl mx-auto">
          <Search size={18} className="text-gray-500 items-center absolute ml-3 mr-" />
          <input
            type="text"
            placeholder="Search Internships, companies, or skills..."
            className="input-field pl-10 "
          />
          <input type="text" placeholder="Location" className="input-field" />
          <button className="btn-primary">Search</button>
        </div>
      </div>
    </section>
  );
}
