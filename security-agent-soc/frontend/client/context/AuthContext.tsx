import { createContext, useContext, useEffect, useState } from "react";

interface User {
  email: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, username: string) => void;
  signup: (email: string, username: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("sentinel_user");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const login = (email: string, username: string) => {
    const newUser = { email, username };
    setUser(newUser);
    localStorage.setItem("sentinel_user", JSON.stringify(newUser));
  };

  const signup = (email: string, username: string) => {
    const newUser = { email, username };
    setUser(newUser);
    localStorage.setItem("sentinel_user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("sentinel_user");
  };

  const isAuthenticated = user !== null;

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
