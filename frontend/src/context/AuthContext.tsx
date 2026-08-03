// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import axiosInstance, { setToken } from "../config/axios";

interface AuthContextType {
  accessToken: string | null;
  setAccessToken: React.Dispatch<React.SetStateAction<string | null>>;
  userRole: string | null;
  setUserRole: React.Dispatch<React.SetStateAction<string | null>>;
  isAuthenticated: boolean; 
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AuthContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await axiosInstance.post("/api/auth/refresh");
        if (res.data && res.data.success) {
          const token = res.data.data.accessToken;
          const role = res.data.data.userRole;
          
          setToken(token);
          setAccessToken(token); 
          setUserRole(role || null);
        }
      } catch (err) {
        setToken(null);
        setAccessToken(null);
        setUserRole(null);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);
  useEffect(() => {
    const handleLogoutEvent = (e: StorageEvent) => {
      if (e.key === "logout") {
        setToken(null);
        setAccessToken(null);
        setUserRole(null);
      }
    };
    window.addEventListener("storage", handleLogoutEvent);
    return () => window.removeEventListener("storage", handleLogoutEvent);
  }, []);

  const isAuthenticated = !!accessToken; 

  return (
    <AuthContext.Provider 
      value={{ 
        accessToken, 
        setAccessToken, 
        userRole, 
        setUserRole, 
        isAuthenticated ,
        isLoading
      }}
    >
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthContextProvider");
  }
  return context;
};

export default AuthContextProvider;