import React from "react";
import Header from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import {
  Briefcase,
  Search,
  Users,
  Target,
  TrendingUp,
  Clock,
  GraduationCap,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";

export default function Companies() {
  return (
    <div className="min-h-screen bg-[#F2F5FB] flex flex-col">
      <Header />

      <main className="flex-1">
        {/* HERO */}
        <section className="bg-gradient-to-b from-[#ECF3FC] to-[#E7EEF9]">
          <div className="max-w-6xl mx-auto px-6 pt-16 pb-12 text-center">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight text-[#0F1E54]">
              Hire the Best{" "}
              <span className="bg-gradient-to-r from-[#2742C9] via-[#7A6ABF] to-[#F37526] bg-clip-text text-transparent">
                Student Talent
              </span>
            </h1>

            <p className="mt-4 text-lg md:text-xl text-[#55627A] max-w-3xl mx-auto">
              Connect with motivated students and recent graduates ready to
              contribute to your company’s success. Post internships, find
              co-ops, and build your future workforce.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#2742C9] px-6 py-3 text-white font-semibold hover:bg-[#203ab1] transition w-100 h-15"
              >
                <Briefcase className="w-5 h-5" />
                Post Your First Job
              </Link>
            </div>
          </div>
        </section>

        {/* WHY CHOOSE */}
        <section className="bg-[#EAF1FB]">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-center text-[#0F1E54]">
              Why Choose InternConnect?
            </h2>
            <p className="text-center text-[#55627A] mt-3 max-w-3xl mx-auto">
              Join thousands of companies that trust us to connect them with
              exceptional student talent.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <WhyCard
                icon={<Users className="w-7 h-7 text-[#1F37A8]" />}
                title="Access Top Talent"
                text="Connect with pre-screened students from leading universities across the country."
              />
              <WhyCard
                icon={<Target className="w-7 h-7 text-[#1F37A8]" />}
                title="Targeted Hiring"
                text="Find candidates with specific skills and academic backgrounds that match your needs."
              />
              <WhyCard
                icon={<TrendingUp className="w-7 h-7 text-[#1F37A8]" />}
                title="Build Your Pipeline"
                text="Develop relationships with future employees through our internship programs."
              />
              <WhyCard
                icon={<Clock className="w-7 h-7 text-[#1F37A8]" />}
                title="Quick Turnaround"
                text="Post jobs and start receiving applications within hours of publishing."
              />
            </div>
          </div>
        </section>

        {/* POWERFUL TOOLS */}
        <section className="bg-[#EEF3FA]">
          <div className="max-w-6xl mx-auto px-6 py-14">
            <h3 className="text-3xl md:text-4xl font-extrabold text-[#0F1E54]">
              Powerful Tools for Modern Hiring
            </h3>
            <p className="text-[#55627A] mt-3 max-w-3xl">
              Our platform provides everything you need to streamline your intern
              hiring process and find the perfect candidates for your team.
            </p>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* left: checklist */}
              <ul className="space-y-4 text-[#0F1E54]">
                {[
                  "Advanced candidate filtering and search",
                  "Direct messaging with applicants",
                  "Application tracking and management",
                  "Company profile and branding tools",
                  "Analytics and hiring insights",
                  "Dedicated account manager support",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 text-[#2742C9]" />
                    <span className="text-lg">{item}</span>
                  </li>
                ))}
              </ul>

              {/* right: candidate sample card */}
              <div className="bg-white rounded-2xl shadow-sm border border-[#E1E7F5] p-6 lg:p-7">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#EEF2FF] flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-[#2742C9]" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-[#0F1E54]">
                      Sarah Chen
                    </div>
                    <div className="text-sm text-[#6B7690]">
                      Computer Science, Stanford University
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {["React", "Python", "Machine Learning"].map((t) => (
                        <span
                          key={t}
                          className="text-xs font-medium px-3 py-1 rounded-full bg-[#FFF1E8] text-[#E86A13]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <p className="mt-3 text-[#4B5568] italic">
                      “Looking for a summer internship where I can apply my
                      technical skills and contribute to meaningful
                      projects…”
                    </p>

                    <div className="mt-4 flex gap-3">
                      <button className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-[#2742C9] text-white text-sm font-semibold hover:bg-[#203ab1] transition">
                        View Profile
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {/* end card */}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

/* --------- small presentational card --------- */
function WhyCard({ icon, title, text }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E1E7F5] p-6 text-center">
      <div className="mx-auto w-12 h-12 rounded-xl bg-[#EEF2FF] flex items-center justify-center">
        {icon}
      </div>
      <h4 className="mt-4 text-lg font-semibold text-[#0F1E54]">{title}</h4>
      <p className="mt-2 text-sm text-[#6B7690] leading-relaxed">{text}</p>
    </div>
  );
}
