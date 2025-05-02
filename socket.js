const socketIo = require("socket.io");

let io;
const connectedUsers = new Map();

function initializeSocket(server) {
  if (io) {
    console.log("Socket.io already initialized");
    return io;
  }

  io = socketIo(server, {
    pingTimeout: 60000,
    cors: {
      origin: process.env.NODE_ENV === 'production' 
          ? ['https://vibe-nest-dyyi.vercel.app', process.env.FRONTEND_URL] 
          : 'http://localhost:3000',
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    },
  });
  io.on("connection", (socket) => {
    console.log("Connected to socket.io:", socket.id);
    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
    socket.on("setup", (userData) => {
      if (!userData || !userData._id) {
        socket.emit("connection_error", { error: "No user ID provided" });
        return;
      }

      const userId = userData._id;
      socket.userId = userId;
      connectedUsers.set(userId, socket.id);
      socket.join(userId);
      console.log(`User ${userId} connected with socket ID ${socket.id}`);
      
      socket.emit("connected");
      socket.broadcast.emit("user_status_change", {
        userId: userId,
        status: "online"
      });
    });
    socket.on("join chat", (room) => {
      if (!room) return;
      
      socket.join(room);
      console.log(`User ${socket.userId} joined room: ${room}`);
    });
    socket.on("typing", (data) => {
        if (!data || !data.room) return;
        socket.in(data.room).emit("typing", {
            room: data.room,
            user: data.user || socket.userId
        });
    });
    
    socket.on("stop typing", (data) => {
        if (!data || !data.room) return;
        socket.in(data.room).emit("stop typing", {
            room: data.room
        });
    });
    socket.on("new message", (newMessageReceived) => {
      const chat = newMessageReceived.chat;
      
      if (!chat || !chat.participants) {
        console.log("Chat or participants not defined");
        return;
      }
      
      chat.participants.forEach((user) => {
        if (user._id == newMessageReceived.sender._id) return;
        socket.in(user._id).emit("message recieved", newMessageReceived);
      });
    });
    
    socket.on("mark_read", (data) => {
      try {
        const { messageId, chatId, userId } = data;
        if (!messageId || !userId) return;
        io.to(chatId).emit("message_read", { 
          messageId,
          readBy: userId
        });
        
      } catch (error) {
        console.error("Error marking message as read:", error);
      }
    });
    socket.on("disconnect", () => {
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
        console.log(`User ${socket.userId} disconnected`);
        socket.broadcast.emit("user_status_change", {
          userId: socket.userId,
          status: "offline",
          lastSeen: new Date()
        });
      }
    });
  });

  return io;
}

function getIo() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

function getUserSocketId(userId) {
  return connectedUsers.get(userId);
}

function isUserOnline(userId) {
  return connectedUsers.has(userId);
}

module.exports = {
  initializeSocket,
  getIo,
  getUserSocketId,
  isUserOnline,
  get io() {
    if (!io) {
      throw new Error('Socket.io not initialized');
    }
    return io;
  }
};