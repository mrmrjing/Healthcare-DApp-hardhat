import React, { useEffect, useContext } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import PatientDashboard from "./pages/PatientDashboardPage";
import GrantAccess from "./components/Patient/GrantAccess";
import RequestAccessPage from "./pages/RequestAccessPage"; 
import PatientRegistration from "./pages/PatientRegistrationPage";
import DoctorRegistration from "./pages/DoctorRegistrationPage";
import AdminDashboard from "./pages/AdminDashboardPage";
import { AuthContext } from "./contexts/AuthContext";

function App() {
  const { authState, setAuthState } = useContext(AuthContext);

  useEffect(() => {
    const storedAuthState = JSON.parse(localStorage.getItem("authState"));
    if (storedAuthState) {
      setAuthState(storedAuthState); // Restore previous auth state
    }
  }, []);

  // ProtectedRoute Logic
  const ProtectedRoute = ({ children, requiredRole }) => {
    if (!authState.isAuthenticated) {
      return <Navigate to="/" replace />;
    }
  
    if (requiredRole && authState.userRole !== requiredRole) {
      // Redirect based on current role if mismatched
      const redirectPath = authState.userRole === "doctor"
        ? "/doctor/request-access"
        : "/patient/dashboard";
      return <Navigate to={redirectPath} replace />;
    }
  
    return children;
  };
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/patient/register" element={<PatientRegistration />} />
        <Route path="/doctor/register" element={<DoctorRegistration />} />

        {/* Protected Routes */}
        <Route
          path="/patient/dashboard"
          element={
            <ProtectedRoute requiredRole="patient">
              <PatientDashboard/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/grant-access"
          element={
            <ProtectedRoute requiredRole="patient">
              <GrantAccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/request-access"
          element={
            <ProtectedRoute requiredRole="doctor"> 
              <RequestAccessPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch-All Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
