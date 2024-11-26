import React, { useEffect, useContext } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import PatientDashboardPage from "./pages/PatientDashboardPage";
import GrantAccessPage from "./pages/GrantAccessPage";
import PatientRegistration from "./pages/PatientRegistration";
import DoctorRegistration from "./pages/DoctorRegistration";
import AdminDashboard from "./pages/AdminDashboard";
import { AuthContext } from "./contexts/AuthContext";

function App() {
  const { authState, setAuthState } = useContext(AuthContext);

  // Clear state and storage on app load
  useEffect(() => {
    const clearPersistentData = () => {
      localStorage.clear(); // Clear all local storage
      setAuthState({
        isAuthenticated: false,
        userRole: null,
        userAddress: null,
      });
    };

    clearPersistentData();
  }, [setAuthState]);

  // ProtectedRoute Logic
  const ProtectedRoute = ({ children, requiredRole }) => {
    if (!authState.isAuthenticated) {
      // Redirect to the landing page if not authenticated
      return <Navigate to="/" replace />;
    }

    if (requiredRole && authState.userRole !== requiredRole) {
      // Redirect if the user's role doesn't match the required role
      return <Navigate to="/" replace />;
    }

    // Render children if authentication and role requirements are met
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
              <PatientDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/grant-access"
          element={
            <ProtectedRoute requiredRole="patient">
              <GrantAccessPage />
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
