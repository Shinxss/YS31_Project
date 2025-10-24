// src/components/UsersTable.jsx
import React from "react";

/**
 * UsersTable
 * Props:
 *  - data: array of user objects
 *  - loading: boolean
 *  - onToggleStatus(userId, newStatus)
 *  - page, pageSize, total, onPageChange
 */
export default function UsersTable({
  data = [],
  loading = false,
  onToggleStatus = () => {},
  page = 1,
  pageSize = 10,
  total = 0,
  onPageChange = () => {},
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="um-table-wrap">
      <div className="um-table-toprow">
        <div className="um-results">Showing {data.length} of {total}</div>
        <div className="um-pagination">
          <button
            className="um-p-btn"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            Prev
          </button>
          <div className="um-page-info">{page} / {totalPages}</div>
          <button
            className="um-p-btn"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      </div>

      <div className="um-table-card">
        <table className="um-table">
          <thead>
            <tr>
              <th className="um-th">Name</th>
              <th className="um-th">School / Company</th>
              <th className="um-th">Email</th>
              <th className="um-th">Role</th>
              <th className="um-th">Status</th>
              <th className="um-th text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="um-empty">Loading…</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan="6" className="um-empty">No records found</td></tr>
            ) : (
              data.map((u, i) => (
                <tr key={u.id || u._id || i} className={i % 2 ? "um-row-alt" : ""}>
                  <td className="um-td name">{u.firstName ? `${u.firstName} ${u.lastName || ""}` : u.name}</td>
                  <td className="um-td subtle">{u.school || u.company || "-"}</td>
                  <td className="um-td subtle">{u.email}</td>
                  <td className="um-td subtle">{u.role || (u.company ? "Company" : "Student")}</td>
                  <td className="um-td">
                    <span className={`um-badge ${u.status === "Active" ? "active" : "disabled"}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="um-td text-center">
                    <button
                      className="um-action um-edit"
                      onClick={() => alert("Edit not implemented (placeholder)")}
                    >
                      Edit
                    </button>
                    <button
                      className="um-action um-toggle"
                      onClick={() => onToggleStatus(u.id || u._id || i, u.status === "Active" ? "Disabled" : "Active")}
                    >
                      {u.status === "Active" ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
