import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosConfig from "../util/axiosConfig";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { validateEmail } from "../util/validation";
import { API_ENDPOINTS } from "../util/apiEndpoints";
import AvatarPicker from "../components/AvatarPicker"; // use the new picker

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");

  // URL returned by AvatarPicker (already uploaded to Cloudinary)
  const [profileImageUrl, setProfileImageUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      toast.error("Please fill all fields");
      setLoading(false);
      return;
    }
    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        fullName,
        email,
        password,
        profileImageUrl: profileImageUrl || undefined,
      };

      const response = await axiosConfig.post(API_ENDPOINTS.REGISTER, payload);

      if (response.status === 201 || response.status === 200) {
        toast.success("Profile created successfully.");
        navigate("/login");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Signup failed. Please try again.";
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
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/20 to-white/60 backdrop-blur-sm -z-10" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md bg-white/30 backdrop-blur-xl border border-white/50 shadow-2xl rounded-2xl p-8">
        <h3 className="text-3xl font-semibold text-gray-900 text-center mb-2 drop-shadow-sm">
          Create An Account
        </h3>
        <p className="text-sm text-gray-700 text-center mb-6">
          Track your money with <span className="font-medium">Spendwise</span> now!
        </p>

        <form onSubmit={onSubmit} className="space-y-5">
          {/* Avatar */}
          <div className="flex justify-center mb-2">
            <AvatarPicker
              value={profileImageUrl}
              onChange={setProfileImageUrl}
              disabled={loading}
            />
          </div>

          {/* Full name */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white/70 focus:bg-white/90 outline-none focus:ring-2 focus:ring-indigo-500 transition"
              placeholder="John Doe"
              autoComplete="name"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Email</label>
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
            <label className="block text-sm font-medium text-gray-800 mb-1">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white/70 focus:bg-white/90 outline-none focus:ring-2 focus:ring-indigo-500 transition pr-10"
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-600 hover:text-indigo-700 focus:outline-none"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-800 text-white font-medium py-2.5 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating...
              </>
            ) : (
              "Sign up"
            )}
          </button>
        </form>

        <p className="text-sm text-gray-800 text-center mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 hover:underline font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
