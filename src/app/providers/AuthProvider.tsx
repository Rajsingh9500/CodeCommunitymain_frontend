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

        if (res.status === 200) {
          const data = await res.json();

          const formatted = {
            ...data.user,
            // socketToken comes from cookie, not backend "user"
            socketToken: document.cookie
              .split("; ")
              .find((row) => row.startsWith("socketToken="))
              ?.split("=")[1] || null,
          };

          setUser(formatted);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Auth load error:", err);
        setUser(null);
      }

      setLoading(false);
    }

    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {/* ⛔ Prevents UI rendering before auth is loaded */}
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
