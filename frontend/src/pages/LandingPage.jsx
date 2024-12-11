import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import WalletConnect from "../components/WalletConnect";
import deployedAddresses from "../artifacts/deployedAddresses.json";
import "../styles/LandingPage.css";

const LandingPage = () => {
  const { authState, login } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (authState.isAuthenticated && authState.userRole) {
      const targetPath =
        authState.userRole === "doctor"
          ? "/doctor/request-access"
          : `/patient/dashboard`;
      navigate(targetPath, { replace: true });
    }
  }, [authState, navigate]);

  const handleAdminLogin = async () => {
    if (!window.ethereum) {
      alert("MetaMask is not detected. Please install MetaMask.");
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const userAddress = accounts[0];
      const adminAddress = deployedAddresses.Deployer.toLowerCase();

      if (userAddress.toLowerCase() === adminAddress) {
        login("admin");
        navigate("/admin/dashboard");
        alert("Logged in as admin successfully!");
      } else {
        alert("You are not authorized to log in as admin.");
      }
    } catch (error) {
      alert("Failed to log in as admin. Please try again.");
    }
  };

  return (
    <div className="landing-page">
      <header className="header">
        <h1>Welcome to HealthConnect</h1>
        <p>
          A secure and modern solution to manage your medical records with
          blockchain technology. Experience privacy, security, and
          accessibility like never before.
        </p>
      </header>

      <main className="main-content">
        <section className="wallet-section">
          <h2>Connect Your Wallet</h2>
          <WalletConnect />
          {/* Show "Log In as Admin" button only if the user is not authenticated */}
          {!authState.isAuthenticated && (
            <button onClick={handleAdminLogin} className="role-button admin-button">
              Log In as Admin
            </button>
          )}
        </section>
        <div className="break">
          <hr className="break-section line"></hr>
          <p className="break-word"> Do not have an account? </p>
          <hr className="break-section line"></hr>
        </div>

        <section className="role-section">
          <h2>{authState.isAuthenticated ? "You are logged in!" : "Get Started"}</h2>
          <div className="role-buttons">
            {!authState.isAuthenticated && (
              <>
                <button onClick={() => navigate("/patient/register")} className="role-button">
                  Sign Up as Patient
                </button>
                <button onClick={() => navigate("/doctor/register")} className="role-button">
                  Sign Up as Doctor
                </button>
              </>
            )}
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>&copy; 2024 HealthConnect. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
