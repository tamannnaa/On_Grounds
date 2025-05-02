const express = require('express');
const router = express.Router();
const {sendMessage,getConversationId,readConversation}=require('../controllers/messageController');

const isAuthenticated = (req, res, next) => {
    if (req.session.userId || req.session.mentorId || req.session.adminId) {
        next();
    } else {
        res.status(401).json({ error: 'You must be logged in' });
    }
};

router.post('/send', isAuthenticated, sendMessage);
router.get('/:conversationId', isAuthenticated, getConversationId);
router.put('/read/:conversationId', isAuthenticated,readConversation);

module.exports = router;