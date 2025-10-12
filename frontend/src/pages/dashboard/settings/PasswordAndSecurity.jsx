import React from "react";

/**
 * Company • Password & Security (placeholder)
 * - Same structure as the student version for consistency
 */
export function PasswordAndSecurity() {
  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold text-[#173B8A]">Password & Security</h2>
      <p className="text-gray-600 mt-1">
        Manage your organization account security. This is a placeholder until the API is connected.
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

      {/* Change password (disabled placeholder) */}
      <form className="mt-6 bg-white rounded-xl border border-gray-200 p-4">
        <div className="font-medium text-gray-900">Change password</div>
        <p className="text-sm text-gray-600 mt-1">
          Read-only demo. Wire your backend to enable updates.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Current password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none disabled:bg-gray-50"
              placeholder="••••••••"
              disabled
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">New password</label>
              <input
                type="password"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none disabled:bg-gray-50"
                placeholder="Min 8 characters"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm new password</label>
              <input
                type="password"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 outline-none disabled:bg-gray-50"
                placeholder="Re-enter password"
                disabled
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            disabled
            className="px-4 py-2 rounded-md bg-[#173B8A] text-white disabled:opacity-60"
            title="Coming soon"
          >
            Save changes
          </button>
          <span className="text-sm text-gray-500">Coming soon</span>
        </div>
      </form>

      <div className="mt-6 text-sm text-gray-500">
        For company admins: consider enabling 2FA for all team members.
      </div>
    </div>
  );
}

export default PasswordAndSecurity;
