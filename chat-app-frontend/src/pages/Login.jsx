import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Swal from "sweetalert2";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrors({ email: "", password: "" });

    let hasError = false;
    let newErrors = { email: "", password: "" };

    if (!email) {
      newErrors.email = "Email is required";
      hasError = true;
    }

    if (!password) {
      newErrors.password = "Password is required";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please fill in all the required fields.",
        confirmButtonColor: "#f44336",
      });
      return;
    }

    try {
      const res = await axios.post("http://localhost:3333/api/auth/login", {
        email,
        password,
      });

      login(res.data.token, {
        username: res.data.user.username,
        email: res.data.user.email,
        avatarUrl: res.data.user.avatarUrl,
      });

      Swal.fire({
        icon: "success",
        title: "Login Successful!",
        text: `Welcome back, ${res.data.user.username}`,
        confirmButtonColor: "#4CAF50",
      }).then(() => {
        navigate("/chat");
      });
    } catch (err) {
      if (err.response && err.response.data.message) {
        const errorMessage = err.response.data.message;

        if (errorMessage === "User not found") {
          Swal.fire({
            icon: "error",
            title: "Login Failed",
            text: `No user found with the email: ${email}`,
            confirmButtonColor: "#f44336",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Login Failed",
            text: errorMessage,
            confirmButtonColor: "#f44336",
          });
        }

        if (errorMessage === "Invalid credentials") {
          setEmail("");
          setPassword("");
        }
      }
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto backdrop-blur-xl bg-black/50 text-white rounded-3xl shadow-2xl p-10 border border-gray-600 font-mono">
      <h2 className="text-2xl font-bold mb-8 text-center tracking-wide text-cyan-400">
        Login
      </h2>

      <form onSubmit={handleLogin} className="flex flex-col gap-6">
        {/* Email */}
        <div>
          <input
            type="email"
            className={`w-full px-5 py-3 rounded-2xl bg-slate-900/80 text-white placeholder-gray-500
          border transition focus:outline-none text-md
          ${
            errors.email
              ? "border-red-500 ring-0 ring-red-500"
              : "border-slate-700 focus:ring-2 focus:ring-cyan-500"
          }`}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((p) => ({ ...p, email: "" }));
            }}
            placeholder="Email address"
          />
          {errors.email && (
            <p className="text-red-400 text-xs mt-1 font-mono">
              {errors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            className={`w-full px-5 py-3 rounded-2xl bg-slate-900/80 text-white placeholder-gray-500
          border transition focus:outline-none
          ${
            errors.password
              ? "border-red-500 ring-0 ring-red-500"
              : "border-slate-700 focus:ring-2 focus:ring-cyan-500"
          }`}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((p) => ({ ...p, password: "" }));
            }}
            placeholder="Password"
          />

          <span
            className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-cyan-400 transition"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>

          {errors.password && (
            <p className="text-red-400 text-xs mt-1 font-mono">
              {errors.password}
            </p>
          )}
        </div>

        {/* Button */}
        <button
          type="submit"
          className="mt-2 py-3 rounded-2xl text-white text-lg font-semibold
        bg-gradient-to-r from-cyan-600 to-blue-700
        hover:from-cyan-500 hover:to-blue-600
        shadow-lg shadow-cyan-500/30
        transition duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
        >
          🚀 Login
        </button>
      </form>
    </div>
  );
}
