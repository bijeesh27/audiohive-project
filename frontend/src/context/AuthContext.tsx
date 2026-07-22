// src/context/AuthContext.tsx
import React, { createContext, useContext, useState } from "react";

interface AuthContextType {
  accessToken: string | null;
  setAccessToken: React.Dispatch<React.SetStateAction<string | null>>;
  userRole: string | null;
  setUserRole: React.Dispatch<React.SetStateAction<string | null>>;
  isAuthenticated: boolean; // We add this to make checking easier
}

const AuthContext = createContext<AuthContextType | null>(null);

const AuthContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const isAuthenticated = !!accessToken; 

  return (
    <AuthContext.Provider 
      value={{ 
        accessToken, 
        setAccessToken, 
        userRole, 
        setUserRole, 
        isAuthenticated 
      }}
    >
      {children}
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