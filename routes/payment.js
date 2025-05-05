const express = require('express');
const router = express.Router();
const User = require('../models/User')
const authenticateToken = require('../middleware/authenticateToken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


router.post('/create-payment-session', authenticateToken, async(req,res) => {
    const {price} = req.body;
    try{
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: "payment",
            line_items: [
                {
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name: 'InnoLink Subscription',
                        },
                        unit_amount: price * 100,
                    },
                    quantity: 1,
                },
            ],
            success_url: 'http://localhost:5173/success',
            cancel_url: 'http://localhost:5173/success'
        });
        res.json({ url: session.url});
    } catch(err){
        console.log(err);
        res.status(500).send("Error creating payment session");
    }
});

router.post('/payment-success', authenticateToken, async (req,res) => {
    try{
        const user = await User.findById(req.user.id);
        if (user.isPro) {
            return res.status(400).json({ message: "User is already a Pro member" });
        }

        // Update the 'isPro' field to true in the database
        await User.findByIdAndUpdate(req.user.id, { isPro: true });

        // Re-sign the JWT token to include the updated 'isPro' field
        const updatedUser = await User.findById(req.user.id); // Get updated user data
        const newToken = jwt.sign(
            { 
                id: updatedUser._id, 
                username: updatedUser.username, 
                isPro: updatedUser.isPro,  // Include updated 'isPro' in the token
                activePlan: updatedUser.activePlan 
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        res.json({ message: "User upgrade  to pro"});
    } catch(err){
        console.log(err);
        res.status(500).send("Failed to upgrade user");
    }
})

module.exports = router;