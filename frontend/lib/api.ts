// lib/api.ts
import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8000",
});

let unauthorizedDispatchInFlight = false;

// Add a request interceptor to include the token in the Authorization header
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 && typeof window !== "undefined") {
      if (!unauthorizedDispatchInFlight) {
        unauthorizedDispatchInFlight = true;
        window.dispatchEvent(new Event("auth:unauthorized"));
        setTimeout(() => {
          unauthorizedDispatchInFlight = false;
        }, 1000);
      }
    }
    return Promise.reject(error);
  }
);

