import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Header from './pages/Header';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Chat from './pages/ChatRoom'; 

import { ProtectedRoute, ProtectedAuthRoute } from './pages/RouteGuard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white flex flex-col">
        <Header />

        <div className="flex-1 flex justify-center items-center py-10">
          <div className="w-full max-w-md px-4">
            <Routes>
              {/* Public routes */}
              <Route
                path="/register"
                element={
                  <ProtectedAuthRoute>
                    <Register />
                  </ProtectedAuthRoute>
                }
              />
              <Route
                path="/login"
                element={
                  <ProtectedAuthRoute>
                    <Login />
                  </ProtectedAuthRoute>
                }
              />

              {/* 🔐 Auth-required routes */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
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
      </div>
    </Router>
  );
}

export default App;
