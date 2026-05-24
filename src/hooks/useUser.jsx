import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosConfig from "../util/axiosConfig";
import { useAppContext } from "../context/AppContext.jsx";
import { API_ENDPOINTS } from "../util/apiEndpoints.js";

/**
 * Fetches the authenticated user's profile on mount and populates AppContext.
 * Uses session-based auth (JSESSIONID cookie sent automatically via withCredentials).
 * On 401, clears state and redirects to /login.
 * Uses an `isMounted` flag to prevent state updates after unmount.
 */
export const useUser = () => {
  const navigate = useNavigate();
  const { user, setUser, clearUser } = useAppContext();

  useEffect(() => {
    let isMounted = true;

    const fetchUserInfo = async () => {
      // Don't attempt profile fetch on auth pages — avoids redirect loops
      if (["/login", "/signup"].includes(window.location.pathname)) return;

      try {
        // JWT Bearer is sent automatically by axiosConfig request interceptor.
        // JSESSIONID cookie is also sent via withCredentials for session-based clients.
        const { data } = await axiosConfig.get(API_ENDPOINTS.GET_USER_INFO);
        if (isMounted) {
          setUser?.(data?.user || data || null);
        }
      } catch (error) {
        console.log("Failed to fetch user info", error);
        if (isMounted) {
          clearUser?.();
          navigate("/login");
        }
      }
    };

    fetchUserInfo();
    return () => { isMounted = false; };
  }, [setUser, navigate]);

  return { user, setUser, clearUser };
};
