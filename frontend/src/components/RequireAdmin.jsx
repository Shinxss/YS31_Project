// src/components/RequireAdmin.jsx
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

/*
  Simple approach: token stored in localStorage (e.g. "authToken") and
  we call backend /api/auth/validate to check token + role.
  You can adapt to your auth flow (cookies, sessions, etc).
*/

export default function RequireAdmin({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setLoading(false);
      setIsAdmin(false);
      return;
    }

    // validate token and role on the backend
    fetch("/api/auth/validate", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("invalid");
        const data = await res.json();
        // expected response { ok: true, role: "admin", user: {...} }
        setIsAdmin(data.role === "admin");
      })
      .catch(() => setIsAdmin(false))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Checking permissions…</div>;

  if (!isAdmin) {
    // redirect to admin login (we preserve where they tried to go)
    return <Navigate to="/admin" state={{ from: location }} replace />;
  }

  return children;
}
