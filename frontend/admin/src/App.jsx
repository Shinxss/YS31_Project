import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard"; 

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLogin />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
