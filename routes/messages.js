const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken'); // adjust path
const Message = require("../models/Message");

router.get('/users', authenticateToken, async (req, res) => {
    try {
        const username = req.user.username;
        const messages = await Message.find({
            $or: [{ sender: username }, { recipient: username }]
        });

        const chatPartners = new Set();
        messages.forEach((msg) => {
            if (msg.sender === username) chatPartners.add(msg.recipient);
            if (msg.recipient === username) chatPartners.add(msg.sender);
        });

        res.json([...chatPartners]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ✅ Get messages between two users
router.get('/messages/:sender/:recipient', authenticateToken, async (req, res) => {
    const { sender, recipient } = req.params;
    const requester = req.user.username;

    if (requester !== sender && requester !== recipient) {
        return res.status(403).json({ error: 'Access denied' });
    }

    try {
        const conversation = await Message.find({
            $or: [
                { sender, recipient },
                { sender: recipient, recipient: sender }
            ]
        }).sort({ timestamp: 1 }); // chronological order

        res.json(conversation);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ✅ Save new message to MongoDB
router.post('/messages', authenticateToken, async (req, res) => {
    const { sender, recipient, message } = req.body;
    const requester = req.user.username;

    if (!sender || !recipient || !message) {
        return res.status(400).json({ error: 'Sender, recipient, and message are required' });
    }

    if (requester !== sender) {
        return res.status(403).json({ error: 'Sender mismatch with token' });
    }

    try {
        const newMessage = new Message({ sender, recipient, message });
        await newMessage.save();
        res.json(newMessage);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Could not save message' });
    }
});

module.exports = router;