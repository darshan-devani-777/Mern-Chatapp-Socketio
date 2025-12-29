require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require("path");
const os = require("os");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const initSocket = require("./socket");

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: ["http://localhost:5173", "http://192.168.29.16:5173"],
    credentials: true,
    allowedHeaders: ["Authorization", "Content-Type"],
  })
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

connectDB();

const server = http.createServer(app);

initSocket(server, app);

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

const PORT = process.env.PORT || 5000;
const IP = getLocalIP();

server.listen(PORT, () => {
  console.log("🚀 Server running at:");
  console.log(`Localhost: http://localhost:${PORT}`);
  console.log(`Network IP: http://${IP}:${PORT}`);
});
