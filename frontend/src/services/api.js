// src/services/api.js

// ---------- BASE URL ----------
const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE ||
  "http://localhost:5000";

// ---------- TOKEN HELPERS ----------
function getAnyToken() {
  return (
    localStorage.getItem("ic_token") ||
    localStorage.getItem("companyToken") ||
    localStorage.getItem("studentToken") ||
    localStorage.getItem("orgToken") ||
    localStorage.getItem("token") ||
    ""
  );
}

// ---------- LOW-LEVEL FETCH HELPERS ----------
async function baseGet(path, needsAuth = false) {
  const token = getAnyToken();
  const headers = { "Content-Type": "application/json" };
  if (needsAuth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { headers });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      msg = (await res.json())?.message || msg;
    } catch {
      try {
        msg = (await res.text()) || msg;
      } catch {}
    }
    throw new Error(msg);
  }
  return res.json();
}

async function baseSend(method, path, body, needsAuth = false) {
  const token = getAnyToken();
  const headers = { "Content-Type": "application/json" };
  if (needsAuth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      msg = (await res.json())?.message || msg;
    } catch {
      try {
        msg = (await res.text()) || msg;
      } catch {}
    }
    throw new Error(msg);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

// Kept from your old file, but safer (uses any token if present)
async function authGet(path) {
  const token = getAnyToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { headers });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Request failed");
  }
  return res.json();
}

async function authPost(path, payload) {
  return baseSend("POST", path, payload, true);
}
async function authPut(path, payload) {
  return baseSend("PUT", path, payload, true);
}

// =======================================================
// =================== AUTHENTICATED =====================
// =======================================================

// ✅ STUDENT
export async function getStudentProfile() {
  return authGet("/api/student/me");
}

// ✅ COMPANY (header/me)
export async function getCompanyStats() {
  return authGet("/api/company/me");
}

// ✅ COMPANY DETAILS
export async function saveCompanyDetails(payload) {
  return authPost("/api/company/details/save", payload);
}

export async function validateCompanyName(companyName) {
  return baseGet(
    `/api/company/validate-name?companyName=${encodeURIComponent(companyName)}`
  );
}

// =======================================================
// ======================== JOBS =========================
// =======================================================

// Company: create job
export async function createJob(payload) {
  return authPost("/api/jobs", payload);
}

// Company: my jobs
export async function getMyJobs() {
  return authGet("/api/jobs/mine");
}

// Public: all open jobs (kept your original style)
export async function getAllJobs() {
  const token = getAnyToken();
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

// Public: job by id
export async function getJobById(jobId) {
  return baseGet(`/api/jobs/${jobId}`);
}

// Public: screening questions
export async function getJobScreeningQuestions(jobId) {
  return baseGet(`/api/jobs/${jobId}/screening-questions`);
}

// =======================================================
// ==================== ORGANIZATION =====================
// =======================================================
export async function getOrgVolunteers() {
  return authGet("/api/org/volunteers");
}
export async function updateOrgVolunteerStatus(id, opportunityId, status) {
  return authPut(`/api/org/volunteers/${id}/status`, { opportunityId, status });
}

// =======================================================
// ======================= UTILS =========================
// =======================================================
export async function pingApi() {
  return baseGet("/health");
}
export async function http(path, options = {}) {
  const token = getAnyToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token && !headers.Authorization) headers.Authorization = `Bearer ${token}`;
  const url = `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      msg = data?.message || msg;
    } catch {
      try {
        msg = (await res.text()) || msg;
      } catch {}
    }
    throw new Error(msg);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}
