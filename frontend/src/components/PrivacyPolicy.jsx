// frontend/src/pages/PrivacyPolicy.jsx
import React, { useEffect } from "react";

function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "InternConnect • Privacy Policy";
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
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-600 mt-2">Last Updated: October 2025</p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 pb-12">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 md:p-8 leading-7 text-gray-800">
            <p className="mb-6">
              InternConnect ("we", "our", or "us") respects your privacy and is committed to
              protecting your personal information. This Privacy Policy explains how we collect, use,
              and safeguard the data you provide when using our website and services.
              By using InternConnect, you agree to the practices described in this policy.
            </p>

            <Section title="1. Information We Collect">
              <p className="mb-3">We collect the following types of information to provide and improve our services:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <span className="font-medium">Information You Provide</span>
                  <ul className="list-[circle] pl-6 mt-1 space-y-1">
                    <li>
                      <span className="font-medium">Students:</span> name, email address, school, year level, course,
                      skills, and uploaded resumes.
                    </li>
                    <li>
                      <span className="font-medium">Employers:</span> company name, contact person, email address,
                      job/internship listings, and related details.
                    </li>
                    <li>Any information voluntarily submitted through forms, messages, or profile updates.</li>
                  </ul>
                </li>
              </ul>
            </Section>

            <Section title="2. How We Use Your Information">
              <ul className="list-disc pl-6 space-y-1">
                <li>Create and manage user accounts (student or employer).</li>
                <li>Connect students with potential employers.</li>
                <li>Process applications and manage job postings.</li>
                <li>Communicate with users regarding updates or opportunities.</li>
                <li>Maintain platform security and prevent fraud.</li>
                <li>Improve website features and user experience.</li>
              </ul>
            </Section>

            <Section title="3. Data Sharing and Disclosure">
              <p className="mb-2">
                InternConnect does not sell or rent your personal data. We may share limited information only under these
                circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  With employers or students: to facilitate job applications and communication between users.
                </li>
                <li>
                  With service providers: for hosting, analytics, or system maintenance (bound by confidentiality agreements).
                </li>
                <li>When required by law: to comply with legal obligations or respond to lawful requests.</li>
              </ul>
            </Section>

            <Section title="4. Data Security">
              <p>
                We implement appropriate security measures, including encryption, authentication, and restricted access,
                to protect your data against unauthorized access, alteration, or loss. However, no online platform is
                completely secure. Users are encouraged to protect their own accounts and report suspicious activity.
              </p>
            </Section>

            <Section title="5. Data Retention">
              <p>
                We retain user data only as long as necessary to fulfill the purposes described in this policy, or as
                required by law. Users may request deletion of their accounts and data at any time.
              </p>
            </Section>

            <Section title="6. Your Rights">
              <ul className="list-disc pl-6 space-y-1">
                <li>Access, update, or correct your personal information.</li>
                <li>Request deletion of your account and related data.</li>
                <li>Withdraw consent for data collection (which may limit platform functionality).</li>
              </ul>
              <p className="mt-2">
                To exercise your rights, contact us at{" "}
                <a
                  href="mailto:intern.connect.0001@gmail.com"
                  className="text-blue-700 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  intern.connect.0001@gmail.com
                </a>.
              </p>
            </Section>

            <Section title="7. Third-Party Links">
              <p>
                InternConnect may include links to third-party websites. We are not responsible for the privacy practices
                or content of those external sites. Please review their privacy policies before providing any personal
                information.
              </p>
            </Section>

            <Section title="8. Children’s Privacy">
              <p>
                InternConnect is not intended for users under 18 years old without parental or guardian consent. We do not
                knowingly collect personal data from minors. If we become aware of such data, it will be deleted promptly.
              </p>
            </Section>

            <Section title="9. Updates to This Privacy Policy">
              <p>
                We may update this Privacy Policy from time to time. Any changes will be posted on this page with an
                updated "Last Updated" date. Continued use of the platform indicates your acceptance of the revised policy.
              </p>
            </Section>

            <Section title="10. Contact Us">
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
            </Section>

            <p className="mt-8">
              By using InternConnect, you acknowledge that you have read, understood, and agreed to this Privacy Policy.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold text-blue-900 mb-2">{title}</h2>
      <div className="text-gray-700">{children}</div>
    </section>
  );
}

export default PrivacyPolicy;
