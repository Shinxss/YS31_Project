import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import CompanyApplications from "./pages/CompanyApplications";
import JobListingReview from "./pages/JobListingReview";
import DataExport from "./pages/DataExport";


export default function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Sidebar />
        <Topbar />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/usermanagement" element={<UserManagement />} />

          {/* ✅ Keep only this real component route */}
          <Route path="/companyapplications" element={<CompanyApplications />} />

          {/* Keep placeholders for other sections */}
          <Route path="/joblisting" element={<JobListingReview />} />
          <Route path="/dataexport" element={<DataExport />} />
          <Route path="/settings" element={<div className="ml-72 pt-28 p-8">Settings (placeholder)</div>} />
        </Routes>
      </div>
    </Router>
  );
}
