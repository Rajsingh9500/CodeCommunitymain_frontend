"use client";

import { useEffect, useState } from "react";

export default function TestPage() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/test`)
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => setMessage("❌ Failed to connect backend"));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <h1 className="text-2xl font-bold">
        {message || "Loading..."}
      </h1>
    </div>
  );
}
