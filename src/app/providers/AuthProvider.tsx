"use client";

import { createContext, useContext, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadedOnce, setLoadedOnce] = useState(false); // ⭐ prevents duplicate calls

  useEffect(() => {
    if (loadedOnce) return; // ❗ stop multiple calls

    async function loadUser() {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json();
        if (data?.user) setUser(data.user);
      } catch {}

      setLoading(false);
      setLoadedOnce(true); // ❗ never call again
    }

    loadUser();
  }, [loadedOnce]);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
