import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API_URL from "../config/api";

export default function Header() {
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    localStorage.clear();
    navigate("/register");
  };

  return (
    <header className="w-full sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-gray-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center text-cyan-400">
        {/* LEFT : USER INFO */}
        {isLoggedIn && user && (
          <div className="flex items-center gap-4">
            <NavLink to="/profile">
              <img
                src={`${API_URL}${user.avatarUrl || "/default-avatar.png"}`}
                alt="avatar"
                className="w-12 h-12 rounded-full object-cover border-2 border-cyan-500 hover:ring-2 hover:ring-cyan-400 transition"
              />
            </NavLink>

            <div className="leading-tight hidden sm:block font-mono">
              <div className="text-cyan-400 font-semibold">{user.username}</div>
              <div className="text-gray-400 text-xs">{user.email}</div>
            </div>
          </div>
        )}

        {/* CENTER LOGO */}
        <h1 className="text-lg sm:text-xl font-bold tracking-wide text-white font-mono">
          🔐 Chat App
        </h1>

        {/* RIGHT : NAV */}
        <nav className="flex items-center gap-4 text-sm sm:text-base">
          {!isLoggedIn ? (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  isActive
                    ? "text-white font-semibold border-b-2 border-cyan-400 pb-1"
                    : "text-gray-300 hover:text-white transition"
                }
              >
                Login
              </NavLink>

              <NavLink
                to="/register"
                className={({ isActive }) =>
                  isActive
                    ? "text-white font-semibold border-b-2 border-cyan-400 pb-1"
                    : "text-gray-300 hover:text-white transition"
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
                    ? "text-white font-semibold border-b-2 border-cyan-400 pb-1 font-mono"
                    : "text-gray-300 hover:text-white transition font-mono"
                }
              >
                Profile
              </NavLink>

              <NavLink
                to="/chat"
                className={({ isActive }) =>
                  isActive
                    ? "text-white font-semibold border-b-2 border-cyan-400 pb-1 font-mono"
                    : "text-gray-300 hover:text-white transition font-mono"
                }
              >
                Chat
              </NavLink>

              <button
                onClick={handleLogout}
                className="ml-2 bg-red-500 font-mono hover:bg-red-700 text-white px-4 py-1.5 rounded-xl shadow transition cursor-pointer"
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
