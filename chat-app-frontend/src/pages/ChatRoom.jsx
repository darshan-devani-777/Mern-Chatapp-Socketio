import React, { useState, useEffect } from 'react';
import RoomList from '../pages/RoomList';
import Chat from '../pages/Chat';

export default function ChatRoom() {
  const [selectedRoom, setSelectedRoom] = useState(() => {
    return localStorage.getItem("chatRoom") || null;
  });

  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');

  useEffect(() => {
    if (selectedRoom) {
      localStorage.setItem("chatRoom", selectedRoom);
    } else {
      localStorage.removeItem("chatRoom");
    }
  }, [selectedRoom]);

  return (
    <div className="p-4">
      {!selectedRoom ? (
        <RoomList onSelectRoom={setSelectedRoom} />
      ) : (
        <Chat
          token={token}
          username={username}
          room={selectedRoom}
          onBack={() => setSelectedRoom(null)} 
        />
      )}
    </div>
  );
}
