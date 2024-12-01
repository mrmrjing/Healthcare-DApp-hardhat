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
      navigate(targetPath, { replace: true });
    }
  }, [isAuthenticated, userRole, navigate]);
  

  const handleLogout = () => {
    logout();
    localStorage.removeItem("walletAddress");
    navigate("/");
  };

  const handleAdminLogin = async () => {
    try {
      if (!window.ethereum) {
        alert("MetaMask is not detected. Please install MetaMask.");
        return;
      }

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const userAddress = accounts[0]; // Get the connected wallet address

      const adminAddress = deployedAddresses.Deployer; // Admin address from the deployedAddresses.json file

      if (userAddress.toLowerCase() === adminAddress.toLowerCase()) {
        login("admin"); // Update the AuthContext state to admin
        navigate("/admin/dashboard"); // Redirect to the admin dashboard
        alert("Logged in as admin successfully!");
      } else {
        alert("You are not authorized to log in as admin.");
      }
    } catch (error) {
      console.error("Error during admin login:", error);
      alert("Failed to log in as admin. Please try again.");
    }
  };

  return (
    <div className="landing-page">
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

      <main className="main-content">
        <section className="wallet-section">
          <h2>Connect Your Wallet</h2>
          <p>Secure your records with blockchain technology.</p>
          <WalletConnect />
        </section>

        <section className="role-section">
          <h2>{authState.isAuthenticated ? "Select Your Role" : "Get Started"}</h2>
          <p>
            {authState.isAuthenticated
              ? "You are logged in! Please select your role to proceed."
              : "Sign up or log in to begin your journey."}
          </p>
          <div className="role-buttons">
            {!authState.isAuthenticated ? (
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
                  onClick={handleAdminLogin} // Admin login handler
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

        <section className="privacy-section">
          <h2>Your Privacy Matters</h2>
          <p>
            At HealthConnect, we prioritize your privacy. Your medical data is
            encrypted and accessible only to authorized individuals. Experience
            secure data management powered by blockchain.
          </p>
        </section>
      </main>

      <footer className="footer">
        <p>&copy; 2024 HealthConnect. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
