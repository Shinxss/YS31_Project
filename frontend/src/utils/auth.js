export const auth = {
  save({ token, role, profile }) {
    localStorage.setItem("ic_token", token);
    localStorage.setItem("ic_role", role);
    localStorage.setItem("ic_profile", JSON.stringify(profile || null));
  },
  clear() {
    localStorage.removeItem("ic_token");
    localStorage.removeItem("ic_role");
    localStorage.removeItem("ic_profile");
  },
  token() { return localStorage.getItem("ic_token"); },
  role() { return localStorage.getItem("ic_role"); },
  isAuthed() { return !!localStorage.getItem("ic_token"); }
};
