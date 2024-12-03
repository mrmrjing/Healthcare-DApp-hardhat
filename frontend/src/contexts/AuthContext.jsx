import React, { createContext, useState, useEffect } from "react";
import { isProviderVerified, isAuthorized } from "../services/contractService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(() => {
    const storedState = JSON.parse(localStorage.getItem("authState"));
    return (
      storedState || {
        isAuthenticated: false,
        userRole: null,
        userAddress: null,
      }
    );
  });

  useEffect(() => {
    if (!localStorage.getItem("initialized")) {
      localStorage.removeItem("authState");
      localStorage.setItem("initialized", "true");
      setAuthState({
        isAuthenticated: false,
        userRole: null,
        userAddress: null,
      });
    }
  }, []);
  
  
  
  useEffect(() => {
    localStorage.setItem("authState", JSON.stringify(authState));
  }, [authState]);

  useEffect(() => {
    const autoConnectWallet = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts.length > 0) {
            const userAddress = accounts[0];
            const userRole = await fetchUserRole(userAddress);
            if (userRole) {
              setAuthState({
                isAuthenticated: true,
                userRole,
                userAddress,
              });
            }
          }
        } catch (error) {
          console.error("Error auto-connecting wallet:", error);
        }
      }
    };

    autoConnectWallet();

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length > 0) {
        const userAddress = accounts[0];
        const userRole = await fetchUserRole(userAddress);
    
        if (userRole) {
          setAuthState({
            isAuthenticated: true,
            userRole,
            userAddress,
          });
    
          // Redirect based on user role
          if (userRole === "doctor") {
            window.location.href = "/doctor/request-access"; // Redirect doctors
          } else if (userRole === "patient") {
            window.location.href = "/patient/dashboard"; // Redirect patients
          }
        } else {
          // Log out if the address doesn't match any role
          logout();
        }
      } else {
        logout(); // Log out if no accounts available
      }
    };    

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      }
    };
  }, []);

  const fetchUserRole = async (address) => {
    try {
      const isVerifiedProvider = await isProviderVerified(address);
      if (isVerifiedProvider) return "doctor";

      const isRegisteredPatient = await isAuthorized(address, address);
      if (isRegisteredPatient) return "patient";

      return null;
    } catch (error) {
      console.error("Error fetching user role:", error);
      return null;
    }
  };

  const login = (role) => {
    setAuthState((prevState) => ({
      ...prevState,
      isAuthenticated: true,
      userRole: role,
    }));
  };

  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      userRole: null,
      userAddress: null,
    });
    localStorage.removeItem("authState");
  };

  return (
    <AuthContext.Provider value={{ authState, setAuthState, login, logout }}>
      {children}
    </AuthContext.Provider>

  );
};
