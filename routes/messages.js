

const express = require('express');
const router = express.Router();

let messages = [
    { sender: 'User1', recipient: 'User2', message: 'Hello!', timestamp: new Date() },
    { sender: 'User2', recipient: 'User1', message: 'Hi there!', timestamp: new Date() },
];

// Mock user list (replace with a database in production)
const users = ['User1', 'User2', 'User3'];

// Get all users
router.get('/users', (req, res) => {
    res.json(users);
});

// Get messages between two users
router.get('/messages/:sender/:recipient', (req, res) => {
    const { sender, recipient } = req.params;
    const conversation = messages.filter(
        (msg) =>
            (msg.sender === sender && msg.recipient === recipient) ||
            (msg.sender === recipient && msg.recipient === sender)
    );
    res.json(conversation);
});

// Post a new message
router.post('/messages', (req, res) => {
    const { sender, recipient, message } = req.body;
    if (!sender || !recipient || !message) {
        return res.status(400).json({ error: 'Sender, recipient, and message are required' });
    }
    const newMessage = { sender, recipient, message, timestamp: new Date() };
    messages.push(newMessage);
    res.json(newMessage);
});

module.exports = router;