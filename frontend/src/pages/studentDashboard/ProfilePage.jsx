import React, { useState, useEffect } from "react";
import ProfileAddModal from "@/components/studentDashboard/ProfileAddModal";
import { Briefcase, GraduationCap, Award, Pencil, Trash2, PlusCircle } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("experience");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
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
    const fetchProfile = async () => {
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
      } catch (err) {
        console.error("Failed to fetch student profile:", err);
      }
    };

    fetchProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) =>
    setProfile({ ...profile, [e.target.name]: e.target.value });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile({ ...profile, profilePicture: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePicture = () =>
    setProfile({ ...profile, profilePicture: "" });

  const handleSave = async () => {
    try {
      if (!/^\d{11}$/.test(profile.contactNumber)) {
        alert("Please enter a valid 11-digit contact number (e.g., 09XXXXXXXXX)");
        return;
      }

      if (profile.gender && !["Male", "Female"].includes(profile.gender)) {
        alert("Gender must be either 'Male' or 'Female'.");
        return;
      }

      setLoading(true);
      const body = {
        bio: profile.bio,
        skills: profile.skills.split(",").map((s) => s.trim()),
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
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (type, item) => {
    try {
      let updated;
      if (editData) {
        updated = profile[type].map((i) =>
          i._id === editData._id ? { ...i, ...item } : i
        );
      } else {
        updated = [...(profile[type] || []), item];
      }

      setProfile({ ...profile, [type]: updated });

      const res = await fetch(`${API_BASE}/api/student/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [type]: updated }),
      });

      if (!res.ok) throw new Error("Failed to save");
      setShowModal(false);
      setEditData(null);
    } catch (err) {
      console.error(err);
      alert("Failed to add item");
    }
  };

  const handleEdit = (item) => {
    setEditData(item);
    setShowModal(true);
  };

  const handleDelete = async (type, id) => {
    if (!confirm("Delete this item?")) return;
    const updated = profile[type].filter((i) => i._id !== id);
    setProfile({ ...profile, [type]: updated });
    await fetch(`${API_BASE}/api/student/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ [type]: updated }),
    });
  };

  const getInitials = () =>
    `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`.toUpperCase();

  return (
    <div className="px-8 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-900">User Profile</h2>

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm bg-orange-500 text-white px-4 py-2 rounded"
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* MAIN PROFILE SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* LEFT CARD */}
        <div className="bg-white shadow-lg rounded-xl p-8 flex flex-col items-center text-center w-full min-w-[360px]">
          {/* Profile Picture */}
          <div className="relative w-32 h-32 mb-4">
            {profile.profilePicture ? (
              <img
                src={profile.profilePicture}
                alt="Profile"
                className="w-full h-full object-cover rounded-full border-4 border-blue-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center rounded-full bg-blue-200 text-blue-800 text-3xl font-semibold border-4 border-blue-500">
                {getInitials()}
              </div>
            )}

            {isEditing && (
              <div className="absolute bottom-0 right-0 flex gap-1">
                <label className="bg-blue-600 text-white px-2 py-1 text-xs rounded cursor-pointer">
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
                    className="bg-red-500 text-white px-2 py-1 text-xs rounded"
                  >
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Name */}
          <h3 className="text-lg font-bold text-[#173B8A] mb-1">
            {profile.firstName} {profile.lastName}
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            {profile.course || "Student"}
          </p>

          {/* Bio */}
          <div className="w-full mt-4">
            <h4 className="text-sm font-semibold text-gray-700 text-left">
              About:
            </h4>
            {isEditing ? (
              <>
                <textarea
                  name="bio"
                  value={profile.bio}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) handleChange(e);
                  }}
                  rows={4}
                  className="w-full border rounded-md p-2 text-sm resize-none"
                  placeholder="Write a short description about yourself..."
                />
                <p
                  className={`text-xs text-right mt-1 ${
                    profile.bio.length > 480
                      ? "text-red-500"
                      : "text-gray-500"
                  }`}
                >
                  {profile.bio.length}/500 characters
                </p>
              </>
            ) : (
              <p className="text-gray-700 text-sm mt-1 whitespace-pre-line">
                {profile.bio || "Add a short description about yourself..."}
              </p>
            )}
          </div>

          {/* Skills */}
          <div className="w-full mt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2 text-left">
              Skills:
            </h4>
            {isEditing ? (
              <input
                type="text"
                name="skills"
                value={profile.skills}
                onChange={handleChange}
                className="w-full border rounded-md p-2 text-sm"
                placeholder="Comma-separated skills"
              />
            ) : (
              <div className="flex flex-wrap gap-2 justify-center">
                {profile.skills
                  ? profile.skills.split(",").map((s, i) => (
                      <span
                        key={i}
                        className="bg-gray-100 border border-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full"
                      >
                        {s.trim()}
                      </span>
                    ))
                  : (
                    <span className="text-gray-400 text-sm">
                      No skills added
                    </span>
                  )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="md:col-span-2 space-y-6">
          {/* Save & Cancel Buttons at Top */}
          {isEditing && (
            <div className="flex justify-end gap-3 mb-3">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border rounded-md text-sm hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}

          {/* BASIC INFO CARD */}
          <div className="bg-white shadow-lg rounded-xl p-6">
            <h4 className="text-lg font-bold text-blue-900 mb-4">
              Basic Information
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {renderField("Email", "email", profile, handleChange, false)}
              {renderField("Age", "age", profile, handleChange, isEditing)}
              {renderField("Location", "location", profile, handleChange, isEditing)}
              {renderField("Contact Number", "contactNumber", profile, handleChange, isEditing)}
              {renderSelect("Gender", "gender", profile, handleChange, isEditing, ["Male", "Female"])}
              {renderField("Nationality", "race", profile, handleChange, isEditing)}
            </div>
          </div>

          {/* EXPERIENCE / EDUCATION / CERTIFICATION */}
          <div className="bg-white shadow-lg rounded-xl p-6">
            <div className="flex justify-between border-b border-gray-200 mb-4">
              <div className="flex gap-6">
                {["experience", "education", "certification"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-2 font-medium text-sm ${
                      activeTab === tab
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-500 hover:text-blue-600"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setShowModal(true);
                  setEditData(null);
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Add {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </button>
            </div>

            {/* Tab content */}
            <div className="space-y-4">
              {(profile[activeTab] || []).length > 0 ? (
                profile[activeTab].map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between bg-blue-50 rounded-lg p-4 border border-blue-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-3 rounded-md border border-gray-300">
                        {activeTab === "experience" && (
                          <Briefcase className="w-6 h-6 text-gray-800" />
                        )}
                        {activeTab === "education" && (
                          <GraduationCap className="w-6 h-6 text-gray-800" />
                        )}
                        {activeTab === "certification" && (
                          <Award className="w-6 h-6 text-gray-800" />
                        )}
                      </div>
                      <div className="leading-tight">
                        <p className="font-medium text-gray-900">
                          {activeTab === "experience"
                            ? item.jobTitle
                            : activeTab === "education"
                            ? item.degree
                            : item.title}
                        </p>
                        <p className="text-sm text-gray-700">
                          {activeTab === "experience"
                            ? item.companyName
                            : activeTab === "education"
                            ? item.school
                            : item.companyName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {activeTab === "experience" || activeTab === "education"
                            ? `${new Date(item.startDate).getFullYear()} - ${
                                item.endDate
                                  ? new Date(item.endDate).getFullYear()
                                  : "Present"
                              }`
                            : new Date(item.dateReceived).toLocaleDateString(
                                "en-US",
                                { month: "long", year: "numeric" }
                              )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-800 transition"
                        title="Edit"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(activeTab, item._id)}
                        className="text-orange-500 hover:text-orange-700 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-600 text-sm">
                  No {activeTab} added yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <ProfileAddModal
          type={activeTab}
          onClose={() => {
            setShowModal(false);
            setEditData(null);
          }}
          initialData={editData}
          onSave={(item) => handleAddItem(activeTab, item)}
        />
      )}
    </div>
  );
}

/* Helpers */
function renderField(label, name, profile, onChange, isEditing) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-800">{label}</label>
      {isEditing && name !== "email" ? (
        <input
          type="text"
          name={name}
          value={profile[name]}
          onChange={onChange}
          className="w-full border rounded-md p-2 text-sm"
        />
      ) : (
        <p className="text-gray-900 text-sm mt-1">{profile[name] || "—"}</p>
      )}
    </div>
  );
}

function renderSelect(label, name, profile, onChange, isEditing, options) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-800">{label}</label>
      {isEditing ? (
        <select
          name={name}
          value={profile[name]}
          onChange={onChange}
          className="w-full border rounded-md p-2 text-sm"
        >
          <option value="">Select</option>
          {options.map((opt, i) => (
            <option key={i} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <p className="text-gray-900 text-sm mt-1">{profile[name] || "—"}</p>
      )}
    </div>
  );
}
