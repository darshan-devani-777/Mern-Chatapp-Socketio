import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

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
  
        alert("Profile Updated Successfully...!");
      } else {
        alert(data.message || "Update failed");
      }
    } catch (error) {
      alert("Something went wrong");
      console.error(error);
    }
  };  

  if (!user) {
    return (
      <div className="text-center text-white mt-10">User Not Found</div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-gray-800 text-white p-6 rounded-lg shadow relative">
      <button
        onClick={() => navigate(-1)}
        className="absolute top-1 right-3 text-red-500 hover:text-red-700 text-xl font-bold border rounded-full px-2 cursor-pointer"
        aria-label="Close"
      >
        &times;
      </button>

      {!editMode ? (
        <>
          <div className="flex flex-col items-center space-y-4">
            {user.avatarUrl && (
              <img
                src={`http://localhost:3333${user.avatarUrl}`}
                alt="avatar"
                className="w-20 h-20 rounded-full border border-gray-500 object-cover"
              />
            )}
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-blue-400">
                {user.username}
              </h2>
              <p className="text-gray-400">{user.email}</p>
            </div>
          </div>
          <div className="flex justify-center mt-6">
            <button
              onClick={() => setEditMode(true)}
              className="bg-green-600 hover:bg-green-800 px-4 py-2 rounded cursor-pointer transition duration-300"
            >
              Edit Profile
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={handleUpdate} className="space-y-4">
          <h2 className="text-xl font-semibold text-blue-400 text-center mb-4">
            Edit Profile
          </h2>

          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full p-2 rounded bg-gray-700 text-white"
            required
          />

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-2 rounded bg-gray-700 text-white"
            required
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New Password (optional)"
            className="w-full p-2 rounded bg-gray-700 text-white"
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setAvatar(e.target.files[0])}
            className="w-full p-2 rounded bg-gray-700 text-white hover:cursor-pointer"
          />

          <div className="flex justify-between mt-4">
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded cursor-pointer transition duration-300"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-800 px-4 py-2 rounded cursor-pointer transition duration-300"
            >
              Save
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
