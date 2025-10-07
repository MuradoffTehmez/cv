const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'portfolio',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
});

const auth = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const userResult = await pool.query('SELECT id, username, email, role FROM users WHERE id = $1', [decoded.id]);
            req.user = userResult.rows[0];

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Giriş icazəsi yoxdur',
                });
            }

            return next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Giriş icazəsi yoxdur',
            });
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Giriş icazəsi yoxdur, zəhmət olmasa token daxil edin',
        });
    }
};

const admin = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Giriş icazəsi yoxdur',
        });
    }

    try {
        const userResult = await pool.query('SELECT id, username, email, role FROM users WHERE id = $1', [req.user.id]);
        const user = userResult.rows[0];

        if (!user || user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Giriş icazəsi yoxdur. Yalnız admin istifadəçilərə icazə verilir',
            });
        }

        req.user = user;
        return next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Server xətası',
        });
    }
};

module.exports = { auth, admin };
