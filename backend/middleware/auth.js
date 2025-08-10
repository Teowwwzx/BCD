const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authMiddleware = {};

authMiddleware.isLoggedIn = async function (req, res, next) {
  // Get token from header, removing 'Bearer ' prefix
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }
  const token = authHeader.split(' ')[1];

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // The decoded token payload should contain the user's ID
    const userId = decoded.id; // Make sure your JWT payload has `id`
    
    req.user = await prisma.user.findUnique({ where: { id: userId } });
    if (!req.user) {
        return res.status(401).json({ msg: 'User not found, authorization denied' });
    }
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};


authMiddleware.checkRole = function (allowedRoles) {
  // The returned function is the actual middleware
  return async (req, res, next) => {
    // First, run the isLoggedIn logic to make sure we have a valid user
    await authMiddleware.isLoggedIn(req, res, () => {
      // If isLoggedIn was successful, req.user will exist.
      // Now, check if the user's role is in the list of allowed roles.
      if (req.user && allowedRoles.includes(req.user.user_role)) {
        next(); // Role is allowed, proceed to the route handler
      } else {
        res.status(403).json({ msg: 'Forbidden: You do not have the required permissions.' });
      }
    });
  };
};


// module.exports = async function (req, res, next) {
//   // Get token from header
//   const token = req.header('Authorization');

//   // Check if not token
//   if (!token) {
//     return res.status(401).json({ msg: 'No token, authorization denied' });
//   }

//   // Verify token
//   try {
//     const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
//     req.user = await prisma.user.findUnique({ where: { id: decoded.user.id } });
//     next();
//   } catch (err) {
//     res.status(401).json({ msg: 'Token is not valid' });
//   }
// };

module.exports = authMiddleware;
