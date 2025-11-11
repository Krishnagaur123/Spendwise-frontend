import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosConfig from "../util/axiosConfig";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { API_ENDPOINTS } from "../util/apiEndpoints";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setUser } = useAppContext();


  const navigate = useNavigate();

  const onSubmit = async (e) => {

    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      const response = await axiosConfig.post(API_ENDPOINTS.LOGIN, {
        email,
        password,
      });
      const { token, user } = response.data || {};

      if (token) {
        localStorage.setItem("token", token);
        setUser(user || null);
        navigate("/dashboard");
      } else {
        toast.error("Invalid credentials or missing token.");
      }
    } catch (error) {
      console.error("Login failed:", error);
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }

  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Background */}
      <img
        src="/assets/loginimg.png"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover -z-10 opacity-90"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/20 to-white/60 backdrop-blur-sm -z-10" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md bg-white/30 backdrop-blur-xl border border-white/50 shadow-2xl rounded-2xl p-8">
        <h3 className="text-3xl font-semibold text-gray-900 text-center mb-2 drop-shadow-sm">
          Welcome Back
        </h3>
        <p className="text-sm text-gray-700 text-center mb-8">
          Log in to your <span className="font-medium">Spendwise</span> account
        </p>

        <form onSubmit={onSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white/70 focus:bg-white/90 outline-none focus:ring-2 focus:ring-indigo-500 transition"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white/70 focus:bg-white/90 outline-none focus:ring-2 focus:ring-indigo-500 transition pr-10"
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-600 hover:text-indigo-700 focus:outline-none"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Submit button with loader */}
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-800 text-white font-medium py-2.5 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Logging in...
              </>
            ) : (
              "Log in"
            )}
          </button>
        </form>

        <p className="text-sm text-gray-800 text-center mt-6">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-indigo-600 hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
