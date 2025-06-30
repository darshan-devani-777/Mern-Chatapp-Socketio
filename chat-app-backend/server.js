require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const socketServer = require('./socket');

const app = express();
app.use(express.json());

const cors = require('cors');
app.use(cors({ origin: "*", credentials: true, allowedHeaders: ["Authorization", "Content-Type"] }));

app.use('/uploads', express.static('uploads'));
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

connectDB();
const server = app.listen(process.env.PORT || 5000, () =>
  console.log(`Server Start At http://localhost:${process.env.PORT || 5000}`)
);
socketServer(server);