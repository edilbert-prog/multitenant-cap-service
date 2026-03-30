import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {storeEncryptedData} from "@/utils/helpers/storageHelper";

interface User {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  roles: string[];
  permissions: string[];
  ClientId?: string;
  RoleId?: string;
  RoleName?: string;
  Email?: string;
  FirstName?: string;
  LastName?: string;
}

interface AuthContextType {
  isAuthenticated: boolean | null;
  user: User | null;
  token: string | null;
  login: (access_token: string, expires_in: number, user: User) => void;
  checkSession: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const getBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) return envUrl;
  const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  return isLocal ? "http://localhost:5200" : window.location.origin;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const login = (access_token: string, expires_in: number, user: User) => {
    sessionStorage.setItem("access_token", access_token);
    sessionStorage.setItem("user", JSON.stringify(user));
    sessionStorage.setItem("token_expires_in", expires_in.toString());

    setIsAuthenticated(true);
    setUser(user);
    setToken(access_token);
  };

  const checkSession = async () => {
    try {
      const storedToken = sessionStorage.getItem("access_token");
      const storedUser = sessionStorage.getItem("user");

      if (!storedToken || !storedUser) {
        window.location.href = `${getBaseUrl()}/api/auth/login`;
        return;
      }

      const userData = JSON.parse(storedUser);
      setIsAuthenticated(true);
      setUser(userData);
      setToken(storedToken);
    } catch {
      sessionStorage.clear();
      window.location.href = `${getBaseUrl()}/api/auth/login`;
    }
  };

  const logout = async () => {
    try {
      const storedToken = sessionStorage.getItem("access_token");
      if (storedToken) {
        const logoutUrl = `${getBaseUrl()}/api/auth/logout`;
        const response = await fetch(logoutUrl, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${storedToken}`,
            Accept: "application/json",
          },
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Logout failed: ${response.status} - ${errorText}`);
        }
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      sessionStorage.clear();
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
      window.location.href = `${getBaseUrl()}/api/auth/login`;
    }
  };
  useEffect(() => {
    if (window.location.pathname === "/a/callback") {
      console.log("Skipping session check - on callback page");
      return;
    }
    checkSession();
  }, []);
  const value: AuthContextType = {
    isAuthenticated,
    user,
    token,
    login,
    checkSession,
    logout,
  };

  return (
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
