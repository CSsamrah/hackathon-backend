const jwt = require('jsonwebtoken');
require('dotenv').config();
const jwtSecret = process.env.jwtSecret;

const verifyToken = (token) => {
    return jwt.verify(token, jwtSecret);
};

const authenticateToken=(req, res, next)=>{
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    if (token == null) return res.sendStatus(401);
  
    jwt.verify(token, jwtSecret, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
}; 
module.exports = authenticateToken,verifyToken;
