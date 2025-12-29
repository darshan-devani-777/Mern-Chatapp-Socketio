const socketio = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Message = require("./models/Message");

const roomUsers = {};
const userSocketMap = {};

module.exports = (server, app) => {
  const io = socketio(server, {
    cors: { origin: "*" },
  });

  app.set("io", io);

  // AUTH WITH JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const { id } = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = await User.findById(id);
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const username = socket.user.username;
    const avatarUrl = socket.user.avatarUrl;

    userSocketMap[username] = socket.id;

    console.log(`✅ CONNECTED | user: ${username} | socketId: ${socket.id}`);

    // JOIN ROOM
    socket.on("joinRoom", async ({ room }) => {
      socket.join(room);
      socket.room = room;

      console.log(
        `📥 JOIN ROOM | user: ${username} | room: ${room} | socketId: ${socket.id}`
      );

      if (!roomUsers[room]) roomUsers[room] = [];

      roomUsers[room].push({
        id: socket.id,
        username,
      });

      io.to(room).emit("onlineUsers", roomUsers[room]);

      const recentMessages = await Message.find({ room })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("sender", "username avatarUrl");

      socket.emit(
        "previousMessages",
        recentMessages.reverse().map((msg) => ({
          _id: msg._id,
          username: msg.username || msg.sender?.username,
          avatarUrl: msg.avatarUrl || msg.sender?.avatarUrl,
          text: msg.text,
          images: msg.images,
          to: msg.to || null,
          createdAt: msg.createdAt,
          updatedAt: msg.updatedAt,
        }))
      );
    });

    // SEND MESSAGE
    socket.on("sendMessage", async ({ room, text, images = [], to }) => {
      if (!room || (!text?.trim() && images.length === 0)) return;

      let savedImages = [];

      for (const img of images) {
        if (img?.data?.startsWith("data:")) {
          const base64Data = img.data.split(",")[1];
          const buffer = Buffer.from(base64Data, "base64");

          const fileName = `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}.png`;

          const uploadDir = path.join(__dirname, "uploads/users");

          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }

          const filePath = path.join(uploadDir, fileName);
          fs.writeFileSync(filePath, buffer);

          savedImages.push(`/uploads/users/${fileName}`);
        }
      }

      const message = await Message.create({
        room,
        sender: socket.user._id,
        username,
        avatarUrl,
        text,
        images: savedImages,
        to,
      });

      const messageData = {
        _id: message._id,
        room,
        username,
        avatarUrl,
        text,
        images: savedImages,
        to,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      };

      // PRIVATE
      if (to) {
        const targetSocketId = userSocketMap[to];
        if (targetSocketId) {
          io.to(targetSocketId).emit("message", messageData);
        }
        socket.emit("message", messageData);
      } else {
        // PUBLIC
        io.to(room).emit("message", messageData);
      }
    });

    // TYPING
    socket.on("userTyping", ({ room, isTyping }) => {
      console.log(
        `⌨️ TYPING | user: ${username} | room: ${room} | isTyping: ${isTyping} | socketId: ${socket.id}`
      );

      socket.to(room).emit("userTyping", {
        username,
        isTyping,
        avatarUrl,
      });
    });

    // DISCONNECT
    socket.on("disconnect", () => {
      console.log(
        `❌ DISCONNECTED | user: ${username} | socketId: ${socket.id}`
      );

      delete userSocketMap[username];

      const room = socket.room;
      if (room && roomUsers[room]) {
        roomUsers[room] = roomUsers[room].filter((u) => u.id !== socket.id);
        io.to(room).emit("onlineUsers", roomUsers[room]);
      }
    });
  });

  return io;
};
