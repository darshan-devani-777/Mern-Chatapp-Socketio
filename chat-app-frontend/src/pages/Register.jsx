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
    <div className="w-full max-w-md mx-auto mt-10 bg-gray-800 text-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-semibold mb-4 text-center">Register</h2>
      <form
        onSubmit={handleRegister}
        className="flex flex-col gap-4"
        encType="multipart/form-data"
      >
        {/* Username Input */}
        <div>
          <input
            className={`p-2 rounded-lg bg-gray-700 placeholder-gray-400 w-full ${
              errors.username ? "border-1 border-red-700" : ""
            }`}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
          />
          {errors.username && (
            <p className="text-red-500 text-sm mt-1">{errors.username}</p>
          )}
        </div>

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

        {/* Avatar Input */}
        <div>
          <input
            type="file"
            accept="image/*"
            className={`p-2 bg-gray-700 rounded-lg text-gray-300 w-full ${
              errors.avatar || errors.avatarUrl ? "border-1 border-red-700" : ""
            }`}
            onChange={(e) => setAvatar(e.target.files[0])}
          />
          {errors.avatar && (
            <p className="text-red-500 text-sm mt-1">{errors.avatar}</p>
          )}
          {errors.avatarUrl && (
            <p className="text-red-500 text-sm mt-1">{errors.avatarUrl}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 cursor-pointer"
        >
          Register
        </button>
      </form>
    </div>
  );
}
