const express = require('express');
const Message = require('../models/message');
const Mentor=require('../models/mentor');
const Conversation = require('../models/conversation');
const { getIo } = require('../socket');

const sendMessage= async (req, res) => {
    try {
        const { conversationId, content, receiverId } = req.body;
        
        if (!content) {
            return res.status(400).json({ error: 'Message content is required' });
        }
        let senderId;
        let senderType;
        
        if (req.session.userId) {
            senderId = req.session.userId;
            senderType = 'user';
        } else if (req.session.mentorId) {
            senderId = req.session.mentorId;
            senderType = 'mentor';
        } else if (req.session.adminId) {
            senderId = req.session.adminId;
            senderType = 'admin';
        }
        
        let conversation;
        if (conversationId) {
            conversation = await Conversation.findById(conversationId)
                .populate('participants');
                
            if (!conversation) {
                return res.status(404).json({ error: 'Conversation not found' });
            }
        } 
        else if (receiverId) {
            let receiverUserId = receiverId;
            const mentor = await Mentor.findById(receiverId);
            if (mentor && mentor.user) {
                receiverUserId = mentor.user; 
            }
            const existingConversation = await Conversation.findOne({
                participants: {
                    $all: [senderId, receiverUserId],
                    $size: 2
                }
            }).populate('participants');
        
            if (existingConversation) {
                conversation = existingConversation;
            } else {
                conversation = new Conversation({
                    participants: [senderId, receiverUserId],
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
        
                await conversation.save();
                await conversation.populate('participants');
            }
        } else {
            return res.status(400).json({ error: 'Either conversationId or receiverId is required' });
        }
        
        const newMessage = new Message({
            conversation: conversation._id,
            sender: senderId,
            senderType: senderType,
            content: content,
            timestamp: new Date()
        });
        
        await newMessage.save();
        conversation.latestMessage = newMessage._id;
        conversation.updatedAt = new Date();
        await conversation.save();
        await newMessage.populate({
            path: 'sender',
            select: 'username name profileImage'
        });
        const io = getIo();
        conversation.participants.forEach(participant => {
            if (participant._id.toString() !== senderId.toString()) {
                io.to(participant._id.toString()).emit('new_message', {
                    _id: newMessage._id,
                    sender: newMessage.sender,
                    content: newMessage.content,
                    conversation: conversation._id,
                    timestamp: newMessage.timestamp,
                    chat: {
                        _id: conversation._id,
                        participants: conversation.participants
                    }
                });
            }
        });
        res.status(201).json({
            message: newMessage,
            conversation: conversation
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
};

const getConversationId=async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }
        
        const messages = await Message.find({ conversation: conversationId })
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate({
                path: 'sender',
                select: 'username name profileImage'
            });
        
        const totalMessages = await Message.countDocuments({ conversation: conversationId });
        
        res.status(200).json({
            messages: messages.reverse(),
            total: totalMessages,
            pages: Math.ceil(totalMessages / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
};

const readConversation=async (req, res) => {
    try {
        const { conversationId } = req.params;
        let readerId;
        if (req.session.userId) {
            readerId = req.session.userId;
        } else if (req.session.mentorId) {
            readerId = req.session.mentorId;
        } else if (req.session.adminId) {
            readerId = req.session.adminId;
        }
        
        const messages = await Message.find({
            conversation: conversationId,
            sender: { $ne: readerId },
            readBy: { $nin: [readerId] }
        });
        
        if (messages.length === 0) {
            return res.status(200).json({ message: 'No unread messages' });
        }
        const messageIds = messages.map(msg => msg._id);
        
        await Message.updateMany(
            { _id: { $in: messageIds } },
            { $addToSet: { readBy: readerId } }
        );
        const io = getIo();
        
        messageIds.forEach(messageId => {
            io.to(conversationId).emit('message_read', {
                messageId,
                readBy: readerId
            });
        });
        
        res.status(200).json({ message: 'Messages marked as read', count: messages.length });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ error: 'Failed to mark messages as read' });
    }
};

module.exports={
    sendMessage,
    getConversationId,
    readConversation
}