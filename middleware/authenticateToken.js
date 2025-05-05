const jwt = require('jsonwebtoken')
const secretKey = "secretkey123";

function authenticateToken(req,res,next) {
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith("Bearer")) {
        return res.sendStatus(401);
    }
    const token = authHeader.split(' ')[1];


    
    jwt.verify(token, secretKey, (err, user) => {
        if(err){
            return res.sendStatus(403);
        } 
        req.user = user;
        next();
    });
}

module.exports = authenticateToken;