import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import UserLogin from "./pages/Login";
import UserRegis from './pages/Signup';
import Internships from "./pages/Internships";
import Companies from "./pages/Companies";
import About from "./pages/About";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/Login" element={<UserLogin />} />
        <Route path="/Signup" element={<UserRegis />} />
        <Route path="/internships" element={<Internships />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Router>
  );
}

export default App;
