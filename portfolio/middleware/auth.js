const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Tokeni götür
            token = req.headers.authorization.split(' ')[1];

            // Tokeni doğrula
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // İstifadəçini token-dən tap və req-ə əlavə et
            req.user = await User.findById(decoded.id);
            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Giriş icazəsi yoxdur'
            });
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Giriş icazəsi yoxdur, zəhmət olmasa token daxil edin'
        });
    }
};

// Admin rolu yoxlaması
const admin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Giriş icazəsi yoxdur'
        });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Giriş icazəsi yoxdur. Yalnız admin istifadəçilərə icazə verilir'
        });
    }

    next();
};

module.exports = { auth, admin };