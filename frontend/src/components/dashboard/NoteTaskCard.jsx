// src/components/common/NoteTaskCard.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  CheckCircle2,
  Circle,
  Pencil,
  Trash2,
  Save,
  X,
  StickyNote,
} from "lucide-react";

function genId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function NoteTaskCard({
  title = "Notes & Tasks",
  userKey = "default",
  className = "",
}) {
  const storageKey = useMemo(() => `ic_notes_${userKey || "default"}`, [userKey]);
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {}
  }, [items, storageKey]);

  const addItem = () => {
    const text = draft.trim();
    if (!text) return;
    setItems((prev) => [{ id: genId(), text, done: false, createdAt: Date.now() }, ...prev]);
    setDraft("");
  };

  const toggleDone = (id) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, done: !it.done } : it)));
  };

  const startEdit = (id) => {
    const it = items.find((i) => i.id === id);
    if (!it) return;
    setEditingId(id);
    setEditingText(it.text);
  };

  const saveEdit = () => {
    const t = editingText.trim();
    if (!t) {
      setEditingId(null);
      setEditingText("");
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === editingId ? { ...i, text: t } : i)));
    setEditingId(null);
    setEditingText("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const remaining = items.filter((i) => !i.done).length;

  return (
    <div className={`rounded-2xl border shadow-sm bg-white p-4 md:p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <StickyNote className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-600">
          {remaining} pending
        </span>
      </div>

      <div className="flex gap-2 mb-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder="Add a note or task and press Enter..."
          className="flex-1 rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
        />
        <button
          onClick={addItem}
          className="inline-flex items-center gap-1 rounded-xl bg-blue-600 text-white px-3 py-2 hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-sm text-gray-500 border rounded-xl p-4">
          No notes yet. Add your first one to keep track of hiring todos, meeting reminders, or job
          post drafts.
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li
              key={it.id}
              className="group flex items-start gap-2 rounded-xl border p-2 hover:bg-gray-50"
            >
              <button
                onClick={() => toggleDone(it.id)}
                className="mt-1 shrink-0 text-blue-600 hover:opacity-80"
                title={it.done ? "Mark as not done" : "Mark as done"}
              >
                {it.done ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
              </button>

              <div className="flex-1">
                {editingId === it.id ? (
                  <input
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                    autoFocus
                    className="w-full rounded-lg border px-2 py-1 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                ) : (
                  <p
                    className={`text-sm ${
                      it.done ? "line-through text-gray-400" : "text-gray-800"
                    }`}
                  >
                    {it.text}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                {editingId === it.id ? (
                  <>
                    <button
                      onClick={saveEdit}
                      className="p-1 rounded-md bg-green-50 text-green-700 hover:bg-green-100"
                      title="Save"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-1 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEdit(it.id)}
                      className="p-1 rounded-md bg-orange-50 text-orange-700 hover:bg-orange-100"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeItem(it.id)}
                      className="p-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
