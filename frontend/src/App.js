import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import PatientDashboardPage from "./pages/PatientDashboardPage";
import GrantAccessPage from "./pages/GrantAccessPage";
import PatientRegistration from "./pages/PatientRegistration";
import { AuthContext } from "./contexts/AuthContext";

function App() {
  const { authState } = React.useContext(AuthContext);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/patient/register" element={<PatientRegistration />} />

        {/* Authenticated Routes for Patients */}
        {authState.isAuthenticated && authState.userRole === "patient" && (
          <>
            <Route path="/patient/dashboard" element={<PatientDashboardPage />} />
            <Route path="/patient/grant-access" element={<GrantAccessPage />} />
          </>
        )}

        {/* Catch-All Route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
