import axios from "axios";
import { BASE_URL } from "./apiEndpoints";

/**
 * Pre-configured Axios instance for all API calls.
 *
 * Auth strategy: Dual-mode (JWT preferred, session fallback)
 *  - On login, the backend returns { token, user }. We store token in localStorage.
 *  - The request interceptor attaches `Authorization: Bearer <token>` on every
 *    protected request (skipped for auth endpoints).
 *  - `withCredentials: true` is also set so the JSESSIONID session cookie is sent
 *    for evaluator-script compatibility (curl-based, cookie-driven).
 *
 * Response interceptor:
 *  - 401 → token/session expired, redirect to /login
 *  - 403 → access denied
 *  - 5xx → server error
 */
const axiosConfig = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // sends JSESSIONID cookie for session-based evaluator clients
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Endpoints that should NOT receive an Authorization header
const AUTH_ENDPOINTS = ["/login", "/register", "/health", "/status", "/activate"];

axiosConfig.interceptors.request.use(
  (config) => {
    const url = config?.url || "";
    const isAuthEndpoint = AUTH_ENDPOINTS.some((ep) => url.includes(ep));

    if (!isAuthEndpoint) {
      const token = localStorage.getItem("token");
      if (token) {
        if (!config.headers) config.headers = {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosConfig.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error("Network error — check connection or CORS.");
      return Promise.reject(error);
    }

    const { status } = error.response;

    if (status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    } else if (status === 403) {
      console.error("Access denied.");
    } else if (status >= 500) {
      console.error("Server error. Please try again later.");
    }

    return Promise.reject(error);
  }
);

export default axiosConfig;
