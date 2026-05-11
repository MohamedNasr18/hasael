const { verifyToken } = require('../utilities/tokenHandler');
const appError = require('../utilities/AppError');
const User = require('../models/user');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new appError('No token provided', 401));
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyToken(token); 
    
    const user = await User.findById(payload.id);
    
    if (!user) {
      return next(new appError('User no longer exists', 401));
    }

    req.user = user; 
    next();
  } catch (err) {
    return next(new appError('Invalid or expired token', 401));
  }
};
  
module.exports = protect;