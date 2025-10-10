import React, { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("experience");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

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
    experience: "",
    education: "",
    certification: "",
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
          setProfile({
            profilePicture: s.profilePicture || "",
            firstName: s.firstName || "",
            lastName: s.lastName || "",
            email: s.email || "",
            course: s.course || "",
            bio: s.bio || "",
            skills: s.skills?.join(", ") || "",
            age: s.age || "",
            location: s.location || "",
            contactNumber: s.contactNumber || "",
            gender: s.gender || "",
            race: s.race || "",
            experience: s.experience || "",
            education: s.education || "",
            certification: s.certification || "",
          });
        }
      } catch (err) {
        console.error("Failed to fetch student profile:", err);
      }
    };
    fetchProfile();
  }, [token]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile({ ...profile, profilePicture: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePicture = () => {
    setProfile({ ...profile, profilePicture: "" });
  };

  const handleSave = async () => {
    try {
      // ✅ Validate contact number (Philippines format: 11 digits)
      if (!/^\d{11}$/.test(profile.contactNumber)) {
        alert("Please enter a valid 11-digit contact number (e.g., 09XXXXXXXXX)");
        return;
      }

      // ✅ Validate gender (Male/Female only)
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
        experience: profile.experience,
        education: profile.education,
        certification: profile.certification,
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
      alert("Profile saved successfully!");
      setIsEditing(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    const f = profile.firstName?.charAt(0).toUpperCase() || "";
    const l = profile.lastName?.charAt(0).toUpperCase() || "";
    return f + l;
  };

  return (
    <div className="p-8 space-y-6">
      <h2 className="text-2xl font-bold text-blue-900 mb-6">User Profile</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* LEFT PROFILE CARD */}
        <div className="bg-white shadow-lg rounded-xl p-8 flex flex-col items-center text-center w-full h-fit min-w-[340px] md:min-w-[380px] transition-all duration-200">
          {/* Profile Avatar */}
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

          {/* Full Name */}
          <h3 className="text-lg font-bold text-[#173B8A] mb-1">
            {`${profile.firstName} ${profile.lastName}`}
          </h3>

          {/* Course */}
          <p className="text-sm text-gray-600 mb-3">
            {profile.course || "Student"}
          </p>

          {/* Bio (About Section) */}
          <div className="w-full mt-4">
            <h4 className="text-sm font-semibold text-[#173B8A] mb-2">About:</h4>
            {isEditing ? (
              <div className="w-full">
                <textarea
                  name="bio"
                  value={profile.bio}
                  onChange={(e) => {
                    if (e.target.value.length <= 250) {
                      handleChange(e);
                    }
                  }}
                  rows={5}
                  className="w-full border rounded-md p-3 text-sm resize-none"
                  placeholder="Write a short description about yourself..."
                />
                <p className="text-xs text-gray-500 text-right mt-1">
                  {profile.bio.length}/250 characters
                </p>
              </div>
            ) : (
              <p className="text-gray-700 text-sm leading-relaxed text-center px-3 break-words whitespace-pre-line">
                {profile.bio
                  ? profile.bio
                  : "Add a short description about yourself..."}
              </p>
            )}
          </div>

          {/* Skills */}
          <div className="w-full mt-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 text-left">
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

        {/* RIGHT PANEL */}
        <div className="md:col-span-2 space-y-6">
          {/* BASIC INFO */}
          <div className="bg-white shadow-lg rounded-xl p-6">
            <h4 className="text-lg font-semibold text-blue-900 mb-4">
              Basic Information
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {renderField("Email", "email", profile, handleChange, false)}
              {renderField("Age", "age", profile, handleChange, isEditing)}
              {renderField("Location", "location", profile, handleChange, isEditing)}
              {renderField("Contact Number", "contactNumber", profile, handleChange, isEditing)}
              {renderSelect("Gender", "gender", profile, handleChange, isEditing, ["Male", "Female"])}
              {renderField("Race", "race", profile, handleChange, isEditing)}
            </div>
          </div>

          {/* NAVIGATION TABS */}
          <div className="bg-white shadow-lg rounded-xl p-6">
            <div className="flex gap-6 border-b border-gray-200 mb-4">
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

            {isEditing ? (
              <textarea
                name={activeTab}
                value={profile[activeTab]}
                onChange={handleChange}
                rows={4}
                className="w-full border rounded-md p-2 text-sm"
                placeholder={`Add your ${activeTab} details here...`}
              />
            ) : (
              <p className="text-gray-700 text-sm">
                {profile[activeTab] || `No ${activeTab} added yet.`}
              </p>
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex justify-end gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border rounded-md text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-orange-500 text-white rounded-md text-sm"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Field render helpers */
function renderField(label, name, profile, onChange, isEditing) {
  return (
    <div>
      <label className="text-sm text-gray-600">{label}</label>
      {isEditing && name !== "email" ? (
        <input
          type="text"
          name={name}
          value={profile[name]}
          onChange={onChange}
          className="w-full border rounded-md p-2 text-sm"
        />
      ) : (
        <p className="text-gray-800 text-sm mt-1">{profile[name] || "—"}</p>
      )}
    </div>
  );
}

function renderSelect(label, name, profile, onChange, isEditing, options) {
  return (
    <div>
      <label className="text-sm text-gray-600">{label}</label>
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
        <p className="text-gray-800 text-sm mt-1">{profile[name] || "—"}</p>
      )}
    </div>
  );
}
