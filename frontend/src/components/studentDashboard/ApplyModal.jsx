import React, { useState, useEffect } from "react";
import { X, Upload } from "lucide-react";
import { toast } from "react-toastify";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function ApplyModal({ jobId, onClose }) {
  const [questions, setQuestions] = useState([]);
  const [answersByIndex, setAnswersByIndex] = useState({});
  const [resume, setResume] = useState(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch screening questions
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/jobs/${jobId}/screening`);
        const data = await res.json();
        if (res.ok) setQuestions(Array.isArray(data.questions) ? data.questions : []);
      } catch (err) {
        console.error("❌ Failed to fetch questions", err);
      }
    })();
  }, [jobId]);

  const handleAnswerChange = (index, value) => {
    setAnswersByIndex((prev) => ({ ...prev, [index]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ok = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ].includes(file.type);
    if (!ok) return toast.error("Please upload a PDF or DOCX file.");
    setResume(file);
  };

  /**
   * Helper: fetch minimal job + company details for notif/email.
   * Tries to be defensive about response shape.
   */
  const fetchJobAndCompany = async () => {
    const res = await fetch(`${API_BASE}/api/jobs/${jobId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load job details");

    // Possible shapes supported:
    const job = data.job || data.data || data;
    const company =
      job.company ||
      data.company ||
      job.postedBy ||
      {};

    const jobTitle =
      job.title ||
      job.jobTitle ||
      job.position ||
      "Untitled Role";

    const companyName =
      company.name ||
      company.companyName ||
      job.companyName ||
      "Unknown Company";

    const companyEmail =
      company.email ||
      company.contactEmail ||
      data.companyEmail ||
      null;

    const companyId =
      company._id ||
      company.id ||
      job.companyId ||
      null;

    return { jobTitle, companyName, companyEmail, companyId };
  };

  /**
   * Helper: fetch current student (applicant) minimal info.
   */
  const fetchApplicant = async (token) => {
    const res = await fetch(`${API_BASE}/api/student/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load profile");
    const applicantName = data.name || data.fullname || data.fullName || "Applicant";
    const applicantEmail = data.email || null;
    const applicantId = data._id || data.id || null;
    return { applicantName, applicantEmail, applicantId };
  };

  /**
   * Create company notification after successful application.
   * Saves: applicant name, applicant email, company email, company name, job title, message, jobId, status
   */
  const createCompanyNotification = async ({
    token,
    applicantName,
    applicantEmail,
    applicantId,
    companyEmail,
    companyName,
    companyId,
    jobTitle,
    jobId,
    message,
  }) => {
    const title = `New applicant — ${applicantName} for ${jobTitle}`;
    const body = `Heads up, ${applicantName} applied for ${jobTitle}`;

    const payload = {
      // Required common fields (based on your earlier validation error)
      title,
      body,
      type: "application",        // e.g., application | status | system
      status: "Applied",          // storing status as requested
      // Targeting
      companyId,                  // optional but ideal if you have it
      recipientEmail: companyEmail, // fallback targeting
      // Rich metadata for your dashboards
      data: {
        jobId,
        jobTitle,
        companyName,
        companyEmail,
        applicantId,
        applicantName,
        applicantEmail,
        message,
        appliedAt: new Date().toISOString(),
      },
    };

    const res = await fetch(`${API_BASE}/api/company/notifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    // It’s okay if your API responds with created notification or simple msg
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create notification");
    return data;
  };

  /**
   * Optional: send email to company with your template.
   * Subject: New applicant — {applicantName} for {jobTitle}
   * Body:    Heads up, {applicantName} applied for {jobTitle}
   * If your backend uses another route, just change the path.
   */
  const sendCompanyEmail = async ({
    token,
    to,
    applicantName,
    jobTitle,
  }) => {
    if (!to) return; // no company email available; silently skip

    const subject = `New applicant — ${applicantName} for ${jobTitle}`;
    const text = `Heads up, ${applicantName} applied for ${jobTitle}`;

    // Adjust this endpoint to your mailer route
    const res = await fetch(`${API_BASE}/api/company/notifications/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ to, subject, text }),
    });

    // Email might be optional; don’t throw on non-2xx if you prefer
    try {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Email send failed");
    } catch (e) {
      // If backend returns no JSON, still ignore
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resume) return toast.error("Please upload your resume first.");

    const token = localStorage.getItem("ic_token");
    if (!token) return toast.error("Please login first.");

    // ✅ Build ARRAY of { question, answer } with the exact question text
    const answersArray = questions.map((q, i) => ({
      question: typeof q === "string" ? q : q?.text || q?.question || `Question ${i + 1}`,
      answer: String(answersByIndex[i] || "").trim(),
    }));

    if (questions.length && answersArray.some((a) => !a.answer)) {
      return toast.error("Please answer all screening questions.");
    }

    const formData = new FormData();
    formData.append("jobId", jobId);
    formData.append("message", message.trim());
    formData.append("resume", resume);
    formData.append("answers", JSON.stringify(answersArray));

    try {
      setSubmitting(true);

      // 1) Submit the application
      const res = await fetch(`${API_BASE}/api/student/apply`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }, // don't set Content-Type for multipart
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Application failed");

      // 2) Gather details for notification & email
      let applicant, jobCompany;
      try {
        [applicant, jobCompany] = await Promise.all([
          fetchApplicant(token),
          fetchJobAndCompany(),
        ]);
      } catch (infoErr) {
        console.warn("ℹ️ Proceeding without full notif context:", infoErr);
      }

      // 3) Create company notification (non-blocking if it fails)
      try {
        await createCompanyNotification({
          token,
          applicantName: applicant?.applicantName || "Applicant",
          applicantEmail: applicant?.applicantEmail || null,
          applicantId: applicant?.applicantId || null,
          companyEmail: jobCompany?.companyEmail || null,
          companyName: jobCompany?.companyName || "Unknown Company",
          companyId: jobCompany?.companyId || null,
          jobTitle: jobCompany?.jobTitle || "Untitled Role",
          jobId,
          message: message.trim(),
        });
      } catch (notifErr) {
        console.error("❌ Notification create failed:", notifErr);
        toast.warn("Application sent, but notifying the company failed.");
      }

      // 4) Send company email (optional; non-blocking)
      try {
        if (jobCompany?.companyEmail) {
          await sendCompanyEmail({
            token,
            to: jobCompany.companyEmail,
            applicantName: applicant?.applicantName || "Applicant",
            jobTitle: jobCompany?.jobTitle || "Untitled Role",
          });
        }
      } catch (mailErr) {
        console.error("📧 Email send failed:", mailErr);
      }

      // 5) UX success
      new Audio("/src/assets/sounds/success.mp3").play().catch(() => {});
      toast.success("✅ Application Sent!", { autoClose: 3000 });
      onClose();
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-white/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative animate-fadeIn">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
          <X size={20} />
        </button>

        <h2 className="text-2xl font-semibold text-blue-900 mb-2">Final Details</h2>
        <p className="text-gray-600 mb-6">
          Complete your internship application by answering these questions and uploading your resume.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Screening Questions */}
          {questions.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">Screening Questions</h3>
              <div className="space-y-4">
                {questions.map((q, i) => {
                  const label = typeof q === "string" ? q : q?.text || q?.question || `Question ${i + 1}`;
                  return (
                    <div key={i}>
                      <label className="font-medium text-gray-700">{label}</label>
                      <textarea
                        rows={3}
                        className="w-full mt-2 border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-300"
                        placeholder="Your answer..."
                        value={answersByIndex[i] || ""}
                        onChange={(e) => handleAnswerChange(i, e.target.value)}
                        required
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Resume Upload */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              Resume <span className="text-red-500">*</span>
            </h3>
            <label
              htmlFor="resume"
              className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition"
            >
              <Upload size={28} className="text-gray-500 mb-2" />
              <span className="text-sm text-gray-600">
                {resume ? resume.name : "PDF or DOCX files"}
              </span>
              <p className="text-xs text-gray-400 mt-1">Accepted formats: PDF, DOCX</p>
              <input id="resume" type="file" accept=".pdf,.docx" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          {/* Message */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Leave a message</h3>
            <textarea
              rows={4}
              className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-300"
              placeholder="Tell us why you’re interested in this position and why you’d be a great fit..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3 text-white font-medium rounded-md transition ${
              submitting ? "bg-gray-400 cursor-not-allowed" : "bg-[#F37526] hover:bg-[#e36210]"
            }`}
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
}
