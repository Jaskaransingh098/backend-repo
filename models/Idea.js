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
    comments: [
        {
            username: String,
            text: String,
            createdAt: { type: Date, default: Date.now }
        }
    ],
    likes: [
        {
            type: String, // or ObjectId if you want to reference user
        },
    ],
    views: {
        type: Number,
        default: 0,
    },
    viewedBy: [
        {
            type: String,
        }
    ],
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Idea', ideaSchema);