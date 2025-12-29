require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require('path');

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const initSocket = require("./socket");

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    allowedHeaders: ["Authorization", "Content-Type"],
  })
);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

connectDB();

const server = http.createServer(app);

initSocket(server, app);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
