const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const http = require('http');
require('dotenv').config();
const { initializeSocket } = require('./socket'); 
const flash = require('connect-flash');
const app = express();
const server = http.createServer(app);
const io = initializeSocket(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('layout', 'layout');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
    secret: 'your-secret-key',
    resave: true,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: 'mongodb://localhost:27017/ongrounds',
        ttl: 24 * 60 * 60, 
        autoRemove: 'native'
    }),
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000,
        secure: false,
        httpOnly: true,
        sameSite: 'strict'
    }
}));
app.use(flash());
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

const chatRoutes = require('./routes/chat');
app.use('/chat', chatRoutes);

const messageRoutes = require('./routes/message');
app.use('/message', messageRoutes);

const mentorRoutes = require('./routes/mentor');
app.use("/mentor", mentorRoutes);

const adminRoutes = require('./routes/admin');
app.use("/admin", adminRoutes);

const wishlistRoutes = require('./routes/wishlist');
app.use('/wishlist', wishlistRoutes);

const bookingRoutes = require("./routes/booking");
app.use('/book', bookingRoutes);

const userRoutes = require('./routes/user');
app.use('/', userRoutes);

app.use((req, res, next) => {
    console.log('\n=== Session Debug Info ===');
    console.log('Session ID:', req.session.id);
    console.log('Admin ID:', req.session.adminId);
    console.log('Is Admin:', req.session.isAdmin);
    console.log('Full Session:', req.session);
    console.log('========================\n');
    next();
});

mongoose.connect('mongodb+srv://nayan:jaihind1480@cluster0.2skqcsw.mongodb.net/ongrounds?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});