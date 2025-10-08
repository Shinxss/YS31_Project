// Base URL for backend API
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Helper for authenticated GET requests
async function authGet(path) {
  const token = localStorage.getItem("ic_token");
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Request failed");
  }

  return res.json();
}

// ======================= AUTHENTICATED FETCHES =======================

// Fetch student profile
export async function getStudentProfile() {
  return authGet("/api/student/me");
}

// Fetch company profile/stats
export async function getCompanyStats() {
  return authGet("/api/company/me");
}

// ======================= PUBLIC JOBS =======================

// Fetch all open jobs (for students)
export async function getAllJobs() {
  const token = localStorage.getItem("ic_token");
  const res = await fetch(`${API_BASE}/api/jobs`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Failed to load jobs");
  }

  return res.json();
}

