const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  room: { type: String },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  to: { type: String, default: null },
  text: { type: String },
  images: [{ type: String }], 
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", messageSchema);
