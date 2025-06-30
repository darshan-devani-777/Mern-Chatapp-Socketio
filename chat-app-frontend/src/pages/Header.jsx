import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/register");
  };

  return (
    <header className="w-full bg-gray-800 shadow-md p-4 flex justify-between items-center text-blue-400">
      {isLoggedIn && user && user.username && (
        <div className="flex items-center space-x-3">
          {user.avatarUrl && (
           <NavLink
           to="/profile"
           className={({ isActive }) =>
             isActive
               ? "ring-2 ring-blue-500 rounded-full"
               : ""
           }
         >
           <img
             src={`http://localhost:3333${user.avatarUrl}`}
             alt="avatar"
             className="w-14 h-14 rounded-full border border-gray-500 object-cover hover:ring-2 hover:ring-blue-400 transition"
           />
         </NavLink>
         
          )}
          <div className="flex flex-col leading-tight">
            <span className="text-red-300 font-semibold text-lg">
              {user.username}
            </span>
            <span className="text-gray-400 text-sm">{user.email}</span>
          </div>
        </div>
      )}

      <h1 className="text-xl font-bold">🔐 Chat App</h1>

      <nav className="space-x-4 text-md flex items-center">
        {!isLoggedIn ? (
          <>
            <NavLink
              to="/login"
              className={({ isActive }) =>
                isActive
                  ? "underline underline-offset-[6px] decoration-2 text-white hover:text-blue-300 transition duration-300"
                  : "hover:text-white"
              }
            >
              Login
            </NavLink>
            <NavLink
              to="/register"
              className={({ isActive }) =>
                isActive
                  ? "underline underline-offset-[6px] decoration-2 text-white hover:text-blue-300 transition duration-300"
                  : "hover:text-white"
              }
            >
              Register
            </NavLink>
          </>
        ) : (
          <>
          <NavLink
              to="/profile"
              className={({ isActive }) =>
                isActive
                  ? "underline underline-offset-[6px] decoration-2 text-white hover:text-blue-300 transition duration-300 font-semibold"
                  : "hover:text-white font-semibold"
              }
            >
              Profile
            </NavLink>
            <NavLink
              to="/chat"
              className={({ isActive }) =>
                isActive
                  ? "underline underline-offset-[6px] decoration-2 text-white hover:text-blue-300 transition duration-300 font-semibold"
                  : "hover:text-white font-semibold"
              }
            >
              Chat
            </NavLink>

            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded-lg shadow transition duration-200 cursor-pointer"
            >
              Logout
            </button>
          </>
        )}
      </nav>
    </header>
  );
}
