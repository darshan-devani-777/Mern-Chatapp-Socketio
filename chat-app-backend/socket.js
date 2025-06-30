const socketio = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Message = require("./models/Message");

const roomUsers = {};
const userSocketMap = {};

module.exports = (server) => {
  const io = socketio(server, { cors: { origin: "*" } });

  // AUTHENTICATE WITH JWT
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    try {
      const { id } = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = await User.findById(id);
      next();
    } catch {
      next(new Error("Authentication error"));
    }
  });

  // CONNECTION
  io.on("connection", (socket) => {
    console.log(socket.id);
    
    const username = socket.user.username;
    const avatarUrl = socket.user.avatarUrl;
    userSocketMap[username] = socket;

    console.log(`${username} connected`);
    const totalUsers = Object.keys(userSocketMap).length;
    console.log(`Total connected users: ${totalUsers}`);

    // Join room
    socket.on("joinRoom", async ({ room }) => {
      socket.join(room);
      socket.room = room;

      console.log(`${username} joined room ${room}`);

      // Add to roomUsers
      if (!roomUsers[room]) roomUsers[room] = [];
      roomUsers[room].push({ id: socket.id, username });

      io.to(room).emit("onlineUsers", roomUsers[room]);

      const recentMessages = await Message.find({ room })
        .sort({ timestamp: -1 })
        .limit(20)
        .populate("sender", "username avatarUrl");

      socket.emit(
        "previousMessages",
        recentMessages.reverse().map((msg) => ({
          username: msg.username || msg.sender?.username,
          text: msg.text,
          images: msg.images,
          avatarUrl: msg.avatarUrl || msg.sender?.avatarUrl || null,
          timestamp: msg.timestamp,
          to: msg.to || null,
        }))
      );
    });

    // Send message (public or private)
    socket.on("sendMessage", async ({ room, text, images = [], to }) => {
      if (!room || (!text?.trim() && images.length === 0)) return;

      try {
        const message = new Message({
          room,
          sender: socket.user._id,
          username: socket.user.username,
          avatarUrl: socket.user.avatarUrl,
          text,
          images,
          to,
        });
        await message.save();

        const messageData = {
          _id: message._id,
          username: socket.user.username,
          text,
          images,
          timestamp: message.timestamp,
          avatarUrl: socket.user.avatarUrl,
          to,
        };

        if (to) {
          const targetSocket = [...io.sockets.sockets.values()].find(
            (s) => s.user?.username === to
          );
          if (targetSocket) targetSocket.emit("message", messageData);
          socket.emit("message", messageData);
        } else {
          io.to(room).emit("message", messageData);
        }
      } catch (err) {
        console.error("Error saving message:", err);
      }
    });

    // Typing indicator
    socket.on("userTyping", ({ room, isTyping }) => {
      socket.to(room).emit("userTyping", {
        username,
        isTyping,
        avatarUrl,
      });
    });

    // Disconnect
    socket.on("disconnect", () => {
      delete userSocketMap[username];

      const room = socket.room;
      if (room && roomUsers[room]) {
        roomUsers[room] = roomUsers[room].filter((u) => u.id !== socket.id);
        io.to(room).emit("onlineUsers", roomUsers[room]);
      }

      console.log(`${username} disconnected`);
      const totalUsers = Object.keys(userSocketMap).length;
      console.log(`Total connected users: ${totalUsers}`);
    });
  });
};
