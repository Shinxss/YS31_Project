import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import UserLogin from "./pages/Login";
import UserSignup from "./pages/Signup";
import FindInternships from "./pages/FindInternships";
import ForCompanys from "./pages/ForCompany";
import AboutUs from "./pages/AboutUs";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/student-login" element={<UserLogin />} />
        <Route path="/student-signup" element={<UserSignup />} />
        <Route path="/internships" element={<FindInternships />} />
        <Route path="/companies" element={<ForCompanys />} />
        <Route path="/about" element={<AboutUs />} />
      </Routes>
    </Router>
  );
}

export default App;
