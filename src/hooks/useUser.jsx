import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosConfig from "../util/axiosConfig";
import { useAppContext } from "../context/AppContext.jsx";
import { API_ENDPOINTS } from "../util/apiEndpoints.js";

/**
 * Fetches the authenticated user's profile on mount and populates AppContext.
 * On 401 (token missing or expired), clears state and redirects to login.
 * Uses an `isMounted` flag to prevent state updates after unmount.
 */
export const useUser = () => {
  const navigate = useNavigate();
  const { user, setUser, clearUser } = useAppContext();

  useEffect(() => {
    let isMounted = true;

    const fetchUserInfo = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        if (isMounted) setUser?.(null);
        return;
      }

      try {
        // axiosConfig attaches the Authorization header via request interceptor
        const { data } = await axiosConfig.get(API_ENDPOINTS.GET_USER_INFO);
        if (isMounted) {
          setUser?.(data?.user || data || null);
        }
      } catch (error) {
        console.log("Failed to fetch user info", error);
        if (isMounted) {
          clearUser();
          navigate("/login");
        }
      }
    };

    fetchUserInfo();
    return () => { isMounted = false; };
  }, [setUser, navigate]);

  return { user, setUser, clearUser };
};
