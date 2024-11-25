import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(() => {
    // Initialize from localStorage for persistence
    const storedState = JSON.parse(localStorage.getItem("authState"));
    return (
      storedState || {
        isAuthenticated: false,
        userRole: null, // 'patient' or 'doctor'
        userAddress: null,
      }
    );
  });

  // Persist authState in localStorage
  useEffect(() => {
    localStorage.setItem("authState", JSON.stringify(authState));
  }, [authState]);

  useEffect(() => {
    // Check if wallet is connected
    const checkWalletConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          if (accounts.length > 0) {
            setAuthState((prevState) => ({
              ...prevState,
              isAuthenticated: true,
              userAddress: accounts[0],
            }));
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error);
        }
      }
    };

    checkWalletConnection();

    // Listen for account changes
    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        setAuthState((prevState) => ({
          ...prevState,
          isAuthenticated: true,
          userAddress: accounts[0],
        }));
      } else {
        logout();
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
    localStorage.removeItem("authState"); // Clear from storage
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
