// src/pages/companyDashboard/settings/CompanyDetails.jsx
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getCompanyStats } from "@/services/api";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function CompanyDetails() {
  const [formData, setFormData] = useState({
    companyName: "",
    industry: "",
    description: "",
    address: "",
    city: "",
    province: "",
    zipCode: "",
    email: "",
    website: "",
    companySize: "",
  });

  const [coverPhoto, setCoverPhoto] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [previewCover, setPreviewCover] = useState("");
  const [previewProfile, setPreviewProfile] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const token = localStorage.getItem("ic_token");

  // 🧠 Load company data
  const fetchCompanyData = async () => {
    try {
      const data = await getCompanyStats();
      setFormData({
        companyName: data.companyName || "",
        industry: data.industry || data.user?.industry || "",
        description: data.description || "",
        address: data.address || "",
        city: data.city || "",
        province: data.province || "",
        zipCode: data.zipCode || "",
        email: data.email || data.user?.email || "",
        website: data.website || "",
        companySize: data.companySize || "",
      });

      if (data.coverPhoto)
        setPreviewCover(`${API_BASE}/uploads/company/${data.coverPhoto}`);
      if (data.profileImage)
        setPreviewProfile(`${API_BASE}/uploads/company/${data.profileImage}`);
    } catch (err) {
      console.error("Error fetching company info:", err);
      toast.error("Failed to load company info");
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // 📷 Handle image to base64
  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "cover") {
          setCoverPhoto(reader.result);
          setPreviewCover(reader.result);
        } else {
          setProfileImage(reader.result);
          setPreviewProfile(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        coverPhoto,
        profileImage,
      };

      const res = await fetch(`${API_BASE}/api/company/details/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save details");
      toast.success("Company details saved successfully!");
      setIsEditing(false);
      await fetchCompanyData();
    } catch (err) {
      console.error("Save company details failed:", err);
      toast.error("Failed to save company details");
    }
  };

  // ✅ Unified input style
  const inputStyle = (extra = "") =>
    `w-full rounded-md px-3 py-2 bg-gray-50 text-gray-800 transition-all duration-200 ${
      isEditing
        ? "border border-gray-400 focus:ring-2 focus:ring-blue-400"
        : "border border-gray-300"
    } ${extra}`;

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-8 space-y-8">
      {/* === Header Section === */}
      <div className="bg-white rounded-lg shadow">
        <div className="relative w-full h-48 rounded-t-lg overflow-hidden bg-gray-200">
          {previewCover && (
            <img
              src={previewCover}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
          {isEditing && (
            <label className="absolute bottom-3 right-3 bg-white px-3 py-1 rounded-md shadow text-sm cursor-pointer">
              Change Cover
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, "cover")}
              />
            </label>
          )}
        </div>

        <div className="flex items-center gap-6 px-6 py-6 relative">
          <div className="relative w-24 h-24 rounded-full border-4 border-white overflow-hidden -mt-16 bg-gray-200">
            {previewProfile && (
              <img
                src={previewProfile}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            )}
            {isEditing && (
              <label className="absolute bottom-1 right-1 bg-white p-1 rounded-full shadow cursor-pointer text-xs">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, "profile")}
                />
                📷
              </label>
            )}
          </div>

          <div className="flex-1 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Company Name
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                disabled={true} // 🔒 permanently disabled
                onChange={handleChange}
                className={inputStyle()}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Industry
              </label>
              <input
                type="text"
                name="industry"
                value={formData.industry}
                disabled={true} // 🔒 permanently disabled
                onChange={handleChange}
                className={inputStyle()}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            {isEditing ? "Cancel Edit" : "Edit Company Details"}
          </button>
        </div>
      </div>

      {/* === About Section === */}
      <div className="bg-white p-6 rounded-lg shadow space-y-3">
        <h3 className="text-lg font-bold text-gray-800">About Your Company</h3>
        <label className="block text-gray-700 font-semibold mb-1">
          Company Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          disabled={!isEditing}
          onChange={handleChange}
          rows="4"
          className={inputStyle("resize-none")}
        />
      </div>

      {/* === Contact Section === */}
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Contact Information</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            ["address", "Street Address"],
            ["city", "City"],
            ["province", "State/Province"],
            ["zipCode", "ZIP/Postal Code"],
          ].map(([name, label]) => (
            <div key={name}>
              <label className="block text-gray-700 font-semibold mb-1">
                {label}
              </label>
              <input
                name={name}
                value={formData[name]}
                disabled={!isEditing}
                onChange={handleChange}
                className={inputStyle()}
              />
            </div>
          ))}

          <div className="col-span-2">
            <label className="block text-gray-700 font-semibold mb-1">
              Email Address
            </label>
            <input
              name="email"
              value={formData.email}
              disabled={true} // 🔒 permanently disabled
              onChange={handleChange}
              className={inputStyle()}
            />
          </div>

          <div className="col-span-2">
            <label className="block text-gray-700 font-semibold mb-1">
              Website
            </label>
            <input
              name="website"
              value={formData.website}
              disabled={!isEditing}
              onChange={handleChange}
              className={inputStyle()}
            />
          </div>
        </div>
      </div>

      {/* === Operational Section === */}
      <div className="bg-white p-6 rounded-lg shadow space-y-3">
        <h3 className="text-lg font-bold text-gray-800">Operational Details</h3>
        <p className="text-sm text-gray-500">
          Define key operational aspects for your company.
        </p>
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Company Size
          </label>
          <input
            name="companySize"
            value={formData.companySize}
            disabled={!isEditing}
            onChange={handleChange}
            placeholder="Company Size"
            className={inputStyle()}
          />
        </div>
      </div>

      {/* === Save Button === */}
      {isEditing && (
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            className="px-5 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}
