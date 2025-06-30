const express = require('express');
const { register, login, getAllUsers , updateUser } = require('../controllers/authController');
const upload = require('../middlewares/upload');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');

// REGISTER USER
router.post('/register', upload.single('avatar'), register);

// LOGIN USER
router.post('/login', login);

// UPDATE USER
router.put("/update", verifyToken , upload.single("avatar"), updateUser);

// GET ALL USER
router.get('/users', verifyToken , getAllUsers);

module.exports = router;