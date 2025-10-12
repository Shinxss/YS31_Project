import React from "react";
import { X } from "lucide-react";

export default function AddReminderModal({
  showModal,
  setShowModal,
  newEvent,
  setNewEvent,
  handleSaveEvent,
}) {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-[#ecf3fc]/70 backdrop-blur-xs flex items-center justify-center z-50">

      <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6 relative">
        <button
          onClick={() => setShowModal(false)}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Add New Reminder
        </h2>

        <div className="space-y-3">
          {/* Title */}
          <input
            type="text"
            placeholder="Title"
            value={newEvent.title}
            onChange={(e) =>
              setNewEvent({ ...newEvent, title: e.target.value })
            }
            className="w-full border rounded-md px-3 py-2 text-sm"
          />

          {/* Description */}
          <textarea
            placeholder="Description"
            value={newEvent.description}
            onChange={(e) =>
              setNewEvent({ ...newEvent, description: e.target.value })
            }
            className="w-full border rounded-md px-3 py-2 text-sm"
          ></textarea>

          {/* Date and Time */}
          <div className="flex gap-3">
            <input
              type="date"
              value={newEvent.date}
              onChange={(e) =>
                setNewEvent({ ...newEvent, date: e.target.value })
              }
              className="border rounded-md px-3 py-2 text-sm w-1/2"
            />
            <input
              type="time"
              value={newEvent.time}
              onChange={(e) =>
                setNewEvent({ ...newEvent, time: e.target.value })
              }
              className="border rounded-md px-3 py-2 text-sm w-1/2"
            />
          </div>

          {/* Type Dropdown */}
          <select
            value={newEvent.type}
            onChange={(e) =>
              setNewEvent({ ...newEvent, type: e.target.value })
            }
            className="w-full border rounded-md px-3 py-2 text-sm"
          >
            <option value="">Select Reminder Type</option>
            <option value="Work">Work</option>
            <option value="Interview">Interview</option>
            <option value="Meeting">Meeting</option>
            <option value="Task">Task</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="flex justify-end mt-5">
          <button
            onClick={handleSaveEvent}
            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md text-sm"
          >
            Save Reminder
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------
   ✅ Helper to save into student_users.reminders
   - Sends both nested and flat fields for compatibility
--------------------------------------------*/
export async function saveReminderToStudentUsers({
  studentId,
  newEvent,
  apiBase = (typeof window !== "undefined" && (import.meta?.env?.VITE_API_BASE || "")) || "",
}) {
  if (!studentId) throw new Error("studentId is required");

  const toISO = (d, t) => {
    if (!d) return null;
    const dt = new Date(`${d}T${t || "00:00"}`);
    return isNaN(dt.getTime()) ? null : dt.toISOString();
  };

  const bodyFlat = {
    title: (newEvent?.title || "").trim(),
    description: (newEvent?.description || "").trim(),
    date: newEvent?.date || "",
    time: newEvent?.time || "",
    type: newEvent?.type || "Other",
    datetime: toISO(newEvent?.date, newEvent?.time),
    status: "pending",
  };

  const payload = {
    // ✅ keep nested shape (what you had)
    reminder: { ...bodyFlat },
    // ✅ also include flat shape so old/new controllers both pass
    ...bodyFlat,
    studentId,
  };

  const res = await fetch(`${apiBase}/api/student/reminders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errMsg = "Failed to save reminder";
    try {
      const err = await res.json();
      if (err?.message) errMsg = err.message;
      // surface server validation so you see it in console
      console.error("Save reminder failed:", err);
    } catch (_) {}
    throw new Error(errMsg);
  }

  return res.json();
}
