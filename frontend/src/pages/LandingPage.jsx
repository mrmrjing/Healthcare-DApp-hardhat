import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import WalletConnect from "../components/WalletConnect";
import deployedAddresses from "../artifacts/deployedAddresses.json";
import "../styles/LandingPage.css";

const LandingPage = () => {
  const { authState, login, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { isAuthenticated, userRole } = authState;

  // Automatically redirect authenticated users with a role
  useEffect(() => {
    if (isAuthenticated && userRole) {
      const targetPath =
        userRole === "doctor"
          ? "/doctor/request-access"
          : `/${userRole}/dashboard`;
      console.log("[INFO] Redirecting authenticated user to:", targetPath);
      navigate(targetPath, { replace: true });
    }
  }, [isAuthenticated, userRole, navigate]);

  // Handle admin login
  const handleAdminLogin = async () => {
    try {
      if (!window.ethereum) {
        alert("MetaMask is not detected. Please install MetaMask.");
        console.error("[ERROR] MetaMask not detected.");
        return;
      }

      console.log("[INFO] Requesting wallet connection...");
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const userAddress = accounts[0]; // Connected wallet address
      const adminAddress = deployedAddresses.Deployer.toLowerCase(); // Admin address from JSON

      console.log("[INFO] Wallet Address:", userAddress);
      if (userAddress.toLowerCase() === adminAddress) {
        console.log("[INFO] Admin login successful.");
        login("admin"); // Update AuthContext state to admin
        navigate("/admin/dashboard"); // Redirect to admin dashboard
        alert("Logged in as admin successfully!");
      } else {
        console.warn("[WARN] Unauthorized admin login attempt.");
        alert("You are not authorized to log in as admin.");
      }
    } catch (error) {
      console.error("[ERROR] Admin login failed:", error);
      alert("Failed to log in as admin. Please try again.");
    }
  };

  // Handle logout
  const handleLogout = () => {
    console.log("[INFO] Logging out...");
    logout();
    localStorage.removeItem("walletAddress");
    navigate("/");
  };

  return (
    <div className="landing-page">
      {/* Header Section */}
      <header className="header">
        <div className="header-content">
          <h1>Welcome to HealthConnect</h1>
          <p>
            A secure and modern solution to manage your medical records with
            blockchain technology. Experience privacy, security, and
            accessibility like never before.
          </p>
          <button
            onClick={() => navigate("/learn-more")}
            className="learn-more-button"
          >
            Learn More
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Wallet Connection Section */}
        <section className="wallet-section">
          <h2>Connect Your Wallet</h2>
          <p>Secure your records with blockchain technology.</p>
          <WalletConnect />
        </section>

        {/* Role Selection Section */}
        <section className="role-section">
          <h2>{isAuthenticated ? "Select Your Role" : "Get Started"}</h2>
          <p>
            {isAuthenticated
              ? "You are logged in! Please select your role to proceed."
              : "Sign up or log in to begin your journey."}
          </p>
          <div className="role-buttons">
            {!isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate("/patient/register")}
                  className="role-button patient-button"
                >
                  Sign Up as Patient
                </button>
                <button
                  onClick={() => navigate("/doctor/register")}
                  className="role-button doctor-button"
                >
                  Sign Up as Doctor
                </button>
                <button
                  onClick={handleAdminLogin}
                  className="role-button admin-button"
                >
                  Log In as Admin
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    login("patient");
                    navigate("/patient/dashboard");
                  }}
                  className="role-button patient-button"
                >
                  Patient
                </button>
                <button
                  onClick={() => {
                    login("doctor");
                    navigate("/doctor/request-access");
                  }}
                  className="role-button doctor-button"
                >
                  Doctor
                </button>
                <button
                  onClick={handleLogout}
                  className="role-button logout-button"
                >
                  Log Out
                </button>
              </>
            )}
          </div>
        </section>

        {/* Privacy Section */}
        <section className="privacy-section">
          <h2>Your Privacy Matters</h2>
          <p>
            At HealthConnect, we prioritize your privacy. Your medical data is
            encrypted and accessible only to authorized individuals. Experience
            secure data management powered by blockchain.
          </p>
        </section>
      </main>

      {/* Footer Section */}
      <footer className="footer">
        <p>&copy; 2024 HealthConnect. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
