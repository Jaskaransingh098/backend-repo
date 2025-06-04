const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const idea = require('../models/Idea');

// ✅ Submit new idea
router.post('/', authenticateToken, async (req, res) => {
    const { topic, description, stage, market, goals, fullName, email, role, startupName, industry, website } = req.body;
    const user = req.user;

    if (!user) {
        return res.status(401).json({ msg: 'Unauthorized. Please log in.' });
    }

    if (!topic || !description || !stage || !market || !goals || !fullName || !email || !role || !startupName || !industry) {
        return res.status(400).json({ msg: 'Please fill out all required fields.' });
    }

    const newidea = new idea({
        username: user.username,
        topic,
        description,
        stage,
        market,
        goals,
        fullName,
        email,
        role,
        startupName,
        industry,
        website: website || null,
        comments: [],
        createdAt: new Date(),
    });

    await newidea.save();
    res.status(201).json({ msg: 'idea submitted successfully!', idea: newidea });
});

// ✅ Get all ideas
router.get('/', async (req, res) => {
    try {
        const ideas = await idea.find();
        res.status(200).json({ ideas });
    } catch (error) {
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
});

// ✅ Edit post
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    const { description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: 'Invalid post ID' });
    }

    try {
        const foundidea = await idea.findById(id);
        if (!foundidea) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        if (foundidea.username !== user.username) {
            return res.status(403).json({ msg: 'Forbidden: Not your post' });
        }

        if (!description) {
            return res.status(400).json({ msg: 'Description is required' });
        }

        foundidea.description = description;
        await foundidea.save();

        res.status(200).json({ msg: 'Post updated successfully', idea: foundidea });
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ msg: 'Internal Server Error' });
    }
});

// ✅ Delete post
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: 'Invalid post ID' });
    }

    try {
        const foundidea = await idea.findById(id);
        if (!foundidea) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        if (foundidea.username !== user.username) {
            return res.status(403).json({ msg: 'Forbidden: Not your post' });
        }

        await idea.findByIdAndDelete(id);
        res.status(200).json({ msg: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ msg: 'Internal Server Error' });
    }
});

// ✅ Add comment to post
router.post('/:id/comments', authenticateToken, async (req, res) => {
    try {
        const post = await idea.findById(req.params.id);
        const newComment = {
            username: req.user.username,
            text: req.body.text,
        };

        post.comments.push(newComment);
        await post.save();

        res.status(201).json(newComment);
    } catch (err) {
        console.error("Error adding comment:", err);
        res.status(500).json({ message: "Internal server error" });
    }
    // const { id } = req.params;
    // const { text } = req.body;
    // const user = req.user;

    // if (!mongoose.Types.ObjectId.isValid(id)) {
    //     return res.status(400).json({ msg: 'Invalid post ID' });
    // }

    // if (!text || text.trim() === '') {
    //     return res.status(400).json({ msg: 'Comment text is required' });
    // }

    // try {
    //     const foundidea = await idea.findById(id);
    //     if (!foundidea) {
    //         return res.status(404).json({ msg: 'Post not found' });
    //     }

    //     const comment = {
    //         username: user.username,
    //         text,
    //         createdAt: new Date(),
    //     };

    //     foundidea.comments.push(comment);
    //     await foundidea.save();

    //     res.status(201).json({ msg: 'Comment added', comment });
    // } catch (error) {
    //     console.error('Error adding comment:', error);
    //     res.status(500).json({ msg: 'Internal Server Error' });
    // }
});
router.post('/:id/like', authenticateToken, async (req, res) => {
    try {
        const post = await idea.findById(req.params.id);
        const user = req.user.username; // or user._id

        const index = post.likes.indexOf(user);
        if (index === -1) {
            post.likes.push(user); // Like
        } else {
            post.likes.splice(index, 1); // Unlike
        }

        await post.save();
        res.json({ likes: post.likes });
    } catch (err) {
        console.error("Error toggling like:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});
router.get('/:id/liked', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: 'Invalid post ID' });
    }

    try {
        const foundidea = await idea.findById(id);
        if (!foundidea) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        const liked = foundidea.likes.includes(user.username);
        res.status(200).json({ liked });
    } catch (error) {
        console.error('Error checking like status:', error);
        res.status(500).json({ msg: 'Internal Server Error' });
    }
});
router.get('/:id/comments', async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: 'Invalid post ID' });
    }

    try {
        const foundidea = await idea.findById(id);
        if (!foundidea) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        res.status(200).json({ comments: foundidea.comments });
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ msg: 'Internal Server Error' });
    }
});

module.exports = router;