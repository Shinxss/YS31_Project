// frontend/src/pages/TermsOfService.jsx
import React, { useEffect } from "react";

export default function TermsOfService() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "InternConnect • Terms of Service";
  }, []);

  return (
    <div className="min-h-screen bg-[#ECF3FC] flex flex-col">
      {/* Header */}
      <header className="py-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="inline-flex items-center text-xs font-medium text-blue-700/80 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 mb-4">
            Legal
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-blue-900">
            Terms of Service
          </h1>
          <p className="text-sm text-gray-600 mt-2">Last Updated: October 2025</p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 pb-12">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 md:p-8 leading-7 text-gray-800">
            <p className="mb-6">
              Welcome to InternConnect, a web-based platform designed to connect
              students with employers offering internships, part-time jobs, and
              training opportunities. By accessing or using InternConnect, you
              agree to comply with and be bound by these Terms of Service.
              Please read them carefully before using the website.
            </p>

            <ol className="list-decimal pl-6 space-y-6">
              <li>
                <h2 className="text-lg font-semibold text-blue-900 mb-1">
                  Acceptance of Terms
                </h2>
                <p>
                  By creating an account or using any feature of InternConnect, you
                  acknowledge that you have read, understood, and agree to these
                  Terms of Service and our Privacy Policy. If you do not agree,
                  please discontinue use of the platform.
                </p>
              </li>

              <li>
                <h2 className="text-lg font-semibold text-blue-900 mb-1">
                  Eligibility
                </h2>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    Students seeking internships, part-time jobs, or training
                    opportunities.
                  </li>
                  <li>
                    Companies, organizations, and institutions offering such
                    opportunities.
                  </li>
                </ul>
                <p className="mt-2">
                  You must be at least 18 years old or have consent from a parent
                  or guardian to use this platform.
                </p>
              </li>

              <li>
                <h2 className="text-lg font-semibold text-blue-900 mb-1">
                  User Accounts
                </h2>
                <p className="mb-2">
                  You are responsible for maintaining the confidentiality of your
                  login credentials. You agree to:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Provide accurate and truthful information during registration.</li>
                  <li>Immediately notify InternConnect of any unauthorized use of your account.</li>
                  <li>Not share your account with others.</li>
                </ul>
                <p className="mt-2">
                  InternConnect reserves the right to suspend or terminate accounts
                  that violate these terms or contain false information.
                </p>
              </li>

              <li>
                <h2 className="text-lg font-semibold text-blue-900 mb-1">
                  Use of the Platform
                </h2>
                <p className="mb-2">
                  You agree to use InternConnect only for lawful purposes and in a
                  way that does not infringe on the rights of others. Specifically,
                  you agree not to:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Post false, misleading, or discriminatory job listings.</li>
                  <li>Upload or distribute malicious software or content.</li>
                  <li>Collect or misuse other users’ data.</li>
                  <li>Use the site to spam, harass, or defraud users.</li>
                </ul>
              </li>

              <li>
                <h2 className="text-lg font-semibold text-blue-900 mb-1">
                  Content Ownership
                </h2>
                <p className="mb-2">
                  You retain ownership of any content you submit, such as resumes,
                  company information, or job postings. By uploading content, you
                  grant InternConnect a non-exclusive, worldwide, royalty-free
                  license to display, use, and distribute your content for the
                  purpose of operating the platform.
                </p>
                <p>
                  InternConnect does not claim ownership of student or employer
                  data and will only use it in accordance with the Privacy Policy.
                </p>
              </li>

              <li>
                <h2 className="text-lg font-semibold text-blue-900 mb-1">
                  Job Listings and Applications
                </h2>
                <p className="mb-2">
                  InternConnect serves as a bridge between students and employers
                  but does not guarantee employment, internship offers, or the
                  accuracy of posted listings. Employers are solely responsible for
                  the content and legitimacy of their postings.
                </p>
                <p>Students are encouraged to verify authenticity before applying.</p>
              </li>

              <li>
                <h2 className="text-lg font-semibold text-blue-900 mb-1">
                  Prohibited Activities
                </h2>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Impersonate another person or entity.</li>
                  <li>Misrepresent your qualifications or company information.</li>
                  <li>Attempt to breach, disable, or overload the website’s systems.</li>
                  <li>Use automated tools to scrape or collect data from InternConnect.</li>
                </ul>
              </li>

              <li>
                <h2 className="text-lg font-semibold text-blue-900 mb-1">
                  Intellectual Property
                </h2>
                <p>
                  All design elements, code, and branding of InternConnect are
                  owned by the development team. You may not copy, distribute, or
                  modify any part of the website without prior written consent.
                </p>
              </li>

              <li>
                <h2 className="text-lg font-semibold text-blue-900 mb-1">
                  Termination
                </h2>
                <p>
                  InternConnect reserves the right to suspend or delete user
                  accounts that violate these Terms of Service, engage in harmful
                  behavior, or misuse the platform in any way.
                </p>
              </li>

              <li>
                <h2 className="text-lg font-semibold text-blue-900 mb-1">
                  Disclaimer of Warranties
                </h2>
                <p>
                  InternConnect is provided “as is” without any warranties, express
                  or implied. We do not guarantee uninterrupted access, error-free
                  operation, or the accuracy of content provided by users or third
                  parties.
                </p>
              </li>

              <li>
                <h2 className="text-lg font-semibold text-blue-900 mb-1">
                  Limitation of Liability
                </h2>
                <p>
                  InternConnect and its developers shall not be liable for any
                  indirect, incidental, or consequential damages resulting from the
                  use or inability to use the platform, including but not limited
                  to data loss, employment issues, or unauthorized access.
                </p>
              </li>

              <li>
                <h2 className="text-lg font-semibold text-blue-900 mb-1">
                  Modifications to the Terms
                </h2>
                <p>
                  InternConnect may revise these Terms of Service at any time.
                  Continued use of the platform after changes are posted constitutes
                  acceptance of the revised terms.
                </p>
              </li>

              <li>
                <h2 className="text-lg font-semibold text-blue-900 mb-1">
                  Contact Information
                </h2>
                <address className="not-italic">
                  InternConnect Team
                  <br />
                  University of Pangasinan – College of Information Technology Education
                  <br />
                  Email:{" "}
                  <a
                    href="mailto:intern.connect.0001@gmail.com"
                    className="text-blue-700 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    intern.connect.0001@gmail.com
                  </a>
                </address>
              </li>
            </ol>

            <p className="mt-8">
              By using InternConnect, you acknowledge that you have read,
              understood, and agreed to these Terms of Service.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
