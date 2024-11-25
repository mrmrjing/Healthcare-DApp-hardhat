import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import WalletConnect from "../components/WalletConnect";
import "../styles/LandingPage.css";

const LandingPage = () => {
  const { authState, login, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Automatically redirect authenticated users with a role
  useEffect(() => {
    if (authState.isAuthenticated) {
      navigate(`/${authState.userRole}/dashboard`, { replace: true });
    }
  }, [authState, navigate]);
  

  const handleLogout = () => {
    logout();
    localStorage.removeItem("walletAddress");
    navigate("/");
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
                  onClick={() => navigate("/patient/login")}
                  className="role-button patient-login"
                >
                  Log In as Patient
                </button>
                <button
                  onClick={() => navigate("/doctor/login")}
                  className="role-button doctor-login"
                >
                  Log In as Doctor
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
                    navigate("/doctor/dashboard");
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
