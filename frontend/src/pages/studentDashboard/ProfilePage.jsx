// src/pages/Student/ProfilePage.jsx
import React, { useEffect, useState } from "react";
import ProfileAddModal from "@/components/studentDashboard/ProfileAddModal";
import { Briefcase, GraduationCap, Award, Pencil, Trash2, Plus, Mail, Phone, MapPin, Calendar, User, Globe } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // which section is opening the modal: "experience" | "education" | "certification" | null
  const [modalType, setModalType] = useState(null);
  const [editData, setEditData] = useState(null);

  const [profile, setProfile] = useState({
    profilePicture: "",
    firstName: "",
    lastName: "",
    email: "",
    course: "",
    bio: "",
    skills: "",
    age: "",
    location: "",
    contactNumber: "",
    gender: "",
    race: "",
    experience: [],
    education: [],
    certification: [],
  });

  const token = localStorage.getItem("ic_token");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/student/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.student) {
          const s = data.student;
          setProfile((prev) => ({
            ...prev,
            ...s,
            skills: s.skills?.join(", ") || "",
            experience: s.experience || [],
            education: s.education || [],
            certification: s.certification || [],
          }));
        }
      } catch (e) {
        console.error("fetch profile failed", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) =>
    setProfile({ ...profile, [e.target.name]: e.target.value });

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () =>
      setProfile((p) => ({ ...p, profilePicture: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const handleRemovePicture = () =>
    setProfile((p) => ({ ...p, profilePicture: "" }));

  const handleSaveBase = async () => {
    try {
      if (!/^\d{11}$/.test(profile.contactNumber || "")) {
        alert("Enter a valid 11-digit number (e.g., 09XXXXXXXXX).");
        return;
      }
      if (profile.gender && !["Male", "Female"].includes(profile.gender)) {
        alert("Gender must be either 'Male' or 'Female'.");
        return;
      }
      setLoading(true);
      const body = {
        bio: profile.bio,
        skills: profile.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        age: profile.age,
        location: profile.location,
        contactNumber: profile.contactNumber,
        gender: profile.gender,
        race: profile.race,
        profilePicture: profile.profilePicture,
      };
      const res = await fetch(`${API_BASE}/api/student/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update profile");
      alert("Profile updated successfully!");
      setIsEditing(false);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = (type) => {
    setModalType(type);
    setEditData(null);
  };
  const openEdit = (type, item) => {
    setModalType(type);
    setEditData(item);
  };
  const closeModal = () => {
    setModalType(null);
    setEditData(null);
  };

  const handleUpsertItem = async (type, item) => {
    let updated;
    if (editData) {
      updated = (profile[type] || []).map((i) =>
        i._id === editData._id ? { ...i, ...item } : i
      );
    } else {
      updated = [...(profile[type] || []), item];
    }
    setProfile((p) => ({ ...p, [type]: updated }));

    const res = await fetch(`${API_BASE}/api/student/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ [type]: updated }),
    });
    if (!res.ok) alert("Failed to save.");
    closeModal();
  };

  const handleDelete = async (type, id) => {
    if (!confirm("Delete this item?")) return;
    const updated = (profile[type] || []).filter((i) => i._id !== id);
    setProfile((p) => ({ ...p, [type]: updated }));
    await fetch(`${API_BASE}/api/student/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ [type]: updated }),
    });
  };

  const initials =
    `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`.toUpperCase();

  return (
    <div className="min-h-screen w-full bg-white rounded-2xl">
      {/* HEADER */}
      <div className=" flex items-center justify-between px-8 pt-6">
          {/* Left: Avatar + Name */}
          <div className="flex items-center gap-5">
            <div className="relative h-20 w-20 md:h-24 md:w-24 rounded-full border border-gray-300 overflow-hidden bg-gray-100">
              {profile.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt="avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-2xl md:text-3xl text-gray-600 font-semibold">
                  {(profile.firstName?.[0] || " ").toUpperCase()}
                  {(profile.lastName?.[0] || " ").toUpperCase()}
                </div>
              )}

              {/* Restored Change/Remove controls (show only when editing) */}
              {isEditing && (
                <div className="absolute -bottom-2 right-0 flex gap-1">
                  <label className="cursor-pointer rounded-md bg-blue-600 px-2 py-1 text-[10px] md:text-xs text-white shadow">
                    Change
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {profile.profilePicture && (
                    <button
                      onClick={handleRemovePicture}
                      className="rounded-md bg-red-500 px-2 py-1 text-[10px] md:text-xs text-white shadow"
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}
            </div>
            <div>
              {/* Bigger name + subtitle */}
              <div className="text-[22px] md:text-[26px] font-semibold leading-tight text-gray-900">
                {profile.firstName} {profile.lastName}
              </div>
              <div className="text-sm md:text-base text-gray-500">
                {profile.course || "Information Technology"}
              </div>
            </div>
          </div>

          {/* Right: actions */}
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-90">
                <path d="M11 4h2v16h-2zM4 11h16v2H4z" fill="currentColor" />
              </svg>
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                className="rounded-md border px-4 py-2 text-sm"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBase}
                disabled={loading}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>

      {/* MAIN GRID */}
      <div className="px-6 md:px-8 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* About Me */}
            <Card>
              <SectionTitle>About Me</SectionTitle>
              {isEditing ? (
                <>
                  <textarea
                    name="bio"
                    rows={5}
                    value={profile.bio}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) handleChange(e);
                    }}
                    className="mt-2 w-full rounded-md border p-2 text-sm"
                    placeholder="Write a short description..."
                  />
                  <div className="text-xs text-gray-500 text-right">
                    {profile.bio.length}/500
                  </div>
                </>
              ) : (
                <p className="mt-2 text-sm text-gray-700 leading-6">
                  {profile.bio ||
                    "A 3rd-year Information Technology student passionate about software development, networking, and system design. Skilled in web and database technologies with hands-on experience in full-stack apps and network infrastructures."}
                </p>
              )}
            </Card>

            {/* Skills */}
            <Card>
              <SectionTitle>Skills</SectionTitle>
              {isEditing ? (
                <input
                  type="text"
                  name="skills"
                  value={profile.skills}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-md border p-2 text-sm"
                  placeholder="Comma-separated skills"
                />
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.skills
                    ? profile.skills.split(",").map((s, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center rounded-full border px-3 py-1 text-xs text-gray-700 bg-white"
                        >
                          {s.trim()}
                        </span>
                      ))
                    : <span className="text-sm text-gray-400">No skills added</span>}
                </div>
              )}
            </Card>

            {/* Contact & Details */}
            <Card>
              <SectionTitle>Contact & Details</SectionTitle>
              <div className="mt-3 space-y-4">
                <KV label="Email" value={profile.email || "—"} />
                <KVInput
                  editing={isEditing}
                  label="Contact Number"
                  name="contactNumber"
                  value={profile.contactNumber || ""}
                  onChange={handleChange}
                />
                <KVInput
                  editing={isEditing}
                  label="Location"
                  name="location"
                  value={profile.location || ""}
                  onChange={handleChange}
                />
                <div className="grid grid-cols-3 gap-4">
                  <KVInput
                    editing={isEditing}
                    label="Age"
                    name="age"
                    value={profile.age || ""}
                    onChange={handleChange}
                  />
                  <KVSelect
                    editing={isEditing}
                    label="Gender"
                    name="gender"
                    value={profile.gender || ""}
                    onChange={handleChange}
                    options={["Male", "Female"]}
                  />
                  <KVInput
                    editing={isEditing}
                    label="Nationality"
                    name="race"
                    value={profile.race || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN (spans 2) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Work Experience */}
            <SectionBlock
              title="Work Experience"
              addLabel="Add Experience"
              onAdd={() => openAdd("experience")}
            >
              <List
                type="experience"
                items={profile.experience}
                onEdit={(item) => openEdit("experience", item)}
                onDelete={(id) => handleDelete("experience", id)}
                icon={Briefcase}
              />
            </SectionBlock>

            {/* Education */}
            <SectionBlock
              title="Education"
              addLabel="Add Education"
              onAdd={() => openAdd("education")}
            >
              <List
                type="education"
                items={profile.education}
                onEdit={(item) => openEdit("education", item)}
                onDelete={(id) => handleDelete("education", id)}
                icon={GraduationCap}
              />
            </SectionBlock>

            {/* Certifications */}
            <SectionBlock
              title="Certifications"
              addLabel="Add Certification"
              onAdd={() => openAdd("certification")}
            >
              <List
                type="certification"
                items={profile.certification}
                onEdit={(item) => openEdit("certification", item)}
                onDelete={(id) => handleDelete("certification", id)}
                icon={Award}
              />
            </SectionBlock>
          </div>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {modalType && (
        <ProfileAddModal
          type={modalType}
          onClose={closeModal}
          initialData={editData}
          onSave={(item) => handleUpsertItem(modalType, item)}
        />
      )}
    </div>
  );
}

/* ========== UI PIECES (exact look of the screenshots) ========== */

function Card({ children }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h3 className="text-base font-semibold text-gray-800">{children}</h3>;
}

function SectionBlock({ title, addLabel, onAdd, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-md bg-orange-500 px-3 py-2 text-xs font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          {addLabel}
        </button>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function List({ type, items = [], onEdit, onDelete, icon: Icon }) {
  if (!items.length) {
    return <p className="text-sm text-gray-600">No {type} added yet.</p>;
  }

  return items.map((item) => {
    const title =
      type === "experience" ? item.jobTitle :
      type === "education" ? item.degree : item.title;

    const org =
      type === "experience" ? item.companyName :
      type === "education" ? item.school : item.companyName;

    const sub =
      type === "certification"
        ? (item.companyName || "")
        : `${formatYear(item.startDate)} - ${item.endDate ? formatYear(item.endDate) : "Present"}`;

    const rightSub =
      type === "certification" && item.dateReceived
        ? formatMonthYear(item.dateReceived)
        : null;

    return (
      <div
        key={item._id}
        className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Icon className="h-6 w-6 text-blue-700" />
          </div>
          <div className="leading-tight">
            <div className="font-medium text-gray-900">{title}</div>
            <div className="text-sm text-gray-700">{org}</div>
            <div className="text-sm text-gray-500">
              {rightSub ? rightSub : sub}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onEdit(item)}
            className="text-blue-600 hover:text-gray-900"
            title="Edit"
          >
            <Pencil className="h-5 w-5" />
          </button>
          <button
            onClick={() => onDelete(item._id)}
            className="text-red-500 hover:text-red-600"
            title="Delete"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  });
}

/* Small pieces used by left column */

function KV({ label, value }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-600">{label}</div>
      <div className="mt-1 text-sm text-gray-900">{value}</div>
    </div>
  );
}

function KVInput({ editing, label, name, value, onChange }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-600">{label}</div>
      {editing ? (
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          className="mt-1 w-full rounded-md border p-2 text-sm"
        />
      ) : (
        <div className="mt-1 text-sm text-gray-900">{value || "—"}</div>
      )}
    </div>
  );
}

function KVSelect({ editing, label, name, value, onChange, options }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-600">{label}</div>
      {editing ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="mt-1 w-full rounded-md border p-2 text-sm"
        >
          <option value="">Select</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <div className="mt-1 text-sm text-gray-900">{value || "—"}</div>
      )}
    </div>
  );
}

/* date helpers */
function formatYear(d) {
  try {
    return new Date(d).getFullYear();
  } catch {
    return "—";
  }
}
function formatMonthYear(d) {
  try {
    return new Date(d).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}
