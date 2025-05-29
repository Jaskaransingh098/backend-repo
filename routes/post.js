const express = require('express')
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const idea = require('../models/Idea')
// let submittedIdeas = [];

//submit new idea
router.post('/', authenticateToken, async (req, res) => {
    const { topic, description, stage, market, goals, fullName, email, role, startupName, industry, website } = req.body;

    const user = req.user;
    if (!user) {
        return res.status(401).json({ msg: 'Unauthorized. Please log in.' });
    }

    if (!topic || !description || !stage || !market || !goals || !fullName || !email || !role || !startupName || !industry) {
        return res.status(400).json({ msg: 'Please fill out all required fields.' })

    }


    const newIdea = new idea({
        id: Date.now().toString(),
        username: req.user.username,
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
        comment: [],
        createdAt: new Date(),
    });
    await newIdea.save();

    res.status(201).json({ msg: 'Idea submitted successfully!', idea: newIdea });
});

//get all ideas
router.get('/', async (req, res) => {
    try {
        const ideas = await idea.find();
        res.status(200).json({ ideas });
    } catch (error) {
        res.status(500).json({ msg: 'Server error', error: error.message })
    }
})

//edit
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    const { description } = req.body;

    const index = submittedIdeas.findIndex(idea => idea.id === id);
    if (index === -1) {
        return res.status(404).json({ msg: 'Post not found ' });
    }
    if (submittedIdeas[index].username !== user.username) {
        return res.status(403).json({ msg: 'Forbidden : Not your post' });
    }
    if (!description) {
        return res.status(400).json({ msg: 'Description is required' });
    }

    submittedIdeas[index].description = description;
    res.status(200).json({ msg: "post updated successfully", idea: submittedIdeas[index] });
});

router.delete('/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const user = req.user;

    const index = submittedIdeas.findIndex(idea => idea.id === id);
    if (index === -1) {
        return res.status(404).json({ msg: 'Post not found' });
    }
    if (submittedIdeas[index].username !== user.username) {
        return res.status(403).json({ msg: 'Forbidden: not your post' });
    }

    submittedIdeas.splice(index, 1);
    res.status(200).json({ msg: 'Post deleted successfully ' });
})
//comment post
router.post('/:id/comments', authenticateToken, async(req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ msg: 'Comment text required' });

    try {
        const idea = await Idea.findById(req.params.id);
        if (!idea) return res.status(404).json({ msg: 'Post not found' });

        const comment = {
            username: req.user.username,
            text,
            createdAt: new Date(),
        };

        idea.comment.push(comment);
        await idea.save();

        res.status(201).json({ comment });
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
    // const { id } = req.params;
    // const { text } = req.body;
    // const user = req.user;

    // const index = submittedIdeas.findIndex(idea => idea.id === id);
    // if(index === -1){
    //     return res.status(404).json({ msg: 'Post not found '});
    // }

    // const comment = {
    //     username: user.username,
    //     text,
    //     createdAt: new Date(),
    // };

    // if (!submittedIdeas[index].comment) {
    //     submittedIdeas[index].comment = [];
    // }
    // submittedIdeas[index].comment.push(comment);

    // res.status(201).json({ msg: 'Comment added', comment});
})
router.put('/:id/like', authenticateToken, async (req, res) => {
    try {
        const idea = await Idea.findById(req.params.id);
        if (!idea) return res.status(404).json({ msg: 'Post not found' });

        const username = req.user.username;
        const likedIndex = idea.likes.indexOf(username);

        if (likedIndex === -1) {
            // Add like
            idea.likes.push(username);
        } else {
            // Remove like (unlike)
            idea.likes.splice(likedIndex, 1);
        }

        await idea.save();
        res.status(200).json({ likes: idea.likes.length });
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

module.exports = router;