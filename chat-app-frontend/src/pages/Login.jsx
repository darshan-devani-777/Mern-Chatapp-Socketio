import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Swal from "sweetalert2";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

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
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: "Please provide a valid Email or Password",
        confirmButtonColor: "#f44336",
      });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mt-10 bg-gray-800 text-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-semibold mb-4 text-center">Login</h2>
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <input
          type="email"
          className="p-3 rounded-lg bg-gray-700 placeholder-gray-400"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          className="p-3 rounded-lg bg-gray-700 placeholder-gray-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
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
