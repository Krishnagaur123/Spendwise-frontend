import axios from "axios";
import { BASE_URL } from "./apiEndpoints"; 

const axiosConfig = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const excludeEndpoints = ["/login", "/register", "/status", "/activate", "/health"];

axiosConfig.interceptors.request.use(
  (config) => {
    const url = config?.url || "";
    const shouldSkipToken = excludeEndpoints.some((endpoint) => url.includes(endpoint));

    if (!shouldSkipToken) {
      const accessToken = localStorage.getItem("token");
      if (accessToken) {
        if (!config.headers) config.headers = {};
        config.headers.Authorization = `Bearer ${accessToken}`;
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
      console.error("Network error. Please check the connection.");
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
    } else if (error.code === "ECONNABORTED") {
      console.error("Request timeout. Please try again.");
    }

    return Promise.reject(error);
  }
);

export default axiosConfig;
