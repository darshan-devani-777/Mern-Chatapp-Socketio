import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import EmojiPicker from "emoji-picker-react";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";

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
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        axios
          .delete(`http://localhost:3333/api/chat/delete/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then(() => {
            setMessages((prev) => prev.filter((msg) => msg._id !== id));
            Swal.fire("Deleted!", "Your message has been deleted.", "success");
          })
          .catch((err) => {
            Swal.fire(
              "Error",
              err.response?.data?.message || err.message,
              "error"
            );
          });
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto w-full h-[95vh] flex flex-col bg-slate-900 rounded-3xl shadow-2xl shadow-cyan-500/20 overflow-hidden border border-slate-700">
      {/* Header */}
      <div className="relative bg-slate-900/70 backdrop-blur-sm px-6 py-4 border-b border-gray-500/50">
        <div className="flex items-center justify-between w-full">
          <h2 className="text-xl font-semibold text-gray-100">
            Room: <span className="text-red-500 font-mono">{room}</span>
          </h2>

          <span className="text-xs font-medium bg-green-900/50 text-green-300 px-3 py-1 rounded-full shadow-sm border border-green-800 mx-auto">
            Active: {onlineUsers.length}
          </span>

          <button
            onClick={onBack}
            className="text-sm font-medium bg-pink-900/50 hover:bg-pink-700/70 px-2 py-1.5 rounded-full shadow-md transition duration-300 cursor-pointer text-white"
          >
            ❌
          </button>
        </div>

        {/* User Selection */}
        <div className="w-full max-w-xs mt-5">
          <label className="block text-[13px] font-medium text-gray-400 mb-1 font-mono">
            Select User
          </label>
          <select
            value={privateRecipient}
            onChange={(e) => setPrivateRecipient(e.target.value)}
            className="block w-full px-4 py-2 border border-slate-600 bg-slate-800 text-sm text-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer hover:bg-slate-700 transition duration-300 font-mono"
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-slate-950">
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
                    className="w-9 h-9 rounded-full shadow-md border-2 border-slate-700"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                      isOnline ? "bg-green-400" : "bg-gray-500"
                    }`}
                  />
                </div>
              )}

              <div
                className={`relative max-w-[75%] px-5 py-3 rounded-xl text-sm shadow-lg ${
                  isOwn
                    ? "bg-gradient-to-br from-gray-500 to-cyan-600 text-white rounded-br-none"
                    : "bg-gradient-to-br from-gray-400 to-gray-700 text-white border border-slate-700 rounded-bl-none"
                }`}
              >
                <div className="text-[16px] font-bold text-black mb-1">
                  {m.username}{" "}
                  {isPrivate && (
                    <span className="text-red-700 font-mono font-semibold text-xs">
                      (Private)
                    </span>
                  )}
                </div>
                {m.text && <div>{m.text}</div>}
                {m.images?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.images.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`image-${index}`}
                        className="w-32 h-32 object-cover rounded-lg border-2 border-slate-700 shadow-md"
                      />
                    ))}
                  </div>
                )}

                {isOwn && (
                  <div className="absolute top-1 right-0 group">
                    <button className="text-white text-sm px-1 rounded hover:bg-white/20 cursor-pointer transition duration-300">
                      ⋮
                    </button>

                    <div className="hidden group-hover:flex flex-col shadow-lg absolute left-3 top-0 z-10 bg-slate-800 rounded-md border border-slate-700">
                      <button
                        onClick={() => {
                          setEditingMessageId(m._id);
                          setText(m.text);
                          const previews = m.images || [];
                          setImagePreviews(previews);
                          setImageFiles([]);
                        }}
                        className="px-2 py-1 text-xs text-gray-300 hover:bg-slate-700 border-b border-slate-700 cursor-pointer"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteMessage(m._id)}
                        className="px-2 py-1 text-xs text-pink-500 hover:bg-slate-700 cursor-pointer"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                )}

                <div className="text-[10px] text-right text-white mt-4 font-mono">
                  {new Date(m.timestamp).toLocaleTimeString()}
                </div>
              </div>

              {isOwn && (
                <img
                  src={`http://localhost:3333${
                    user?.avatarUrl || "/default-avatar.png"
                  }`}
                  alt="avatar"
                  className="w-9 h-9 rounded-full shadow-md border-2 border-slate-700"
                />
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef}></div>
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="flex items-center gap-2 px-2 py-2 bg-slate-950">
          <div className="flex -space-x-2">
            {typingUsers.map((u, i) => (
              <img
                key={i}
                src={`http://localhost:3333${
                  u.avatarUrl || "/default-avatar.png"
                }`}
                className="w-7 h-7 rounded-full border-2 border-cyan-500 shadow"
                alt={u.username}
              />
            ))}
          </div>
          <span className="text-sm italic text-gray-400 font-mono">
            {typingUsers.map((u) => u.username).join(" and ")} typing...
          </span>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-500/50 bg-gray-950 px-4 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-xl cursor-pointer"
          >
            😊
          </button>

          <label htmlFor="imageInput" className="cursor-pointer">
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
            className="flex-1 bg-slate-800 px-4 py-2 rounded-full text-[12px] text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 shadow-sm font-mono"
          />

          <button
            onClick={sendMessage}
            className="bg-cyan-500 hover:bg-cyan-700 text-white text-sm px-4 py-2 rounded-full shadow-lg shadow-cyan-500/30 transition duration-300 cursor-pointer"
          >
            🚀
          </button>
        </div>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="mt-2">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              height={300}
              theme="dark"
            />
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
                  className="w-16 h-16 rounded-lg object-cover border-2 border-slate-700 shadow"
                />
                <button
                  className="absolute top-[-6px] right-[-6px] text-xs text-white bg-pink-500 hover:bg-pink-600 rounded-full w-5 h-5 flex items-center justify-center cursor-pointer"
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
        <div className="mx-4 my-2 px-4 py-1 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 flex items-center justify-between shadow-sm">
          <span className="text-sm font-medium font-mono">
            ✏️ Editing message...
          </span>
          <button
            onClick={() => {
              setEditingMessageId(null);
              setText("");
            }}
            className="text-xs text-yellow-300 font-semibold border border-yellow-500/50 px-3 py-1 rounded-full hover:bg-yellow-800/30 transition duration-300 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
