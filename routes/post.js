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

router.get("/trending", async (req, res) => {
    try {
        const posts = await idea.aggregate([
            {
                $addFields: {
                    likesCount: { $size: { $ifNull: ["$likes", []] } },
                    commentsCount: { $size: { $ifNull: ["$comments", []] } },
                },
            },
            {
                $addFields: {
                    score: {
                        $add: [
                            { $multiply: ["$views", 1] },
                            { $multiply: ["$likesCount", 2] },
                            { $multiply: ["$commentsCount", 3] },
                        ],
                    },
                },
            },
            { $sort: { score: -1 } },
            { $limit: 9 },
            {
                $project: {
                    _id: 1,
                    topic: 1,
                    description: 1,
                    stage: 1,
                    market: 1,
                    goals: 1,
                    fullName: 1,
                    email: 1,
                    role: 1,
                    startupName: 1,
                    industry: 1,
                    website: 1,
                    username: 1,
                    comments: 1,
                    likes: 1,
                    views: 1,
                    likesCount: 1,
                    commentsCount: 1
                },
            },
        ]);

        res.status(200).json({ posts });
    } catch (err) {
        console.error("🔥 Error in /trending:", err);
        res.status(500).json({ msg: "Trending route crashed", error: err.message });
    }
});

router.get("/random", async (req, res) => {

    const { industry } = req.query;

    try {

        const matchStage = industry
            ? { $match: { industry: { $regex: new RegExp(`^${industry}$`, "i") } } }
            : { $match: {} };



        const randomPosts = await idea.aggregate([
            { $sample: { size: 5 } },
            {
                $project: {
                    _id: 1,
                    topic: 1,
                    description: 1,
                    username: 1,
                    likes: 1,
                    comments: 1,
                },
            },
        ]);
        res.status(200).json({ posts: randomPosts });
    } catch (err) {
        console.error("Error fetching random posts:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const idea = await idea.findById(req.params.id);
        if (!idea) return res.status(404).json({ message: "Post not found" });
        res.status(200).json(idea);
    } catch (error) {
        res.status(500).json({ message: "Error fetching post", error });
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
router.delete('/:id/comments', authenticateToken, async (req, res) => {
    try {
        const { text } = req.body;
        const post = await idea.findById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        // Only delete your own comment
        const user = req.user.username;
        post.comments = post.comments.filter(
            (c) => !(c.username === user && c.text === text)
        );

        await post.save();
        res.status(200).json({ message: 'Comment deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Error deleting comment' });
    }
});
router.post("/:id/view", authenticateToken, async (req, res) => {
    const { username } = req.user;

    try {
        const post = await idea.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        // Optionally skip counting views for the post owner
        // if (post.username === username) {
        //     return res.status(200).json({ views: post.views });
        // }

        if (!post.viewedBy.includes(username)) {
            post.views += 1;
            post.viewedBy.push(username);
            await post.save();
        }

        res.status(200).json({ views: post.views });
    } catch (err) {
        res.status(500).json({ message: "Error incrementing views", error: err.message });
    }
});
router.get("/views", async (req, res) => {
    try {
        const posts = await idea.find({}, "topic views"); // send title + views only
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: "Error fetching views" });
    }
});

module.exports = router;