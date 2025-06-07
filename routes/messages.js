const express = require('express');
const router = express.Router();
const authenticateToken = require('./path-to-authenticateToken'); // adjust path

let messages = [
    { sender: 'User1', recipient: 'User2', message: 'Hello!', timestamp: new Date() },
    { sender: 'User2', recipient: 'User1', message: 'Hi there!', timestamp: new Date() },
];

// Mock user list
const users = ['User1', 'User2', 'User3'];

// GET all users (optional: protect this too)
router.get('/users', authenticateToken, (req, res) => {
    res.json(users);
});

// ✅ SECURE: Get messages between sender and recipient
router.get('/messages/:sender/:recipient', authenticateToken, (req, res) => {
    const { sender, recipient } = req.params;
    const requester = req.user.username;

    // Authorization: only allow if requester is part of the conversation
    if (requester !== sender && requester !== recipient) {
        return res.status(403).json({ error: 'Access denied' });
    }

    const conversation = messages.filter(
        (msg) =>
            (msg.sender === sender && msg.recipient === recipient) ||
            (msg.sender === recipient && msg.recipient === sender)
    );

    res.json(conversation);
});

// ✅ SECURE: Post a new message
router.post('/messages', authenticateToken, (req, res) => {
    const { sender, recipient, message } = req.body;
    const requester = req.user.username;

    if (!sender || !recipient || !message) {
        return res.status(400).json({ error: 'Sender, recipient, and message are required' });
    }

    // Ensure sender is actually the logged-in user
    if (requester !== sender) {
        return res.status(403).json({ error: 'Sender mismatch with token' });
    }

    const newMessage = { sender, recipient, message, timestamp: new Date() };
    messages.push(newMessage);
    res.json(newMessage);
});

module.exports = router;