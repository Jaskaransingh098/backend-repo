const express = require("express")
const router = express.Router();
const nodemailer = require("nodemailer")

router.post("/", async (req, res) => {
    console.log("📝 Contact form payload:", req.body);
    const { fullName, email, phone, message } = req.body;

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"InnoLinkk Contact Form" <${process.env.MAIL_USER}>`,
            to: process.env.MAIL_USER,
            replyTo: email,
            subject: "New Contact Form Submission",
            html: `
                <h3>Contact Form Submission</h3>
                <p><strong>Name:</strong> ${fullName}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Message:</strong><br/>${message}</p>
            `,
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: "Email sent successfully" });
    } catch (err) {
        console.log("Email sending error:", err);
        res.status(500).json({ success: false, message: " Email failed to send" })
    }
});

module.exports = router;