import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Header from "./pages/Header";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Chat from "./pages/ChatRoom";

import { ProtectedRoute, ProtectedAuthRoute } from "./pages/RouteGuard";

function App() {
  return (
    <Router>
     <div className="min-h-screen bg-gray-900 text-white flex flex-col overflow-x-hidden">

        <Header />

        {/* MAIN CONTENT */}
        <div className="flex-1 flex justify-center items-center">

          <Routes>
            {/* ================= PUBLIC (CENTER SMALL) ================= */}
            <Route
              path="/register"
              element={
                <ProtectedAuthRoute>
                  <div className="w-full max-w-md px-4">
                    <Register />
                  </div>
                </ProtectedAuthRoute>
              }
            />

            <Route
              path="/login"
              element={
                <ProtectedAuthRoute>
                  <div className="w-full max-w-md px-4">
                    <Login />
                  </div>
                </ProtectedAuthRoute>
              }
            />

            {/* ================= AUTH REQUIRED ================= */}

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <div className="w-full max-w-2xl px-4">
                    <Profile />
                  </div>
                </ProtectedRoute>
              }
            />

            {/* ================= CHAT (FULL WIDTH) ================= */}
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />
          </Routes>

        </div>
      </div>
    </Router>
  );
}

export default App;
