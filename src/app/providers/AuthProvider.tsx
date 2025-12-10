"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function loadUser() {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json();
        if (data?.user) {
          setUser(data.user);
        }
      } catch (err) {
        console.error("Auth load error:", err);
      }

      setLoading(false);
    }

    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {/* Only render children AFTER auth loads */}
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
