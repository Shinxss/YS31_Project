import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/* ---------- Public Pages ---------- */
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

/* ---------- Student ---------- */
import StudentDash from "./pages/studentDashboard/StudentDashboard.jsx";
import StudentProfile from "./pages/studentDashboard/ProfilePage.jsx";
import StudentSettings from "./pages/studentDashboard/StudentSettings.jsx";

/* ---------- Company ---------- */
import CompanyDash from "./pages/dashboard/CompanyDashboard.jsx";
import CompanySettings from "./pages/dashboard/CompanySettings.jsx";
import CompanyStudentProfile from "./pages/dashboard/CompanyStudentProfile.jsx";



/* ---------- Admin ---------- */
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard";
import DashboardHome from "./pages/admin/DashboardHome.jsx";
import UserManagement from "./pages/admin/UserManagement.jsx";
import Notification from "./pages/admin/Notification.jsx";
import CompanyApplications from "./pages/admin/CompanyApplications.jsx";
import JobListingReview from "./pages/admin/JobListingReview.jsx";
import DataExport from "./pages/admin/DataExport.jsx";


/* ---------- Route Guards ---------- */
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import ProtectedAdminRoute from "./components/adminProtectedRoutes";
import { isLoggedIn as isAdminLoggedIn } from "./utils/adminAuth";


export default function App() {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        // ...your toast props...
      />

      <Routes>
        {/* ---------- GUEST ROUTES ---------- */}
        <Route element={<GuestRoute />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<UserLogin />} />
          <Route path="/signup" element={<UserRegis />} />
          <Route path="/verify" element={<VerifySignup />} />
        </Route>

        {/* ---------- PUBLIC ROUTES ---------- */}
        <Route path="/internships" element={<Internships />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/about" element={<About />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />

        {/* ---------- STUDENT ROUTES ---------- */}
        <Route element={<ProtectedRoute allow={["student"]} />}>
          <Route path="/student/*" element={<StudentDash />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route path="/student/settings/*" element={<StudentSettings />} />
          <Route path="/student/jobs/:jobId" element={<JobDetails />} />
        </Route>

        {/* ---------- COMPANY ROUTES ---------- */}
        <Route element={<ProtectedRoute allow={["company"]} />}>
          <Route path="/company/*" element={<CompanyDash />} />
          <Route path="/company/settings/*" element={<CompanySettings />} />
          <Route path="/company/students/:id" element={<CompanyStudentProfile />} />
        </Route>

        {/* ---------- ADMIN ROUTES ---------- */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Auto-redirect if /admin is accessed directly */}
        <Route
          path="/admin"
          element={
            isAdminLoggedIn()
              ? <Navigate to="/admin/dashboard" replace />
              : <Navigate to="/admin/login" replace />
          }
        />

        <Route
          path="/admin/dashboard/*"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="notifications" element={<Notification />} />
          <Route path="company-applications" element={<CompanyApplications />} />
          <Route path="job-listings" element={<JobListingReview />} />
          <Route path="data-export" element={<DataExport />} />
        </Route>
        
        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
