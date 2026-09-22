
import React, { createContext, useContext, useEffect, useState } from "react";
import axiosInstance, { setToken } from "../config/axios";
import { ContextError } from "../Errors/error";
import { getWorkspaceAdminProfile } from "../services/workspaceAdminServices";

interface AuthContextType {
  accessToken: string | null;
  setAccessToken: React.Dispatch<React.SetStateAction<string | null>>;
  userRole: string | null;
  setUserRole: React.Dispatch<React.SetStateAction<string | null>>;
  workspaceId: string | null;
  setWorkspaceId: React.Dispatch<React.SetStateAction<string | null>>;
  isAuthenticated: boolean; 
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const extractWorkspaceId = (token: string | null): string | null => {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload));
    return decoded?.workspaceId ?? null;
  } catch {
    return null;
  }
};

const AuthContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
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

          // Fetch workspaceId for workspace admins, or extract from token payload for members
          if (role === "workspaceadmin") {
            try {
              const profileRes = await getWorkspaceAdminProfile();
              setWorkspaceId(profileRes.data?.data?.workspaceId ?? null);
            } catch {
              setWorkspaceId(null);
            }
          } else {
            setWorkspaceId(extractWorkspaceId(token));
          }
        }
      } catch {
        setToken(null);
        setAccessToken(null);
        setUserRole(null);
        setWorkspaceId(null);
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
        setWorkspaceId(null);
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
        workspaceId,
        setWorkspaceId,
        isAuthenticated,
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
    throw new ContextError("useAuth must be used inside AuthContextProvider")
  }
  return context;
};

export default AuthContextProvider;