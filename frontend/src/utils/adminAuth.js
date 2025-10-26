export const saveAdminAuth = (data) =>
  localStorage.setItem("adminAuth", JSON.stringify(data));

export const getAdmin = () => {
  try { return JSON.parse(localStorage.getItem("adminAuth")); }
  catch { return null; }
};

export const isLoggedIn = () => !!getAdmin();

export const clearAdminAuth = () => localStorage.removeItem("adminAuth");
