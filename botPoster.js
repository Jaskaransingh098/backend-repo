const mongoose = require("mongoose");
const axios = require("axios");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const cron = require("node-cron");
dotenv.config();

const { OpenAI } = require("openai");

const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,          
    baseURL: "https://api.groq.com/openai/v1", 
});

const User = require("./models/User");
const Idea = require("./models/Idea");

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("✅ MongoDB connected for botPoster");
}).catch(err => {
    console.error("❌ MongoDB connection error:", err.message);
});

cron.schedule("0 */12 * * *", async () => {
    if (process.env.ENABLE_BOTS !== "true") {
        console.log("🛑 Bot posting is disabled (.env)");
        return;
    }

    try {
        await postBotIdea();
    } catch (err) {
        console.error("❌ Error in bot posting:", err.message);
    }
});
// (async () => {
//     try {
//         console.log("🚀 Running bot posting test manually...");
//         await postBotIdea();
//     } catch (err) {
//         console.error("❌ Error in bot posting:", err.message);
//     }
// })();


async function getRealUserInfo() {
    try {
        const res = await axios.get("https://fakerapi.it/api/v1/persons?_quantity=1");
        const person = res.data.data[0];

        const first = person.firstname;
        const last = person.lastname;
        const fullName = `${first} ${last}`;
        const randomNum = Math.floor(Math.random() * 10000);

        const username = `${first}${last}${randomNum}`.toLowerCase();
        const email = `${first}.${last}${randomNum}@example.com`.toLowerCase();

        console.log("✅ Fetched user:", fullName, username, email);

        return { fullName, username, email };
    } catch (err) {
        console.error("❌ Failed to fetch user from API:", err.message);
        const fallback = Math.floor(Math.random() * 100000);
        return {
            fullName: `BotUser${fallback}`,
            username: `bot${fallback}`,
            email: `bot${fallback}@example.com`,
        };
    }
}




async function postBotIdea() {
    const existingBots = await User.find({ isBot: true });

    const useExisting = existingBots.length > 0 && Math.random() < 0.5;
    let botUser;

    if (useExisting) {
        botUser = existingBots[Math.floor(Math.random() * existingBots.length)];
        console.log(`🤖 Reusing bot: ${botUser.username}`);
    } else {
        let tries = 0;
        let uniqueUsername = "", uniqueEmail = "", fullName = "";

        do {
            const userInfo = await getRealUserInfo();
            fullName = userInfo.fullName;

            const existing = await User.findOne({
                $or: [{ username: userInfo.username }, { email: userInfo.email }],
            });

            if (!existing) {
                uniqueUsername = userInfo.username;
                uniqueEmail = userInfo.email;
                break;
            }

            tries++;
        } while (tries < 5);

        if (!uniqueUsername || !uniqueEmail) {
            console.error("❌ Failed to generate unique bot username/email after 5 tries.");
            return;
        }

        const hashedPassword = await bcrypt.hash("botsecure123", 10);

        botUser = await User.create({
            username: uniqueUsername,
            email: uniqueEmail,
            password: hashedPassword,
            isBot: true,
            isVerified: true,
        });

        console.log(`🆕 New bot registered: ${uniqueUsername}`);
    }

    const gptIdea = await generateIdeaFromGPT();
    if (!gptIdea) return;

    const newIdea = new Idea({
        username: botUser.username,
        topic: gptIdea.topic,
        description: gptIdea.description,
        stage: gptIdea.stage,
        market: gptIdea.market,
        goals: gptIdea.goals,
        fullName: gptIdea.fullName, // ✅ Always use GPT-generated name
        email: botUser.email,
        role: gptIdea.role,
        startupName: gptIdea.startupName,
        industry: gptIdea.industry,
    });

    await newIdea.save();
    console.log(`✅ GPT idea posted by ${botUser.username}`);
    console.log("🧠 Idea:", gptIdea);
}




async function generateIdeaFromGPT() {
    try {
        const res = await openai.chat.completions.create({
            model: "llama3-70b-8192",
            messages: [
                {
                    role: "system",
                    content: "You are a creative assistant that generates startup ideas in structured JSON format for a platform. Each idea must match the allowed dropdown options used in a web form.",
                },
                {
                    role: "user",
                    content: `Generate a startup idea in JSON format with the following structure. Fields like "industry", "stage", and "goals" must randomly choose from these allowed options only:

industry: ["ecommerce", "health", "education", "tech", "food", "finance", "manufacturing", "fashion"]
stage: ["idea", "prototype", "launched"]
goals: ["short", "long", "social"]

Format:
{
  "topic": "string",
  "description": "string (short idea summary)",
  "stage": "one of allowed values",
  "market": "e.g., Global, India, B2B, etc.",
  "goals": "one of allowed values",
  "fullName": "realistic name",
  "role": "Founder or Innovator",
  "startupName": "realistic name",
  "industry": "one of allowed values"
}

Only return the pure JSON. No explanation, no markdown.`,
                },
            ],
            temperature: 0.9,
        });

        const content = res.choices[0].message.content.trim();

        // Safety fallback to remove markdown if returned
        const cleaned = content.replace(/```json|```/g, "").trim();

        return JSON.parse(cleaned);
    } catch (err) {
        console.error("❌ GPT idea generation failed:", err.message);
        return null;
    }
}
