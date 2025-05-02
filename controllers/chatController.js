const Chat = require('../models/message');
const Mentor = require('../models/mentor');
const Conversation=require('../models/conversation');
const User = require('../models/user');
const Message=require('../models/message');
const mongoose = require('mongoose');

const getUnreadCount = async (req, res) => {
    try {
        const count = await Chat.countDocuments({
            receiver: req.session.userId,
            read: false
        });
        res.json({ count });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ error: 'Failed to fetch unread count' });
    }
};

const renderChatList = async (req, res) => {
    try {
        const currentUserId = req.session.userId;
        const selectedUserId = req.params.userId;
        const currentUser = await User.findById(currentUserId);
        if (!currentUser) {
            throw new Error('Current user not found');
        }
        let conversations = await Conversation.find({ 
            participants: currentUserId
        })
        .populate({
            path: "participants",
            select: "name username email profileImage"
        })
        .populate({
            path: "latestMessage",
            select: "content createdAt sender read"
        })
        .sort({ updatedAt: -1 });
        
        console.log(`Found ${conversations.length} conversations for user ${currentUserId}`);
        conversations = conversations.filter(conv => 
            Array.isArray(conv.participants) && conv.participants.length === 2
        );
        
        console.log(`After filtering, found ${conversations.length} one-to-one conversations`);
        if (conversations.length > 0) {
            conversations = await User.populate(conversations, {
                path: "latestMessage.sender",
                select: "name username email"
            });
        }
        const chatList = [];
        
        for (const conv of conversations) {
            try {
                const otherParticipants = conv.participants.filter(
                    p => p && p._id && p._id.toString() !== currentUserId.toString()
                );
                
                if (otherParticipants.length === 0) {
                    console.log(`No other participants found in conversation: ${conv._id}`);
                    continue;
                }
                
                const otherUser = otherParticipants[0];
                const latestMessage = conv.latestMessage || {};
                const isLastMessageMine = latestMessage.sender && 
                    latestMessage.sender._id && latestMessage.sender._id.toString() === currentUserId.toString();
                const unreadCount = await Message.countDocuments({
                    conversation: conv._id,
                    sender: { $ne: currentUserId },
                    read: false
                });

                chatList.push({
                    _id: otherUser._id,
                    name: otherUser.name || otherUser.username || 'Unknown User',
                    email: otherUser.email || 'No email',
                    profileImage: otherUser.profileImage,
                    conversationId: conv._id,
                    lastMessage: latestMessage.content || 'No messages yet',
                    lastMessageTime: latestMessage.createdAt || conv.updatedAt,
                    isLastMessageMine,
                    unreadCount
                });
            } catch (err) {
                console.error(`Error processing conversation ${conv._id}:`, err);
            }
        }
        
        let selectedChat = null;
        let messages = [];
        let selectedConversationId = null;

        if (selectedUserId) {
            console.log(`Processing selected chat with user: ${selectedUserId}`);
            const conversation = await Conversation.findOne({
                participants: { 
                    $all: [currentUserId, selectedUserId],
                    $size: 2 
                }
            }).populate('participants', 'name username email profileImage');
            
            if (!conversation) {
                console.log(`No existing conversation with user ${selectedUserId}, creating placeholder`);
                const selectedUser = await User.findById(selectedUserId);
                if (selectedUser) {
                    selectedChat = {
                        _id: "new_conversation",
                        participants: [
                            {
                                _id: currentUserId,
                                name: currentUser.name || currentUser.username,
                                email: currentUser.email,
                                profileImage: currentUser.profileImage
                            },
                            {
                                _id: selectedUserId,
                                name: selectedUser.name || selectedUser.username,
                                email: selectedUser.email,
                                profileImage: selectedUser.profileImage
                            }
                        ]
                    };
                } else {
                    console.log(`Selected user ${selectedUserId} not found`);
                }
            } else {
                console.log(`Found existing conversation: ${conversation._id}`);

                selectedChat = conversation;
                selectedConversationId = conversation._id;

                messages = await Message.find({ conversation: selectedConversationId })
                    .populate('sender', 'name username email profileImage')
                    .sort({ createdAt: 1 });

                console.log(`Found ${messages.length} messages in conversation`);
                if (messages.length > 0) {
                    const updateResult = await Message.updateMany(
                        {
                            conversation: selectedConversationId,
                            sender: { $ne: currentUserId },
                            read: false
                        },
                        { $set: { read: true } }
                    );
                    
                    console.log(`Marked ${updateResult.modifiedCount} messages as read`);
                }
            }
        }

        res.render('chat-list', {
            currentUser: {
                _id: currentUserId,
                username: currentUser.username || 'Unknown',
                name: currentUser.name || currentUser.username || 'Unknown User',
                email: currentUser.email || 'No email',
                profileImage: currentUser.profileImage
            },
            users: chatList,
            selectedUserId,
            selectedChat,
            selectedConversationId,
            messages,
            title: 'Chat',
            layout: false
        });

    } catch (error) {
        console.error('Error loading chat:', error);
        res.status(500).render('error', { 
            message: 'Error loading chat',
            error: error,
            layout: false
        });
    }
};

const renderChatPage = async (req, res) => {
    try {
        const currentUserId = req.session.userId;
        const otherUserId = req.params.userId;

        if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
            return res.status(400).render('error', {
                message: 'Invalid user ID',
                error: new Error('Invalid user ID format'),
                layout: false
            });
        }
        const currentUser = await User.findById(currentUserId);
        if (!currentUser) {
            throw new Error('Current user not found');
        }
        const otherUser = await Mentor.findById(otherUserId);
        if (!otherUser) {
            return res.status(404).render('error', {
                message: 'User not found',
                error: new Error('User not found'),
                layout: false
            });
        }
        let conversation = await Conversation.findOne({
            participants: { $all: [currentUserId, otherUser.user] }
        });

        let messages = [];
        if (conversation) {
            messages = await Message.find({ conversation: conversation._id })
                .sort('createdAt')
                .populate('sender', 'name username email profileImage')
                .lean();
            await Message.updateMany(
                {
                    conversation: conversation._id,
                    sender: otherUser.user,
                    read: false
                },
                { $set: { read: true } }
            );
            messages = messages.map(message => ({
                _id: message._id,
                sender: message.sender,
                message: message.content, 
                content: message.content,
                timestamp: message.createdAt,
                read: message.read,
                isEdited: message.isEdited
            }));
        }
        const currentUserMentor = await Mentor.findOne({ user: currentUserId });
        const otherUserMentor = await Mentor.findOne({ user: otherUserId });

        res.render('chat', {
            currentUser: {
                _id: currentUserId,
                name: currentUser.name || currentUser.username,
                mentorId: currentUserMentor ? currentUserMentor._id : null,
                model: currentUserMentor ? 'Mentor' : 'User'
            },
            otherUser: {
                _id: otherUserId,
                name: otherUser.name || otherUser.username,
                mentorId: otherUserMentor ? otherUserMentor._id : null,
                model: otherUserMentor ? 'Mentor' : 'User'
            },
            messages: messages,
            conversation: conversation || null,
            title: `Chat with ${otherUser.name || otherUser.username}`,
            layout: false
        });
    } catch (error) {
        console.error('Error loading chat:', error);
        res.status(500).render('error', { 
            message: 'Error loading chat',
            error: error,
            layout: false
        });
    }
};

module.exports={
    getUnreadCount,
    renderChatList,
    renderChatPage
}