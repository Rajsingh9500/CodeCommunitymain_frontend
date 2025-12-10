// frontend/src/api/axios.js
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

console.log("axios baseURL:", `${API_URL}/api`);

const api = axios.create({
  baseURL: `${API_URL}/api`,   // 🔥 CALL BACKEND DIRECTLY
  withCredentials: true,       // 🔥 SEND COOKIES
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
