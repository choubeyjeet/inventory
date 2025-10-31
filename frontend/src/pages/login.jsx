import React, { useState } from "react";
import { FaBox, FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance"; // 👈 custom axios setup
import { ToastContainer, toast } from "react-toastify";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  // 🌗 Toggle dark mode
  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // 🧠 Form validation
  const validate = () => {
    let valid = true;
    let newErrors = {};

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Invalid email format";
      valid = false;
    }

    if (!form.password.trim()) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // 🚀 Handle Login Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validate()) {
      try {
        const { data } = await axiosInstance.post("/auth/login", form);

        // ✅ Store tokens securely
        localStorage.setItem("access_token", data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem("refresh_token", data.refreshToken);
        }

        toast.success("Login successful! Redirecting...");
        setTimeout(() => navigate("/dashboard"), 1500);
      } catch (error) {
        toast.error(error?.response?.data?.message || "Login failed");
      }
    }
  };

  // ✅ Handle input changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-lightBg dark:bg-neutral-darkBg transition-colors duration-300">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="flex-grow flex items-center justify-center p-6">
        <div className="flex flex-col md:flex-row bg-neutral-lightCard dark:bg-neutral-darkCard shadow-xl rounded-2xl overflow-hidden max-w-4xl w-full">
          {/* Left Branding */}
          <div className="hidden md:flex flex-col items-center justify-center bg-primary text-white p-10 w-1/2">
            <FaBox className="text-5xl mb-4" />
            <h1 className="text-3xl font-bold mb-2">Welcome Back!</h1>
            <p className="text-sm text-blue-100">
              Manage your stock, orders, and analytics efficiently.
            </p>
          </div>

          {/* Right Form */}
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <h2 className="text-2xl md:text-3xl font-semibold text-center text-neutral-lightText dark:text-neutral-darkText mb-6">
              Login to your account
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-neutral-lightText dark:text-neutral-darkText mb-1">
                  Email Address
                </label>
                <div className="flex items-center bg-neutral-lightBg dark:bg-neutral-darkBg border border-secondary-light dark:border-secondary-dark rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-primary-light">
                  <FaUser className="text-secondary-dark mr-2" />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full bg-transparent focus:outline-none text-neutral-lightText dark:text-neutral-darkText placeholder-secondary-light"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm italic text-red-500 mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-neutral-lightText dark:text-neutral-darkText mb-1">
                  Password
                </label>
                <div className="flex items-center bg-neutral-lightBg dark:bg-neutral-darkBg border border-secondary-light dark:border-secondary-dark rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-primary-light">
                  <FaLock className="text-secondary-dark mr-2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full bg-transparent focus:outline-none text-neutral-lightText dark:text-neutral-darkText placeholder-secondary-light"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="ml-2 text-secondary-dark hover:text-primary-dark"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm italic text-red-500 mt-1">{errors.password}</p>
                )}
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-dark text-white py-2 rounded-lg transition-colors font-medium"
              >
                Login
              </button>
          <div className="text-center mt-4">
                <p className="text-sm text-secondary-light dark:text-secondary-dark">
                  Don't have an account?{" "}
                  <span
                    onClick={() => navigate("/signup")}
                    className="text-primary hover:underline cursor-pointer"
                  >
                    Sign Up
                  </span>
                </p>
              </div>
            </form>
          
          </div>
        </div>
      </div>
    </div>
  );
}
