// src/components/studentDashboard/AddReminderModal.jsx
import React from "react";
import { X } from "lucide-react";

export default function AddReminderModal({
  showModal,
  setShowModal,
  newEvent,
  setNewEvent,
  handleSaveEvent, // parent/StudentDashboardHome will turn this into { op: "create", event }
}) {
  if (!showModal) return null;

  const onSubmit = (e) => {
    e.preventDefault();
    // delegate saving to parent (it will package { op: "create", event: newEvent })
    handleSaveEvent?.();
  };

  return (
    <div className="fixed inset-0 bg-[#ecf3fc]/70 backdrop-blur-lg flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6 relative">
        <button
          type="button"
          onClick={() => setShowModal(false)}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Add New Reminder
        </h2>

        {/* Use a form so Enter submits, and we can preventDefault in one place */}
        <form className="space-y-3" onSubmit={onSubmit}>
          {/* Title */}
          <input
            type="text"
            placeholder="Title"
            value={newEvent.title}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm"
            required
          />

          {/* Description */}
          <textarea
            placeholder="Description"
            value={newEvent.description}
            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />

          {/* Date and Time */}
          <div className="flex gap-3">
            <input
              type="date"
              value={newEvent.date}
              onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              className="border rounded-md px-3 py-2 text-sm w-1/2"
              required
            />
            <input
              type="time"
              value={newEvent.time}
              onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
              className="border rounded-md px-3 py-2 text-sm w-1/2"
              required
            />
          </div>

          {/* Type Dropdown */}
          <select
            value={newEvent.type}
            onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm"
            required
          >
            <option value="">Select Reminder Type</option>
            <option value="Work">Work</option>
            <option value="Interview">Interview</option>
            <option value="Meeting">Meeting</option>
            <option value="Task">Task</option>
            <option value="Other">Other</option>
          </select>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md text-sm"
            >
              Save Reminder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Optional direct-call helper (if you need to save from other pages)
   Uses your controllers:
   - POST /api/students/reminders  (auth via Bearer or cookie)
-------------------------------------------------------------------*/
export async function saveReminderToStudentUsers({
  newEvent,
  apiBase =
    (typeof window !== "undefined" && (import.meta?.env?.VITE_API_BASE || "")) ||
    (typeof window !== "undefined" ? window.location.origin : ""),
  getAuthHeaders,
}) {
  if (!newEvent) throw new Error("newEvent is required");

  const toISO = (d, t) => {
    if (!d) return null;
    const dt = new Date(`${d}T${t || "00:00"}`);
    return isNaN(dt.getTime()) ? null : dt.toISOString();
  };

  const bodyFlat = {
    title: (newEvent?.title || "").trim(),
    description: (newEvent?.description || "").trim(),
    date: newEvent?.date || "",
    time: newEvent?.time || "00:00",
    type: newEvent?.type || "Other",
    datetime: toISO(newEvent?.date, newEvent?.time),
    status: "pending",
  };

  const payload = {
    reminder: { ...bodyFlat }, // your controller accepts nested or flat
    ...bodyFlat,
  };

  const token =
    typeof window !== "undefined" ? localStorage.getItem("ic_token") : null;

  const res = await fetch(`${apiBase.replace(/\/+$/, "")}/api/students/reminders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(getAuthHeaders ? getAuthHeaders() : token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || "Failed to save reminder";
    throw new Error(msg);
  }
  return data; // { message, reminders }
}
