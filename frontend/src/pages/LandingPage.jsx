import React from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Stats from "../components/Stats";
import Features from "../components/Features";
import Featured from "../components/FeaturedOpportunities";
import CTASection from "../components/CTASection";
import Footer from "../components/Footer";  

function LandingPage() {
  return (
    <div className="font-sans">
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <Featured />
      <CTASection />
      <Footer />
    </div>
  );
}

export default LandingPage;
