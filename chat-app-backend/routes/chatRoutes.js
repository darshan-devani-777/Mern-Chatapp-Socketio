const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyToken } = require('../middlewares/auth');
const upload = require('../middlewares/upload'); 

// GET ROOM MESSAGES
router.get('/room/:room', verifyToken , chatController.getRoomMessages);

// GET USER MESSAGES
router.get('/user/:userId', verifyToken , chatController.getUserMessages);

// EDIT MESSAGE
router.put('/edit/:messageId', verifyToken , upload.array('images'), chatController.editMessage);

// DELETE MESSAGE
router.delete('/delete/:messageId', verifyToken , chatController.deleteMessage);

module.exports = router;
