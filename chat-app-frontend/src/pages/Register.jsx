import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
    avatar: "",
    avatarUrl: "",
  });
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);
    formData.append("password", password);
    if (avatar) formData.append("avatar", avatar);

    try {
      const res = await axios.post(
        "http://localhost:3333/api/auth/register",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      Swal.fire({
        icon: "success",
        title: "Welcome!",
        text: `Registered successfully as ${res.data.user.username}`,
        confirmButtonColor: "#4CAF50",
      }).then(() => navigate("/login"));

      setErrors({
        username: "",
        email: "",
        password: "",
        avatar: "",
        avatarUrl: "",
      });
    } catch (error) {
      if (
        error.response &&
        error.response.data.message === "Username or email already exists"
      ) {
        Swal.fire({
          icon: "error",
          title: "Already Registered",
          text: "This email or username is already registered. Please login.",
          confirmButtonColor: "#f44336",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Registration failed. Please try again!",
          confirmButtonColor: "#f44336",
        });
      }

      if (error.response && error.response.data.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({
          username: "",
          email: "",
          password: "",
          avatar: "",
          avatarUrl: "",
        });
      }
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto backdrop-blur-xl bg-black/50 text-white rounded-3xl shadow-2xl p-10 border border-gray-600 font-mono">
      <h2 className="text-2xl font-bold mb-8 text-center tracking-wide text-cyan-400">
        Register
      </h2>

      <form
        onSubmit={handleRegister}
        encType="multipart/form-data"
        className="flex flex-col gap-6"
      >
        {/* Username */}
        <div>
          <input
            className={`w-full px-5 py-3 rounded-2xl bg-slate-900/80 text-white placeholder-gray-500
          border transition focus:outline-none
          ${
            errors.username
              ? "border-red-500 ring-1 ring-red-500"
              : "border-slate-700 focus:ring-1 focus:ring-cyan-500"
          }`}
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (errors.username) setErrors((p) => ({ ...p, username: "" }));
            }}
            placeholder="Username"
          />
          {errors.username && (
            <p className="text-red-400 text-xs mt-1 font-mono">
              {errors.username}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <input
            type="email"
            className={`w-full px-5 py-3 rounded-2xl bg-slate-900/80 text-white placeholder-gray-500
          border transition focus:outline-none
          ${
            errors.email
              ? "border-red-500 ring-1 ring-red-500"
              : "border-slate-700 focus:ring-1 focus:ring-cyan-500"
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
              ? "border-red-500 ring-1 ring-red-500"
              : "border-slate-700 focus:ring-1 focus:ring-cyan-500"
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

        {/* Avatar */}
        <div>
          <input
            type="file"
            accept="image/*"
            className={`w-full px-4 py-3 rounded-2xl bg-slate-900/80 text-gray-400
          border transition cursor-pointer
          ${
            errors.avatar || errors.avatarUrl
              ? "border-red-500 ring-1 ring-red-500"
              : "border-slate-700 hover:border-cyan-500"
          }`}
            onChange={(e) => {
              setAvatar(e.target.files[0]);
              if (errors.avatar || errors.avatarUrl)
                setErrors((p) => ({ ...p, avatar: "", avatarUrl: "" }));
            }}
          />

          {(errors.avatar || errors.avatarUrl) && (
            <p className="text-red-400 text-xs mt-1 font-mono">
              {errors.avatar || errors.avatarUrl}
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
          🚀 Create Account
        </button>
      </form>
    </div>
  );
}
