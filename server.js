require('dotenv').config();
const express = require("express")
const mongoose = require('mongoose')
const cors = require('cors')
const messageRoute = require('./routes/messages')
const paymentRoutes = require('./routes/payment')



const app = express();

//Middleware
app.use(cors());
app.use(express.json())
//Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/post' , require('./routes/post'));
app.use('/api', messageRoute)
app.use('/api', paymentRoutes);

//connection
mongoose.connect(process.env.MONGO_URI). then (() => console.log('MongoDB connected'))
    .catch((err) => {
        console.log('Mongoose connection error: ', err.message);
    });




//start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => 
    console.log(`Server running on port ${PORT}`))