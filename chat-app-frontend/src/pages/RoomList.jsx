import React, { useState } from "react";

const RoomList = ({ onSelectRoom }) => {
  const [roomInput, setRoomInput] = useState("");

  const handleJoin = () => {
    const trimmedRoom = roomInput.trim();
    if (trimmedRoom) {
      onSelectRoom(trimmedRoom);
      setRoomInput(""); 
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        🧩 Enter Room Name
      </h2>

      <div className="space-y-4">
        <input
          type="text"
          value={roomInput}
          onChange={(e) => setRoomInput(e.target.value)}
          placeholder="Type room name..."
          className="w-full px-4 py-3 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={handleJoin}
          className="w-full px-5 py-3 bg-gradient-to-r from-blue-700 to-indigo-700 text-white rounded-xl shadow-md transition duration-300 hover:from-blue-600 hover:to-indigo-600 hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-lg font-semibold"
        >
          🚀 Join Room
        </button>
      </div>
    </div>
  );
};

export default RoomList;
