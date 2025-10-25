// src/utils/adminAuth.js
const TOKEN_KEY = "internconnect_admin_token";
const ADMIN_KEY = "internconnect_admin_user";

export const saveAdminAuth = ({ token, admin }) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (admin) localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
};

export const clearAdminAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
};

export const getAdminToken = () => localStorage.getItem(TOKEN_KEY);
export const getAdmin = () => {
  const raw = localStorage.getItem(ADMIN_KEY);
  return raw ? JSON.parse(raw) : null;
};

// synchronous check used by router
export const isLoggedIn = () => Boolean(getAdminToken());
