import React from "react";
import { Link } from "react-router-dom";
import "../styles/LandingPage.css";

const LandingPage = () => {
  return (
    <div>
      <header className="site-header">
        <h1 className="logo">InternConnect</h1>

        <nav className="nav-links">
          <Link to="/internships">Find Internships</Link>
          <Link to="/companies">For Companies</Link>
          <Link to="/about">About Us</Link>
        </nav>

        <nav className="nav-buttons">
          
        </nav>
      </header>
    </div>
  );
};

export default LandingPage;
