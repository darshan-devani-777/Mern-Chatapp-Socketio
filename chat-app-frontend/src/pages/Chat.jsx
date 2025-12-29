import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import EmojiPicker from "emoji-picker-react";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import API_URL from "../config/api";

export default function Chat({ room, onBack }) {
  const { token, user } = useAuth();
  const username = user?.username;
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [text, setText] = useState("");
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [clearImages, setClearImages] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [privateRecipient, setPrivateRecipient] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [unreadMap, setUnreadMap] = useState({});
  const [openMenuId, setOpenMenuId] = useState(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/auth/users`, {
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

    socketRef.current = io(API_URL, { auth: { token } });

    socketRef.current.emit("joinRoom", { room });

    socketRef.current.on("previousMessages", (msgs) => {
      setMessages(msgs);
    });

    socketRef.current.on("message", (message) => {
      console.log("🟢 SOCKET MESSAGE RECEIVED:", message);
      setMessages((prev) => [...prev, message]);

      if (message.username === username) return;

      // 🔐 PRIVATE MESSAGE
      if (message.to) {
        if (message.to !== username) return;

        if (privateRecipient !== message.username) {
          setUnreadMap((prev) => ({
            ...prev,
            [message.username]: (prev[message.username] || 0) + 1,
          }));
        }
        return;
      }

      // 🌐 PUBLIC MESSAGE
      if (!message.to) {
        if (privateRecipient !== "") {
          setUnreadMap((prev) => ({
            ...prev,
            public: (prev.public || 0) + 1,
          }));
        }
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

    socketRef.current.on("messageEdited", (updatedMsg) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === updatedMsg._id ? updatedMsg : m))
      );
    });

    return () => {
      socketRef.current.off("messageEdited");
      socketRef.current.off("message");
      socketRef.current.off("previousMessages");
      socketRef.current.off("onlineUsers");
      socketRef.current.off("userTyping");
      socketRef.current.disconnect();
    };
  }, [token, room, username, privateRecipient]);

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

    if (clearImages) {
      formData.append("clearImages", "true");
    }

    imageFiles.forEach((file) => {
      formData.append("images", file);
    });

    axios
      .put(`${API_URL}/api/chat/edit/${id}`, formData, {
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
        setClearImages(false);
      })
      .catch((err) =>
        alert(err.response?.data?.message || "Failed to update message")
      );
  };

  const editMessage = (msg) => {
    setEditingMessageId(msg._id);
    setText(msg.text);
    setImagePreviews(msg.images || []);
    setImageFiles([]);
    setClearImages(false);
  };

  // SEND MESSAGE
  const sendMessage = async () => {
    if (!text.trim() && imageFiles.length === 0) return;

    // EDIT MODE
    if (editingMessageId) {
      updateMessage(editingMessageId);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("room", room);
      formData.append("text", text);
      formData.append("to", privateRecipient || "");

      imageFiles.forEach((file) => {
        formData.append("images", file);
      });

      await axios.post(`${API_URL}/api/chat/create`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // UI clear
      setText("");
      setImageFiles([]);
      setImagePreviews([]);

      // typing stop
      socketRef.current.emit("userTyping", {
        room,
        isTyping: false,
      });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send message");
    }
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
          .delete(`${API_URL}/api/chat/delete/${id}`, {
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

  const filteredMessages = messages.filter((m) => {
    // PUBLIC ROOM
    if (!privateRecipient) {
      return !m.to;
    }

    // PRIVATE CHAT
    return (
      (m.username === username && m.to === privateRecipient) ||
      (m.username === privateRecipient && m.to === username)
    );
  });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isPublicActive = privateRecipient === "";

  return (
    <div className="w-screen h-screen flex justify-center items-center">
      <div className="w-full max-w-7xl h-[95vh] flex bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-700">
        {/* LEFT SIDE : USERS */}
        <div className="w-[22%] bg-slate-950 border-r border-slate-700 flex flex-col">
          {/* Header */}
          <div className="px-4 py-4 border-b border-slate-700 bg-slate-900/70">
            <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              Users
              <span className="bg-gray-600 text-white text-sm px-2 py-0.5 rounded-full">
                {allUsers.length + 1}
              </span>
            </h2>
          </div>

          {/* Users List */}
          <div className="flex-1 overflow-y-auto px-2 py-3 space-y-3">
            {/* Public Room */}
            <button
              onClick={() => {
                setPrivateRecipient("");
                setUnreadMap((prev) => ({ ...prev, public: 0 }));
              }}
              className={`relative w-full flex items-center gap-3 px-3 py-4 rounded-xl transition cursor-pointer
    ${
      isPublicActive
        ? "bg-cyan-600 text-white"
        : "hover:bg-slate-800 text-gray-300"
    }`}
            >
              🌐 <span className="font-mono text-sm">Public Room</span>
              {unreadMap.public > 0 && (
                <span className="absolute top-2 right-3 bg-pink-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {unreadMap.public}
                </span>
              )}
            </button>

            {allUsers.map((u) => {
              const isOnline = onlineUsers.includes(u.username);
              const isActive = privateRecipient === u.username;

              return (
                <button
                  key={u.id}
                  onClick={() => {
                    setPrivateRecipient(u.username);
                    setUnreadMap((prev) => ({ ...prev, [u.username]: 0 }));
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition cursor-pointer
                ${
                  isActive
                    ? "bg-cyan-600 text-white"
                    : "hover:bg-slate-800 text-gray-300"
                }`}
                >
                  {/* Avatar with online indicator */}
                  <div className="relative">
                    <img
                      src={`${API_URL}${u.avatarUrl || "/default-avatar.png"}`}
                      alt={u.username}
                      className="w-10 h-10 rounded-full border-2 border-slate-700"
                    />

                    {/* Online dot */}
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900
      ${isOnline ? "bg-green-400" : "bg-gray-500"}`}
                    />

                    {/* 🔔 Unread badge */}
                    {unreadMap[u.username] > 0 && (
                      <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                        {unreadMap[u.username]}
                      </span>
                    )}
                  </div>

                  {/* User info */}
                  <div className="flex-1 text-left">
                    <div className="text-md font-mono">{u.username}</div>
                    <div className="text-[11px] text-gray-400">
                      {isOnline ? "Online" : "Offline"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT SIDE : CHAT */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="relative bg-slate-900/70 backdrop-blur-sm px-6 py-3.5 border-b border-gray-500/50 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-100 font-mono flex items-center gap-2">
              {privateRecipient ? (
                <>
                  <span>🔐</span>
                  <span className="text-cyan-400">{privateRecipient}</span>
                </>
              ) : (
                <>
                  <span>🌐</span>
                  <span className="text-gray-100">Room:</span>
                  <span className="text-red-400">{room}</span>
                </>
              )}
            </h2>

            <span className="text-xs font-medium bg-green-900/50 text-green-300 px-3 py-1 rounded-full border border-green-800">
              Active: {onlineUsers.length}
            </span>

            <button
              onClick={onBack}
              className="text-sm bg-pink-900/50 hover:bg-red-900 px-2 py-1.5 rounded-full text-white cursor-pointer"
            >
              ❌
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-slate-950">
            {filteredMessages.map((m, i) => {
              const isOwn = m.username === username;
              const avatarUrl = m.avatarUrl
                ? `${API_URL}${m.avatarUrl}`
                : "/default-avatar.png";
              const isOnline = onlineUsers.includes(m.username);
              const isPrivate = m.to;

              return (
                <div
                  key={m._id}
                  className={`flex items-end gap-3 ${
                    isOwn ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isOwn && (
                    <div className="relative">
                      <img
                        src={avatarUrl}
                        className="w-10 h-10 rounded-full border-2 border-slate-700"
                        alt="avatar"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${
                          isOnline ? "bg-green-400" : "bg-gray-500"
                        }`}
                      />
                    </div>
                  )}

                  <div
                    className={`relative max-w-[75%] px-5 py-3 rounded-xl text-sm shadow-lg ${
                      isOwn
                        ? "bg-gradient-to-br from-gray-500 to-cyan-600 text-white rounded-br-none"
                        : "bg-gradient-to-br from-gray-400 to-gray-700 text-white rounded-bl-none"
                    }`}
                  >
                    <div className="text-[16px] font-bold text-black mb-1">
                      {m.username}
                      {isPrivate && (
                        <span className="text-red-700 font-mono text-xs">
                          {" "}
                          (Private)
                        </span>
                      )}
                    </div>

                    {m.text && <div>{m.text}</div>}

                    {m.images?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {m.images.map((img, index) => {
                          const imageUrl = img;
                          console.log("Image URL:", imageUrl);
                          return (
                            <img
                              key={`${m._id}-${index}`}
                              src={imageUrl}
                              className="w-32 h-32 rounded-lg border-2 border-slate-700"
                              alt="img"
                            />
                          );
                        })}
                      </div>
                    )}

                    {isOwn && (
                      <div ref={menuRef} className="absolute top-1 right-0 w-6">
                        <button
                          onClick={() =>
                            setOpenMenuId(openMenuId === m._id ? null : m._id)
                          }
                          className="w-6 h-6 flex items-center justify-center text-white cursor-pointer"
                        >
                          ⋮
                        </button>

                        {openMenuId === m._id && (
                          <div className="absolute -right-9 top-0 flex flex-col bg-slate-800 border border-slate-700 rounded-md z-50">
                            <button
                              onClick={() => {
                                setEditingMessageId(m._id);
                                setText(m.text);
                                setImagePreviews(m.images || []);
                                setImageFiles([]);
                                setOpenMenuId(null);
                              }}
                              className="px-2 py-1 text-xs hover:bg-slate-700 cursor-pointer"
                            >
                              ✏️
                            </button>

                            <button
                              onClick={() => {
                                deleteMessage(m._id);
                                setOpenMenuId(null);
                              }}
                              className="px-2 py-1 text-xs text-pink-500 hover:bg-slate-700 cursor-pointer"
                            >
                              🗑
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="text-[10px] text-right mt-3 font-mono">
                      {new Date(m.updatedAt || m.createdAt).toLocaleTimeString(
                        "en-IN",
                        {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        }
                      )}
                    </div>

                    {m.updatedAt &&
                      m.createdAt &&
                      new Date(m.updatedAt).getTime() >
                        new Date(m.createdAt).getTime() && (
                        <div className="text-[10px] text-right text-yellow-300 italic font-mono">
                          edited
                        </div>
                      )}
                  </div>

                  {isOwn && (
                    <img
                      src={`${API_URL}${
                        user?.avatarUrl || "/default-avatar.png"
                      }`}
                      className="w-9 h-9 rounded-full border-2 border-slate-700"
                      alt="avatar"
                    />
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="px-4 py-3 bg-slate-950 text-sm italic text-gray-400 font-mono">
              {typingUsers.map((u) => u.username).join(" and ")} typing...
            </div>
          )}

          {/* INPUT SECTION (UNCHANGED) */}
          <div className="border-t border-gray-500/50 bg-gray-950 px-4 py-4">
            {editingMessageId && (
              <div className="mb-2 flex items-center justify-between text-xs font-mono text-yellow-300 bg-yellow-900/30 border border-yellow-700 rounded-lg px-3 py-2">
                <span>✏️ You are editing a message</span>

                <button
                  onClick={() => {
                    setEditingMessageId(null);
                    setText("");
                    setImageFiles([]);
                    setImagePreviews([]);
                  }}
                  className="text-yellow-200 hover:text-red-400 font-bold cursor-pointer"
                >
                  ✖ Cancel
                </button>
              </div>
            )}

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

                        setClearImages(true);
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
