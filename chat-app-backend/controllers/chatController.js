const Message = require("../models/Message");
const path = require("path");
const fs = require("fs");

// GET ROOM MESSAGE
exports.getRoomMessages = async (req, res) => {
  const { room } = req.params;
  try {
    const messages = await Message.find({ room })
      .populate("sender", "username")
      .sort({ timestamp: 1 });

    res.status(200).json({
      success: true,
      message: `Fetched ${messages.length} messages from room: ${room}`,
      data: messages.map((msg) => ({
        _id: msg._id,
        room: msg.room,
        sender: msg.sender,
        to: msg.to,
        text: msg.text,
        images: msg.images.map((img) => img.split("/").pop()),
        timestamp: msg.timestamp,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: err.message,
    });
  }
};

// GET USER MESSAGE
exports.getUserMessages = async (req, res) => {
  const { userId } = req.params;

  try {
    const messages = await Message.find({ sender: userId })
      .populate("sender", "username")
      .sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      message: `Fetched ${messages.length} messages sent by user: ${userId}`,
      data: messages.map((msg) => ({
        _id: msg._id,
        room: msg.room,
        sender: msg.sender,
        to: msg.to,
        text: msg.text,
        images: msg.images.map((img) => img.split("/").pop()),
        timestamp: msg.timestamp,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user messages",
      error: err.message,
    });
  }
};

// EDIT MESSAGE
exports.editMessage = async (req, res) => {
  const { messageId } = req.params;
  const { text, clearImages } = req.body;

  try {
    const message = await Message.findById(messageId).populate(
      "sender",
      "username avatarUrl"
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    if (String(message.sender._id) !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to edit this message",
      });
    }

    if (text) message.text = text;

    if (clearImages === "true") {
      for (const img of message.images) {
        const imgPath = path.join(__dirname, "..", img);
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      }
      message.images = [];
    }

    if (req.files && req.files.length > 0) {
      const newPaths = req.files.map(
        (file) => `/uploads/messages/${file.filename}`
      );
      message.images.push(...newPaths);
    }

    await message.save();

    res.status(200).json({
      success: true,
      message: "Message Updated Successfully...",
      data: {
        _id: message._id,
        room: message.room,
        sender: message.sender._id,
        username: message.sender.username,
        avatarUrl: message.sender.avatarUrl,
        to: message.to,
        text: message.text,
        images: message.images,
        timestamp: message.timestamp,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to update message",
      error: err.message,
    });
  }
};

// DELETE MESSAGE
exports.deleteMessage = async (req, res) => {
  const { messageId } = req.params;

  try {
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    if (String(message.sender) !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this message",
      });
    }

    await message.deleteOne();

    res.status(200).json({
      success: true,
      message: "Message Deleted Successfully...",
      data: {
        _id: message._id,
        room: message.room,
        sender: message.sender,
        text: message.text,
        timestamp: message.timestamp,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to delete message",
      error: err.message,
    });
  }
};
