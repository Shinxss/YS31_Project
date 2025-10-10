import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import UserLogin from "./pages/Login";
import UserRegis from "./pages/Signup";
import VerifySignup from "./pages/VerifySignup";
import Internships from "./pages/Internships";
import Companies from "./pages/Companies";
import About from "./pages/About";

//------------Student Dashboard Imports------------
import StudentDash from "./pages/studentDashboard/StudentDashboard.jsx";
import StudentProfile from "./pages/studentDashboard/ProfilePage.jsx"; 

//------------Company Dashboard Imports------------
import CompanyDash from "./pages/dashboard/CompanyDashboard.jsx";

//------------Route Protection Imports------------
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public/guest routes */}
        <Route element={<GuestRoute />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<UserLogin />} />
          <Route path="/signup" element={<UserRegis />} />
          <Route path="/verify" element={<VerifySignup />} />
        </Route>

        {/* Public info pages */}
        <Route path="/internships" element={<Internships />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/about" element={<About />} />

        {/* Student Dashboard (protected) */}
        <Route element={<ProtectedRoute allow={["student"]} />}>
          <Route path="/student/*" element={<StudentDash />} />
          <Route path="/student/profile" element={<StudentProfile />} />
        </Route>

        {/* Company Dashboard (protected) */}
        <Route element={<ProtectedRoute allow={["company"]} />}>
          <Route path="/company/*" element={<CompanyDash />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
