require('dotenv').config();
const express = require("express")
const mongoose = require('mongoose')
const cors = require('cors')
const http = require('http');
const { Server } = require('socket.io');
const messageRoute = require('./routes/messages')
const paymentRoutes = require('./routes/payment')
const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/post");
const ContactRoute = require("./routes/contact");



const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://innolinkk.netlify.app",
        methods: ["GET", 'POST', 'PUT', 'DELETE', 'OPTIONS']
    }
});

//Middleware
// app.use(cors());
app.use(cors({
    origin: 'https://innolinkk.netlify.app',
    methods: ['GET', 'POST', "PUT", "DELETE", "OPTIONS"],
    credentials: true
}));
app.use(express.json())
//Routes
app.use("/api/auth", authRoutes);
app.use("/api/post", postRoutes);
app.use('/api', messageRoute)
app.use('/api', paymentRoutes);
app.use("/api/contact", ContactRoute);

io.on('connection', (socket) => {
    console.log('A user connected');

    // Broadcast new message to relevant users
    socket.on('newMessage', (msg) => {
        io.emit(`message:${msg.recipient}`, msg);
        io.emit(`message:${msg.sender}`, msg);
    });
    // Broadcast start of new conversation
    socket.on("startConversation", ({ sender, recipient }) => {
        io.emit("startConversation", { sender, recipient });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});
//connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
    .catch((err) => {
        console.log('Mongoose connection error: ', err.message);
    });




//start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
    console.log(`Server running on port ${PORT}`))


require('./botPoster');