const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    let token = req.header('x-auth-token') || req.header('authorization') || req.header('Authorization');
    if (token && typeof token === 'string' && token.startsWith('Bearer ')) {
        token = token.slice(7).trim();
    }
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

const checkRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ msg: 'Access denied: Insufficient permissions' });
        }
        next();
    };
};

module.exports = { auth, checkRole };
