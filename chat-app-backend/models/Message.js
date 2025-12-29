const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    room: { type: String },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    username: { type: String },
    to: { type: String, default: null },
    text: { type: String },
    images: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Message", messageSchema);
