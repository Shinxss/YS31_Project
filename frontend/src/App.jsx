// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/* Pages - keep your existing imports */
import LandingPage from "./pages/LandingPage";
import UserLogin from "./pages/Login";
import UserRegis from "./pages/Signup";
import VerifySignup from "./pages/VerifySignup";
import Internships from "./pages/Internships";
import Companies from "./pages/Companies";
import About from "./pages/About";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import JobDetails from "./pages/studentDashboard/JobDetails.jsx";

/* Student */
import StudentDash from "./pages/studentDashboard/StudentDashboard.jsx";
import StudentProfile from "./pages/studentDashboard/ProfilePage.jsx";
import StudentSettings from "./pages/studentDashboard/StudentSettings.jsx";

/* Company */
import CompanyDash from "./pages/dashboard/CompanyDashboard.jsx";
import CompanySettings from "./pages/dashboard/CompanySettings.jsx";
import CompanyStudentProfile from "./pages/dashboard/CompanyStudentProfile.jsx";

/* Route guards */
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";

/* Admin */
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard";
import RequireAdmin from "./components/RequireAdmin";

export default function App() {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        // ...your toast props...
      />

      <Routes>
        {/* Guest-only */}
        <Route element={<GuestRoute />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<UserLogin />} />
          <Route path="/signup" element={<UserRegis />} />
          <Route path="/verify" element={<VerifySignup />} />
        </Route>

        {/* Public info */}
        <Route path="/internships" element={<Internships />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/about" element={<About />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />

        {/* Student */}
        <Route element={<ProtectedRoute allow={["student"]} />}>
          <Route path="/student/*" element={<StudentDash />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route path="/student/settings/*" element={<StudentSettings />} />
          <Route path="/student/jobs/:jobId" element={<JobDetails />} />
        </Route>

        {/* Company */}
        <Route element={<ProtectedRoute allow={["company"]} />}>
          <Route path="/company/*" element={<CompanyDash />} />
          <Route path="/company/settings/*" element={<CompanySettings />} />
          <Route path="/company/students/:id" element={<CompanyStudentProfile />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard/*"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
