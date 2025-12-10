// frontend/src/api/axios.js
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  console.error("❌ NEXT_PUBLIC_API_URL is missing! Make sure it's set in Vercel");
}

console.log("axios baseURL:", `${API_URL}/api`);

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
