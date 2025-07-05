const express = require('express');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const nodemailer = require('nodemailer');
const otpGenerator = require("otp-generator");
const authenticateToken = require('../middleware/authenticateToken')

const JWT_SECRET =
    process.env.JWT_SECRET;


const otpStore = new Map();

router.get('/me', authenticateToken, async (req, res) => {
    try {
        // Find user by ID (stored in token payload) and return relevant details
        const user = await User.findById(req.user.id).select('username isPro activePlan'); // Adjust this to return required fields
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user); // Send user data back to frontend
    } catch (err) {
        console.error("Error fetching user data:", err);
        res.status(500).json({ msg: "Failed to fetch user data" });
    }
});

router.post('/signup', async (req, res) => {
    const { username, password, email, isPro } =
        req.body;

    console.log("SIGNUP REQUEST RECEIVED:");
    console.log("Username:", username);
    console.log("Email:", email);

    try {
        const userExists = await User.findOne({ username });
        if (userExists) return res.status(400).json({ msg: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword, isPro });
        await newUser.save();

        const token = jwt.sign({ id: newUser._id }, JWT_SECRET);
        res.json({ token });
    }
    catch (err) {
        console.error("Signup Error:", err);
        res.status(500).json({ msg: "Server error" });
    }

});
router.get('/check-username/:username', async (req, res) => {
    const { username } = req.params;

    try {
        const user = await User.findOne({ username });

        if (user) {
            return res.json({ exists: true });
        } else {
            return res.json({ exists: false });
        }
    } catch (err) {
        console.error("Username check error:", err);
        return res.status(500).json({ msg: "Server error" });
    }
});

router.post('/send-otp', async (req, res) => {
    const { email } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ msg: 'Email already registered' });
    }

    const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false });
    otpStore.set(email, otp);

    // Send email using Gmail
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.MAIL_USER,
        to: email,
        subject: 'Your OTP for InnoLinkk Signup',
        text: `Your OTP is ${otp}. It is valid for 10 minutes.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) return res.status(500).json({ msg: 'Failed to send OTP' });
        res.json({ msg: 'OTP sent successfully' });
    });
});

// Verify OTP
router.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    const storedOtp = otpStore.get(email);

    if (!storedOtp) return res.status(400).json({ msg: 'No OTP found. Try again.' });
    if (storedOtp !== otp) return res.status(400).json({ msg: 'Invalid OTP' });

    otpStore.delete(email); // remove after verification
    res.json({ msg: 'OTP verified' });
});

router.post('/login', async (req, res) => {
    const { username, password } =
        req.body
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: "Invalid credentials " })
        }
        const token = jwt.sign({ id: user._id, username: user.username, isPro: user.isPro, activePlan: user.activePlan }, JWT_SECRET, { expiresIn: "1h" });
        res.json({ token });
    }
    catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;