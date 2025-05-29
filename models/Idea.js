const mongoose = require('mongoose');

const ideaSchema = new mongoose.Schema({
    username: { type: String, required: true },
    topic: String,
    description: String,
    stage: String,
    market: String,
    goals: String,
    fullName: String,
    email: String,
    role: String,
    startupName: String,
    industry: String,
    website: String,
    likes: [{ type: String}],
    comment: [
        {
            username: String,
            text: String,
            createdAt: { type: Date, default: Date.now }
        }
    ],
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Idea', ideaSchema);