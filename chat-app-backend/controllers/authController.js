const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');

// REGISTER USER
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const avatar = req.file ? `/uploads/users/${req.file.filename}` : null;

    const exists = await User.findOne({ $or: [{ username }, { email }] });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists',
      });
    }

    const newUser = new User({ username, email, password, avatarUrl: avatar });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({
      success: true,
      message: 'User Registered Successfully',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        avatarUrl: newUser.avatarUrl,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: err.message,
    });
  }
};

// LOGIN USER
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      success: true,
      message: 'User Login Successfully...',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
};

// GET ALL USER
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, 'username email avatarUrl');
    res.status(200).json({
      success: true,
      message: "Users Fetched Successfully...",
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message,
    });
  }
};

// UPDATE USER 
exports.updateUser = async (req, res) => {
  try {
    const userId = req.user.id; 

    const { username, email, password } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const exists = await User.findOne({
      $or: [{ username }, { email }],
      _id: { $ne: userId },
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Username or email already exists",
      });
    }

    if (username) user.username = username;
    if (email) user.email = email;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    if (req.file) {
      if (user.avatarUrl) {
        const oldPath = path.join(__dirname, "..", user.avatarUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath); 
        }
      }

      user.avatarUrl = `/uploads/users/${req.file.filename}`;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "User Updated Successfully...",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message,
    });
  }
};



