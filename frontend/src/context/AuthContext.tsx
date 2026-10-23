
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import axiosInstance, { setToken } from "../config/axios";
import { ContextError } from "../Errors/error";
import { getWorkspaceAdminProfile } from "../services/workspaceAdminServices";
import { getMemberWorkspaces, switchMemberWorkspace } from "../services/workspaceServices";

export interface WorkspaceOption {
  _id: string;
  workspaceName: string;
  slug?: string;
}

interface AuthContextType {
  accessToken: string | null;
  username: string | null;
  setAccessToken: React.Dispatch<React.SetStateAction<string | null>>;
  userRole: string | null;
  setUserRole: React.Dispatch<React.SetStateAction<string | null>>;
  workspaceId: string | null;
  setWorkspaceId: React.Dispatch<React.SetStateAction<string | null>>;
  workspaceOptions: WorkspaceOption[];
  setWorkspaceOptions: React.Dispatch<React.SetStateAction<WorkspaceOption[]>>;
  loadMemberWorkspaces: () => Promise<WorkspaceOption[]>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
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

const extractUsername = (token: string | null): string | null => {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const bytes = Uint8Array.from(atob(paddedBase64), (character) => character.charCodeAt(0));
    const decoded = JSON.parse(new TextDecoder().decode(bytes));
    return typeof decoded?.username === "string" && decoded.username.trim()
      ? decoded.username.trim()
      : null;
  } catch {
    return null;
  }
};

const AuthContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaceOptions, setWorkspaceOptions] = useState<WorkspaceOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const username = useMemo(() => extractUsername(accessToken), [accessToken]);

  const loadMemberWorkspaces = useCallback(async () => {
    const response = await getMemberWorkspaces();
    const workspaces = (response?.data?.workspaces ?? []) as WorkspaceOption[];
    setWorkspaceOptions(workspaces);
    return workspaces;
  }, []);

  const switchWorkspace = useCallback(async (nextWorkspaceId: string) => {
    const response = await switchMemberWorkspace(nextWorkspaceId);
    const data = response?.data;
    if (!data?.accessToken || !data?.workspaceId) {
      throw new Error("Workspace switch did not return a valid session");
    }

    setToken(data.accessToken);
    setAccessToken(data.accessToken);
    setWorkspaceId(data.workspaceId);
  }, []);

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

          const tokenWorkspaceId = res.data.data.workspaceId ?? extractWorkspaceId(token);
          if (role === "workspaceadmin") {
            try {
              const profileRes = await getWorkspaceAdminProfile();
              setWorkspaceId(profileRes.data?.data?.workspaceId ?? null);
            } catch {
              setWorkspaceId(null);
            }
          } else if (role === "member") {
            setWorkspaceId(tokenWorkspaceId);
            try {
              await loadMemberWorkspaces();
            } catch {
              setWorkspaceOptions([]);
            }
          } else {
            setWorkspaceId(tokenWorkspaceId);
            setWorkspaceOptions([]);
          }
        }
      } catch {
        setToken(null);
        setAccessToken(null);
        setUserRole(null);
        setWorkspaceId(null);
        setWorkspaceOptions([]);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, [loadMemberWorkspaces]);
  useEffect(() => {
    const handleLogoutEvent = (e: StorageEvent) => {
      if (e.key === "logout") {
        setToken(null);
        setAccessToken(null);
        setUserRole(null);
        setWorkspaceId(null);
        setWorkspaceOptions([]);
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
        username,
        setAccessToken, 
        userRole, 
        setUserRole,
        workspaceId,
        setWorkspaceId,
        workspaceOptions,
        setWorkspaceOptions,
        loadMemberWorkspaces,
        switchWorkspace,
        isAuthenticated,
        isLoading
      }}
    >
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new ContextError("useAuth must be used inside AuthContextProvider")
  }
  return context;
};

export default AuthContextProvider;
