import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import UserLogin from "./pages/Login";
import UserRegis from "./pages/Signup";
import VerifySignup from "./pages/VerifySignup";
import Internships from "./pages/Internships";
import Companies from "./pages/Companies";
import About from "./pages/About";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";

//------------Student Dashboard Imports------------
import StudentDash from "./pages/studentDashboard/StudentDashboard.jsx";
import StudentProfile from "./pages/studentDashboard/ProfilePage.jsx"; 

import StudentSettings from "./pages/studentDashboard/StudentSettings.jsx";

//------------Company Dashboard Imports------------
import CompanyDash from "./pages/dashboard/CompanyDashboard.jsx";
import CompanySettings from "./pages/dashboard/CompanySettings.jsx"; 

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

       
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />

        {/* Student Dashboard (protected) */}
        <Route element={<ProtectedRoute allow={["student"]} />}>
          <Route path="/student/*" element={<StudentDash />} />
          <Route path="/student/profile" element={<StudentProfile />} />
  
          <Route path="/student/settings/*" element={<StudentSettings />} />
        </Route>

        
        <Route element={<ProtectedRoute allow={["company"]} />}>
          <Route path="/company/*" element={<CompanyDash />} />
         
          <Route path="/company/settings/*" element={<CompanySettings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
