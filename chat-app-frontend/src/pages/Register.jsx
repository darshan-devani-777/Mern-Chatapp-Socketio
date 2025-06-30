import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from 'sweetalert2';

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(null);
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
        icon: 'success',
        title: 'Welcome!',
        text: `Registered successfully as ${res.data.user.username}`,
        confirmButtonColor: '#4CAF50',
      }).then(() => navigate("/login"));
  
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Registration failed. Please try again!',
        confirmButtonColor: '#f44336',
      });
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
        <input
          className="p-3 rounded-lg bg-gray-700 placeholder-gray-400"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
        />
        <input
          type="email"
          className="p-3 rounded-lg bg-gray-700 placeholder-gray-400"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          type="password"
          className="p-3 rounded-lg bg-gray-700 placeholder-gray-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <input
          type="file"
          accept="image/*"
          className="p-2 bg-gray-700 rounded-lg text-gray-300"
          onChange={(e) => setAvatar(e.target.files[0])}
        />
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
