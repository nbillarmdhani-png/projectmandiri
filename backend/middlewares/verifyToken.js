const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(403).json({ message: 'Token tidak disediakan.' });

    const token = authHeader.split(' ')[1]; // Format: Bearer <token>
    if (!token) return res.status(403).json({ message: 'Format token salah.' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Sesi telah kadaluarsa atau token tidak valid.' });
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    });
};

const verifyAdmin = (req, res, next) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ message: 'Akses ditolak. Membutuhkan hak akses admin.' });
    }
    next();
};

module.exports = { verifyToken, verifyAdmin };
