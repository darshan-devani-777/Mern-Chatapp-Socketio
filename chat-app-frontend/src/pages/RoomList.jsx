import React, { useState } from "react";

const RoomList = ({ onSelectRoom }) => {
  const [roomInput, setRoomInput] = useState("");
  const [error, setError] = useState("");

  const handleJoin = () => {
    const trimmedRoom = roomInput.trim();

    if (!trimmedRoom) {
      setError("Room name is required");
      return;
    }

    setError("");
    onSelectRoom(trimmedRoom);
    setRoomInput("");
  };

  return (
    <div className="w-full max-w-xl mx-auto backdrop-blur-xl bg-black/50 p-10 rounded-3xl shadow-2xl border border-gray-700 font-mono">
      <h2 className="text-xl font-bold text-white mb-8 text-center tracking-wide">
        🌐 Join a Room
      </h2>

      <div className="space-y-6">
        <div className="relative">
          <input
            type="text"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
            placeholder="Enter room name..."
            className={`w-full px-5 py-3 rounded-2xl bg-slate-900/80 text-white placeholder-gray-500
              border focus:outline-none transition text-sm
              ${
                error
                  ? "border-red-500 ring-0 ring-red-500"
                  : "border-slate-700 focus:ring-2 focus:ring-cyan-500"
              }`}            
          />

          {error && (
            <p className="absolute left-1 text-red-400 text-xs mt-1 font-mono">
              {error}
            </p>
          )}
        </div>

        <button
          onClick={handleJoin}
          className="w-full py-3 rounded-2xl text-white text-md font-semibold
            bg-gradient-to-r from-cyan-600 to-blue-700
            hover:from-cyan-500 hover:to-blue-600
            shadow-lg shadow-cyan-500/30
            transition duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
        >
          🚀 Join Room
        </button>
      </div>
    </div>
  );
};

export default RoomList;
