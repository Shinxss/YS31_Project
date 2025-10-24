// src/pages/UserManagement.jsx
import React, { useState } from "react";

export default function UserManagement() {
  const [selectedTab, setSelectedTab] = useState("students");
  const [searchQuery, setSearchQuery] = useState("");

  const tabs = ["students", "companies", "admins"];

  const baseData = {
    students: [
      { id: 1, name: "John Doe", school: "MIT", email: "john@mit.edu", status: "Active" },
      { id: 2, name: "Jane Smith", school: "Stanford", email: "jane@stanford.edu", status: "Active" },
      { id: 3, name: "Mike Johnson", school: "Harvard", email: "mike@harvard.edu", status: "Disabled" },
      { id: 4, name: "Sarah Williams", school: "Yale", email: "sarah@yale.edu", status: "Active" },
      { id: 5, name: "Tom Brown", school: "Princeton", email: "tom@princeton.edu", status: "Active" },
    ],
    companies: [
      { id: 1, name: "TechCorp", company: "TechCorp", email: "info@techcorp.com", status: "Active" },
      { id: 2, name: "InnoSoft", company: "InnoSoft", email: "contact@innosoft.com", status: "Disabled" },
    ],
    admins: [
      { id: 1, name: "Admin One", email: "admin1@internconnect.com", status: "Active" },
      { id: 2, name: "Admin Two", email: "admin2@internconnect.com", status: "Disabled" },
    ],
  };

  const [users, setUsers] = useState(baseData.students);

  const handleTabClick = (tab) => {
    setSelectedTab(tab);
    setSearchQuery("");
    setUsers(baseData[tab]);
  };

  const toggleStatus = (id) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: u.status === "Active" ? "Disabled" : "Active" } : u
      )
    );
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      String(u.name).toLowerCase().includes(q) ||
      String(u.email).toLowerCase().includes(q) ||
      String(u.school || u.company || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="ml-72 mt-24 px-8">
      {/* Title Section */}
      <div className="mb-10">
        <h1 className="text-5xl font-extrabold text-[#16357f] tracking-tight mb-2">
          User Management
        </h1>
        <p className="text-xl text-gray-600 font-medium">
          Manage students, companies, and admin accounts effortlessly.
        </p>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200">
        <div className="p-8">
          {/* Tabs and Search inside card */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            {/* Tabs */}
            <div className="grid grid-cols-3 text-center mb-6 w-full max-w-full">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabClick(tab)}
                  className={`py-3 text-lg font-semibold capitalize rounded-full mx-1 transition-all duration-200 ${
                    selectedTab === tab
                      ? "bg-[#16357f] text-white shadow-sm"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {tab === "students" ? "Students" : tab === "companies" ? "Companies" : "Admins"}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex items-center">
              <div className="flex-1 max-w-2xl mx-auto">
                <input
                  type="text"
                  placeholder={
                    selectedTab === "students"
                      ? "Search students..."
                      : selectedTab === "companies"
                      ? "Search companies..."
                      : "Search admins..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-5 py-3 text-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#16357f]"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse">
              <thead>
                <tr className="text-gray-800 border-b border-gray-300 text-lg">
                  <th className="py-5 px-6 font-extrabold">Name</th>
                  <th className="py-5 px-6 font-extrabold">School</th>
                  <th className="py-5 px-6 font-extrabold">Email</th>
                  <th className="py-5 px-6 font-extrabold">Status</th>
                  <th className="py-5 px-6 font-extrabold">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 px-6 text-center text-gray-500 text-lg">
                      No records found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u, idx) => (
                    <tr
                      key={u.id || idx}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors text-lg"
                    >
                      <td className="py-5 px-6 text-gray-800 font-medium">{u.name}</td>
                      <td className="py-5 px-6 text-gray-700">{u.school || u.company || "-"}</td>
                      <td className="py-5 px-6 text-gray-700">{u.email}</td>
                      <td className="py-5 px-6">
                        <span
                          className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${
                            u.status === "Active"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <button
                          onClick={() => toggleStatus(u.id)}
                          className="px-5 py-2 rounded-lg text-base font-semibold border border-gray-300 text-gray-800 hover:bg-gray-100 transition-all"
                        >
                          {u.status === "Active" ? "Disable" : "Enable"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
