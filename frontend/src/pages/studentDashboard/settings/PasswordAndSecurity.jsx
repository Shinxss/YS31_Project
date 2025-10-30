import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

/* ✅ Password rule + validator */
const PASSWORD_RULE_TEXT =
  "Password must be at least 6 characters and include 1 uppercase letter and 1 number.";
const isStrongPassword = (pw = "") => /^(?=.*[A-Z])(?=.*\d).{6,}$/.test(pw);

/**
 * Student • Password & Security (placeholder)
 * - Static UI only (no API calls yet)
 * - Shows current auth method + disabled change-password form
 */
export function PasswordAndSecurity() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // 👁️ password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Error states
  const [errors, setErrors] = useState({});

  async function handleChangePassword(e) {
    e.preventDefault();
    setMsg("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      return setMsg("Please fill out all fields.");
    }
    if (newPassword !== confirmPassword) {
      return setMsg("New password and confirmation do not match.");
    }
    try {
      setLoading(true);
      const token = localStorage.getItem("ic_token");
      const res = await fetch(`${API_BASE}/api/auth/password/change`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to change password");
      setMsg("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setMsg(err.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold text-[#173B8A]">Password & Security</h2>
      <p className="text-gray-600 mt-1">
        Manage your sign-in and security. This is a placeholder while we connect the backend.
      </p>

      {/* Auth method card */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-medium text-gray-900">Sign-in method</div>
            <div className="text-sm text-gray-600 mt-1">
              Email &amp; Password (default)
            </div>
          </div>
          <span className="inline-flex items-center text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
            Placeholder
          </span>
        </div>
      </div>

      {/* Change password */}
      <form onSubmit={handleChangePassword} className="mt-6 bg-white rounded-xl border border-gray-200 p-4">
        <div className="font-medium text-gray-900">Change password</div>
        {msg && (
          <div className="mt-2 text-sm px-3 py-2 rounded-md border bg-gray-50 text-gray-800">{msg}</div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700">Current password</label>
            <input
              type={showCurrentPassword ? "text" : "password"}
              className={`mt-1 w-full rounded-md border px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-blue-200 ${
                errors.currentPassword ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setErrors((prev) => ({ ...prev, currentPassword: "" }));
              }}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
              aria-label={showCurrentPassword ? "Hide password" : "Show password"}
            >
              {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {errors.currentPassword && (
              <p className="text-xs text-red-600 mt-1">{errors.currentPassword}</p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700">New password</label>
              <input
                type={showNewPassword ? "text" : "password"}
                className={`mt-1 w-full rounded-md border px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-blue-200 ${
                  errors.newPassword ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="New password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  let err = "";
                  if (!e.target.value) err = "Password is required";
                  else if (!isStrongPassword(e.target.value)) err = PASSWORD_RULE_TEXT;
                  setErrors((prev) => ({ ...prev, newPassword: err }));
                }}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {!errors.newPassword && (
                <p className="text-xs text-gray-500 mt-1">{PASSWORD_RULE_TEXT}</p>
              )}
              {errors.newPassword && (
                <p className="text-xs text-red-600 mt-1">{errors.newPassword}</p>
              )}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700">Confirm new password</label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                className={`mt-1 w-full rounded-md border px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-blue-200 ${
                  errors.confirmPassword ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  let err = "";
                  if (!e.target.value) err = "Confirm your password";
                  else if (e.target.value !== newPassword) err = "Passwords do not match";
                  setErrors((prev) => ({ ...prev, confirmPassword: err }));
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {errors.confirmPassword && (
                <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-md bg-[#173B8A] text-white disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>

      {/* Tips */}
      <div className="mt-6 text-sm text-gray-500">
        Tip: Use a unique password with at least 8 characters, including numbers and symbols.
      </div>
    </div>
  );
}

export default PasswordAndSecurity;
