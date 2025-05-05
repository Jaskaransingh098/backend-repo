const express = require('express')
const router = express.Router();

let messages = [
    { sender: 'User1', message: 'Hello!', timestamp: new Date() },
    { sender: 'User2', message: 'Hi there!', timestamp: new Date() },
];

router.get('/messages', (req, res) => {
    res.json(messages);
});

router.post('/messages', (req,res) => {
    const { message } = req.body;
    const sender = "Anonymous";
    const newMessage = { sender, message, timestamp: new Date() };
    messages.push(newMessage);
    res.json(newMessage);
});

module.exports = router;