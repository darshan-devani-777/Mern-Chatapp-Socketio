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
    <div className="w-full max-w-md mx-auto mt-10 bg-gray-800 text-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-semibold mb-4 text-center">Login</h2>
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        {/* Email Input */}
        <div>
          <input
            type="email"
            className={`p-2 rounded-lg bg-gray-700 placeholder-gray-400 w-full ${
              errors.email ? "border-1 border-red-700" : ""
            }`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        {/* Password Input with Show/Hide Feature */}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            className={`p-2 rounded-lg bg-gray-700 placeholder-gray-400 w-full ${
              errors.password ? "border-1 border-red-700" : ""
            }`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
          <span
            className="absolute right-3 top-3 cursor-pointer"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <FaEyeSlash className="text-gray-400" />
            ) : (
              <FaEye className="text-gray-400" />
            )}
          </span>
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 cursor-pointer"
        >
          Login
        </button>
      </form>
    </div>
  );
}
