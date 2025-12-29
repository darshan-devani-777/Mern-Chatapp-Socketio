import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function Profile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [editMode, setEditMode] = useState(false);
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(null);

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!username && !email && !password && !avatar) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please provide at least one field to update.",
        confirmButtonColor: "#f44336",
      });
      return;
    }

    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);
    if (password) formData.append("password", password);
    if (avatar) formData.append("avatar", avatar);

    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:3333/api/auth/update`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);

        setUsername(data.user.username);
        setEmail(data.user.email);
        setPassword("");
        setAvatar(null);
        setEditMode(false);

        Swal.fire({
          icon: "success",
          title: "Profile Updated Successfully!",
          text: "Your profile has been updated successfully.",
          confirmButtonColor: "#4CAF50",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text:
            data.message || "Failed to update your profile. Please try again.",
          confirmButtonColor: "#f44336",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Something Went Wrong",
        text: "An error occurred while updating your profile. Please try again.",
        confirmButtonColor: "#f44336",
      });
      console.error(error);
    }
  };

  if (!user) {
    return <div className="text-center text-white mt-10">User Not Found</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="relative w-full max-w-md bg-black/50 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 text-white">
        {/* Close */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white flex items-center justify-center transition cursor-pointer"
        >
          ✕
        </button>

        {/* VIEW MODE */}
        {!editMode ? (
          <>
            <div className="flex flex-col items-center space-y-4">
              {/* Avatar */}
              <div className="relative">
                <img
                  src={
                    user.avatarUrl
                      ? `http://localhost:3333${user.avatarUrl}`
                      : "/default-avatar.png"
                  }
                  className="w-26 h-26 rounded-full object-cover border-3 border-cyan-400 shadow-lg"
                  alt="avatar"
                />
                <span className="absolute bottom-2 right-3 w-4 h-4 bg-green-400 border-2 border-black rounded-full" />
              </div>

              {/* Info */}
              <div className="text-center font-mono">
                <h2 className="text-2xl font-bold text-cyan-400 tracking-wide">
                  {user.username}
                </h2>
                <p className="text-gray-300 text-sm">{user.email}</p>
              </div>
            </div>

            <button
              onClick={() => setEditMode(true)}
              className="mt-6 w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2.5 rounded-xl font-semibold transition shadow-lg cursor-pointer font-mono"
            >
              ✏️ Edit Profile
            </button>
          </>
        ) : (
          /* EDIT MODE */
          <form onSubmit={handleUpdate} className="space-y-4 font-mono">
            <h2 className="text-xl font-bold text-center text-cyan-400">
              Edit Profile
            </h2>

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/20 focus:ring-1 focus:ring-cyan-500 outline-none"
            />

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/20 focus:ring-1 focus:ring-cyan-500 outline-none"
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New Password"
              className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/20 focus:ring-1 focus:ring-cyan-500 outline-none"
            />

            {/* Avatar Upload */}
            <label className="block text-sm text-gray-300">
              Avatar
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatar(e.target.files[0])}
                className="mt-2 w-full text-sm file:bg-cyan-600 file:border-none file:px-4 file:py-1.5 file:rounded-full file:text-white hover:file:bg-cyan-700 cursor-pointer"
              />
            </label>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="w-1/2 bg-gray-600 hover:bg-gray-700 py-2 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 bg-cyan-600 hover:bg-cyan-700 py-2 rounded-xl font-semibold transition cursor-pointer"
              >
                Save
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
