import React, { useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE = import.meta.env.VITE_API || "http://localhost:5000";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/admin/login`, {
        email,
        password,
      });
      localStorage.setItem("adminToken", res.data.token);
      toast.success("Welcome back, Admin!");
      setTimeout(() => (window.location.href = "/dashboard"), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E8EEF9]">
      {/* Login Card */}
      <div className="bg-white shadow-xl rounded-2xl w-[580px] px-10 py-12">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-6 h-6 bg-[#F37526] rounded-sm"></div>
          <h1 className="text-xl font-bold text-[#173B8A]">InternConnect</h1>
        </div>

        <p className="text-center text-gray-600 mb-6">
          Login to your Admin Account
        </p>

        <h2 className="text-center text-2xl font-semibold text-gray-800 mb-2">
          Welcome Back
        </h2>
        <p className="text-center text-gray-500 text-sm mb-6">
          Please enter your admin credentials
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#173B8A] outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#173B8A] outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F37526] hover:bg-[#e66b1f] text-white font-medium py-2 rounded-lg transition duration-200"
          >
            {loading ? "Signing in..." : "Sign in as Admin"}
          </button>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
}
