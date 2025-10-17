import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ---------- Public Pages ----------
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

// ---------- Student Dashboard ----------
import StudentDash from "./pages/studentDashboard/StudentDashboard.jsx";
import StudentProfile from "./pages/studentDashboard/ProfilePage.jsx";
import StudentSettings from "./pages/studentDashboard/StudentSettings.jsx";

// ---------- Company Dashboard ----------
import CompanyDash from "./pages/dashboard/CompanyDashboard.jsx";
import CompanySettings from "./pages/dashboard/CompanySettings.jsx";

// ---------- Route Guards ----------
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";

function App() {
  return (
    <Router>
      <>
        {/* ✅ Global Toast Container */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          closeOnClick
          pauseOnHover
          draggable
          newestOnTop={false}
          toastStyle={{
            backgroundColor: "#007BFF", // Blue background
            color: "#fff",
            fontWeight: 600,
            borderRadius: "10px",
            borderLeft: "6px solid #F37526", // Orange accent
            boxShadow: "0 4px 14px rgba(0,123,255,0.25)",
          }}
          progressStyle={{
            background: "#F37526", // Orange progress bar
          }}
        />

        <Routes>
          {/* ---------- GUEST ROUTES ---------- */}
          <Route element={<GuestRoute />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<UserLogin />} />
            <Route path="/signup" element={<UserRegis />} />
            <Route path="/verify" element={<VerifySignup />} />
          </Route>

          {/* ---------- PUBLIC PAGES ---------- */}
          <Route path="/internships" element={<Internships />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/about" element={<About />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />

          {/* ---------- STUDENT DASHBOARD (Protected) ---------- */}
          <Route element={<ProtectedRoute allow={["student"]} />}>
            <Route path="/student/*" element={<StudentDash />}>
              <Route path="profile" element={<StudentProfile />} />
              <Route path="settings/*" element={<StudentSettings />} />
              <Route path="jobs/:jobId" element={<JobDetails />} />
            </Route>
          </Route>

          {/* ---------- COMPANY DASHBOARD (Protected) ---------- */}
          <Route element={<ProtectedRoute allow={["company"]} />}>
            <Route path="/company/*" element={<CompanyDash />} />
            <Route path="/company/settings/*" element={<CompanySettings />} />
          </Route>

          {/* ---------- FALLBACK ---------- */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </>
    </Router>
  );
}

export default App;
