const mongoose = require('mongoose');


const commentSchema = new mongoose.Schema({
    username: String,
    text: String,
    createdAt: { type: Date, default: Date.now },
});


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
    comment: [commentSchema],
    likes: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Idea', ideaSchema);