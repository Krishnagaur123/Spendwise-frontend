import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosConfig from "../util/axiosConfig"; // your configured axios instance
import { useAppContext } from "../context/AppContext.jsx";
import { API_ENDPOINTS } from "../util/apiEndpoints.js";

export const useUser = () => {
  const navigate = useNavigate();
  const { user, setUser ,clearUser} = useAppContext();



  useEffect(() => {
    let isMounted = true;

    const fetchUserInfo = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        if (isMounted) setUser?.(null);
        return;
      }

      try {
        
        // axiosConfig should already attach Authorization header via interceptor
        const { data } = await axiosConfig.get(API_ENDPOINTS.GET_USER_INFO); // adjust endpoint
        if (isMounted) {
          const u = data?.user || data || null;
          setUser?.(u);
        }
      } catch (error) {
        console.log("Failed to fetch the user info", error);
        if (isMounted) {
          clearUser();
          navigate("/login");
        }
      }
    };

    fetchUserInfo();

    return () => {
      isMounted = false;
    };
  }, [setUser, navigate]);

  return { user, setUser, clearUser };
};
