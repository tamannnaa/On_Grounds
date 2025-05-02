const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const {getUnreadCount,renderChatList,renderChatPage}= require('../controllers/chatController');

router.get('/chatPage', isAuthenticated, renderChatList);
router.get('/unread-count', isAuthenticated, getUnreadCount);
router.get('/chatpage/:userId', isAuthenticated, renderChatList);
router.get('/:userId', isAuthenticated, renderChatPage);
module.exports = router;
