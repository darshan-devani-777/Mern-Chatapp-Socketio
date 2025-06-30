import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import EmojiPicker from "emoji-picker-react";
import { useAuth } from "../context/AuthContext";

export default function Chat({ room, onBack }) {
  const { token, user } = useAuth();
  const username = user?.username;
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [text, setText] = useState("");
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [privateRecipient, setPrivateRecipient] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    axios
      .get("http://localhost:3333/api/auth/users", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const filtered = res.data.users?.filter((u) => u.username !== username);
        setAllUsers(filtered);
      })
      .catch((err) =>
        console.error(
          "Failed to fetch users",
          err.response?.data || err.message
        )
      );

    socketRef.current = io("http://localhost:3333", { auth: { token } });

    socketRef.current.emit("joinRoom", { room });

    socketRef.current.on("previousMessages", (msgs) => {
      setMessages(msgs);
    });

    socketRef.current.on("message", (message) => {
      if (
        !message.to ||
        message.to === username ||
        message.username === username
      ) {
        setMessages((prev) => [...prev, message]);
      }
    });

    socketRef.current.on("onlineUsers", (users) => {
      setOnlineUsers(users.map((u) => u.username));
    });

    socketRef.current.on(
      "userTyping",
      ({ username: typingUsername, isTyping, avatarUrl }) => {
        if (typingUsername !== username) {
          setTypingUsers((prev) => {
            if (isTyping && !prev.some((u) => u.username === typingUsername)) {
              return [...prev, { username: typingUsername, avatarUrl }];
            } else if (!isTyping) {
              return prev.filter((u) => u.username !== typingUsername);
            }
            return prev;
          });
        }
      }
    );

    return () => socketRef.current.disconnect();
  }, [token, room, username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // HANDLE TYPING
  const handleTyping = (e) => {
    setText(e.target.value);
    socketRef.current.emit("userTyping", { room, isTyping: true });
    clearTimeout(socketRef.current.typingTimeout);
    socketRef.current.typingTimeout = setTimeout(() => {
      socketRef.current.emit("userTyping", { room, isTyping: false });
    }, 2000);
  };

  // HANDLE EMOJI
  const handleEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  // HANDLE IMAGE CHANGE
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setImageFiles(files);
      const previews = files.map((file) => URL.createObjectURL(file));
      setImagePreviews(previews);
    }
  };

  // UPDATE MESSAGE
  const updateMessage = (id) => {
    const formData = new FormData();
    formData.append("text", text);

    if (imageFiles.length > 0) {
      imageFiles.forEach((file) => {
        formData.append("images", file);
      });
      formData.append("clearImages", "true");
    }

    axios
      .put(`http://localhost:3333/api/chat/edit/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })
      .then((res) => {
        const updatedMsg = res.data.data;

        setMessages((prev) =>
          prev.map((msg) => (msg._id === id ? updatedMsg : msg))
        );

        setEditingMessageId(null);
        setText("");
        setImageFiles([]);
        setImagePreviews([]);
      })
      .catch((err) =>
        alert(err.response?.data?.message || "Failed to update message")
      );
  };

  const editMessage = (msg) => {
    setEditingMessageId(msg._id);
    setText(msg.text);
  };

  // SEND MESSAGE
  const sendMessage = () => {
    if (!text.trim() && imageFiles.length === 0) return;

    if (editingMessageId) {
      updateMessage(editingMessageId);
      return;
    }

    const readerPromises = imageFiles.map((file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readerPromises).then((base64Images) => {
      socketRef.current.emit("sendMessage", {
        room,
        text,
        images: base64Images,
        to: privateRecipient || null,
        avatarUrl: user?.avatarUrl,
      });

      setText("");
      setImageFiles([]);
      setImagePreviews([]);
      socketRef.current.emit("userTyping", { room, isTyping: false });
    });
  };

  // DELETE MESSAGE
  const deleteMessage = (id) => {
    axios
      .delete(`http://localhost:3333/api/chat/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        setMessages((prev) => prev.filter((msg) => msg._id !== id));
      })
      .catch((err) => alert(err.response?.data?.message || err.message));
  };

  return (
    <div className="max-w-3xl mx-auto w-full h-[85vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-blue-100 to-blue-50 px-6 py-4 border-b border-blue-200">
        <button
          onClick={onBack}
          className="absolute top-2 right-2 text-sm font-medium bg-red-100 hover:bg-red-300 px-2 py-1.5 rounded-full shadow-md transition duration-300 cursor-pointer"
        >
          ❌
        </button>

        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold text-gray-800">
            Room: <span className="text-blue-600">{room}</span>
          </h2>

          <div className="flex items-center flex-wrap gap-3">
            <span className="text-xs font-medium bg-green-200 text-green-700 px-3 py-1 rounded-full shadow-sm">
              👤 Active: {onlineUsers.length}
            </span>

            <div className="w-full max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select User
              </label>
              <select
                value={privateRecipient}
                onChange={(e) => setPrivateRecipient(e.target.value)}
                className="block w-full px-4 py-2 border border-gray-300 bg-white text-sm text-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer hover:bg-gray-100 transition duration-300"
              >
                <optgroup label="🌐 Public Chat">
                  <option value="">🌐 Public Room</option>
                </optgroup>
                <optgroup label="🔐 Private Chat">
                  {allUsers.length === 0 ? (
                    <option disabled>User Not Found.</option>
                  ) : (
                    allUsers.map((user) => {
                      const isOnline = onlineUsers.includes(user.username);
                      const label = `🔐 Chatting with ${user.username} ${
                        isOnline ? "🟢" : "⚪️"
                      }`;
                      return (
                        <option key={user.id} value={user.username}>
                          {label}
                        </option>
                      );
                    })
                  )}
                </optgroup>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-gray-50">
        {messages.map((m, i) => {
          const isOwn = m.username === username;
          const avatarUrl = m.avatarUrl
            ? `http://localhost:3333${m.avatarUrl}`
            : "/default-avatar.png";
          const isOnline = onlineUsers.includes(m.username);
          const isPrivate = m.to;

          return (
            <div
              key={i}
              className={`flex items-end gap-3 ${
                isOwn ? "justify-end" : "justify-start"
              }`}
            >
              {!isOwn && (
                <div className="relative">
                  <img
                    src={avatarUrl}
                    alt="avatar"
                    className="w-9 h-9 rounded-full shadow-md"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                      isOnline ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                </div>
              )}

              <div
                className={`relative max-w-[75%] px-5 py-3 rounded-xl text-sm shadow-md ${
                  isOwn
                    ? "bg-gradient-to-br from-blue-300 to-blue-700 text-white rounded-br-none"
                    : "bg-gradient-to-br from-gray-200 to-gray-500 text-gray-800 border border-gray-300 rounded-bl-none"
                }`}
              >
                <div className="text-md font-semibold text-black mb-1">
                  {m.username}{" "}
                  {isPrivate && <span className="text-red-500">(Private)</span>}
                </div>
                {m.text && <div>{m.text}</div>}
                {m.images?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.images.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`image-${index}`}
                        className="w-32 h-32 object-cover rounded-lg border shadow-md"
                      />
                    ))}
                  </div>
                )}

                {isOwn && (
                  <div className="absolute top-1 right-0 group">
                    <button className="text-white text-sm px-1 rounded hover:bg-white/20 cursor-pointer transition duration-300">
                      ⋮
                    </button>

                    <div className="hidden group-hover:flex flex-col shadow-md absolute left-3 top-0 z-10">
                      <button
                        onClick={() => {
                          setEditingMessageId(m._id);
                          setText(m.text);
                          const previews = m.images || [];
                          setImagePreviews(previews);
                          setImageFiles([]);
                        }}
                        className="px-1 py-1 text-[10px] hover:bg-red-100 border-b border-gray-200 cursor-pointer"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteMessage(m._id)}
                        className="px-1 py-1 text-[10px] text-red-600 hover:bg-red-100 cursor-pointer"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                )}

                <div className="text-[10px] text-right text-black mt-2">
                  {new Date(m.timestamp).toLocaleTimeString()}
                </div>
              </div>

              {isOwn && (
                <img
                  src={`http://localhost:3333${
                    user?.avatarUrl || "/default-avatar.png"
                  }`}
                  alt="avatar"
                  className="w-9 h-9 rounded-full shadow-md"
                />
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef}></div>
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="flex items-center gap-2 px-2 py-2 bg-gray-50">
          <div className="flex -space-x-2">
            {typingUsers.map((u, i) => (
              <img
                key={i}
                src={`http://localhost:3333${
                  u.avatarUrl || "/default-avatar.png"
                }`}
                className="w-7 h-7 rounded-full border-2 border-blue-500 shadow"
                alt={u.username}
              />
            ))}
          </div>
          <span className="text-sm italic text-gray-500">
            {typingUsers.map((u) => u.username).join(" and ")} typing...
          </span>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-300 bg-white px-4 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-xl cursor-pointer"
          >
            😊
          </button>

          <label htmlFor="imageInput" className="text-xl cursor-pointer">
            📎
          </label>
          <input
            id="imageInput"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="hidden"
          />

          <input
            type="text"
            value={text}
            onChange={handleTyping}
            placeholder={`Type your message${
              privateRecipient ? ` to ${privateRecipient}` : ""
            }...`}
            className="flex-1 bg-gray-100 px-4 py-2 rounded-full text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />

          <button
            onClick={sendMessage}
            className="bg-blue-500 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-full shadow-md transition duration-300 cursor-pointer"
          >
            🚀
          </button>
        </div>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="mt-2">
            <EmojiPicker onEmojiClick={handleEmojiClick} height={300} />
          </div>
        )}

        {/* Image Preview */}
        {imagePreviews.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-3">
            {imagePreviews.map((preview, i) => (
              <div key={i} className="relative">
                <img
                  src={preview}
                  alt={`preview-${i}`}
                  className="w-16 h-16 rounded-lg object-cover border shadow"
                />
                <button
                  className="absolute top-[-6px] right-[-6px] text-xs text-white bg-red-500 hover:bg-red-700 rounded-full w-5 h-5 flex items-center justify-center cursor-pointer"
                  onClick={() => {
                    const updatedPreviews = [...imagePreviews];
                    updatedPreviews.splice(i, 1);
                    setImagePreviews(updatedPreviews);
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Message */}
      {editingMessageId && (
        <div className="mx-4 my-2 px-4 py-1 rounded-xl border border-yellow-400 bg-yellow-100 text-yellow-800 flex items-center justify-between shadow-sm">
          <span className="text-sm font-medium">✏️ Editing message...</span>
          <button
            onClick={() => {
              setEditingMessageId(null);
              setText("");
            }}
            className="text-xs text-yellow-800 font-semibold border border-yellow-400 px-3 py-1 rounded-full hover:bg-yellow-300 transition duration-300 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
