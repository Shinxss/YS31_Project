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

    // (optional) require all answers if there are questions
    if (questions.length && answersArray.some(a => !a.answer)) {
      return toast.error("Please answer all screening questions.");
    }

    const formData = new FormData();
    formData.append("jobId", jobId);
    formData.append("message", message.trim());
    formData.append("resume", resume);
    formData.append("answers", JSON.stringify(answersArray)); // ← send array with question text

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/api/student/apply`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }, // don't set Content-Type for multipart
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Application failed");

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
