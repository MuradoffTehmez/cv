const express = require('express');
<<<<<<< HEAD
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

const sendEmail = require('../utils/sendEmail');
const { auth } = require('../middleware/auth');

dotenv.config();

const router = express.Router();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'portfolio',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
});

const USER_FIELDS = [
    'id',
    'username',
    'email',
    'role',
    'profile_name',
    'profile_title',
    'profile_bio',
    'profile_location',
    'profile_phone',
    'profile_avatar',
    'profile_social_linkedin',
    'profile_social_github',
    'profile_social_twitter',
];

const DEFAULT_WINDOW_MS = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;

const createLimiter = (max, message) => rateLimit({
    windowMs: DEFAULT_WINDOW_MS,
    max,
    message: {
        success: false,
        message,
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const loginLimiter = createLimiter(
    Number(process.env.LOGIN_RATE_LIMIT_MAX) || 5,
    'Çox sayda giriş cəhdi. 15 dəqiqə sonra yenidən cəhd edin.'
);

const registerLimiter = createLimiter(
    Number(process.env.REGISTER_RATE_LIMIT_MAX) || 3,
    'Çox sayda qeydiyyat cəhdi. 15 dəqiqə sonra yenidən cəhd edin.'
);

const forgotPasswordLimiter = createLimiter(
    Number(process.env.FORGOT_PASSWORD_RATE_LIMIT_MAX) || 3,
    'Çox sayda şifrə sıfırlama cəhdi. Zəhmət olmasa daha sonra cəhd edin.'
);

const sanitizeUser = (user) => {
    const result = {};
    USER_FIELDS.forEach((field) => {
        result[field] = user[field] ?? null;
    });
    return result;
};

const isValidEmail = (email) => /^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/.test(String(email).trim());

const isStrongPassword = (password) => typeof password === 'string' && password.trim().length >= 8;

const generateToken = (userId) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured.');
    }

    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d',
    });
};

const hashPassword = async (plainPassword) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(plainPassword, salt);
};

const buildResetToken = () => {
    const raw = crypto.randomBytes(20).toString('hex');
    const hashed = crypto.createHash('sha256').update(raw).digest('hex');
    const expires = new Date(Date.now() + (Number(process.env.RESET_TOKEN_EXPIRE_MS) || 10 * 60 * 1000));

    return { raw, hashed, expires };
};

const respondWithAuthSuccess = (res, statusCode, message, user) => {
    const token = generateToken(user.id);
    res.status(statusCode).json({
        success: true,
        message,
        token,
        user: sanitizeUser(user),
    });
};

const handlePgError = (error, res) => {
    if (error && error.code === '23505') {
        if (error.constraint && error.constraint.includes('users_username_key')) {
            return res.status(400).json({
                success: false,
                message: 'Bu istifadəçi adı artıq mövcuddur.',
            });
        }
        if (error.constraint && error.constraint.includes('users_email_key')) {
            return res.status(400).json({
                success: false,
                message: 'Bu email artıq mövcuddur.',
            });
        }
    }

    console.error('PostgreSQL xətası:', error);
    return res.status(500).json({
        success: false,
        message: 'Server xətası',
    });
};

const buildUserSelectQuery = (additional = '') => `SELECT ${USER_FIELDS.join(', ')}${additional} FROM users`;

router.post('/register', registerLimiter, async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'İstifadəçi adı, email və şifrə tələb olunur.',
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Düzgün email daxil edin.',
            });
        }

        if (!isStrongPassword(password)) {
            return res.status(400).json({
                success: false,
                message: 'Şifrə ən azı 8 simvoldan ibarət olmalıdır.',
            });
        }

        const normalizedUsername = username.trim();
        const normalizedEmail = email.trim().toLowerCase();
        const hashedPassword = await hashPassword(password);

        const result = await pool.query(
            `INSERT INTO users (username, email, password)
             VALUES ($1, $2, $3)
             RETURNING ${USER_FIELDS.join(', ')}`,
            [normalizedUsername, normalizedEmail, hashedPassword]
        );

        respondWithAuthSuccess(res, 201, 'İstifadəçi uğurla qeydiyyatdan keçdi', result.rows[0]);
    } catch (error) {
        return handlePgError(error, res);
    }
});

router.post('/login', loginLimiter, async (req, res) => {
    try {
        const identifier = (req.body.username || req.body.email || '').trim();
        const { password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                message: 'İstifadəçi adı/email və şifrə tələb olunur.',
            });
        }

        const result = await pool.query(
            `${buildUserSelectQuery(', password')} WHERE username = $1 OR LOWER(email) = LOWER($1)`,
            [identifier]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'İstifadəçi adı və ya şifrə səhvdir.',
            });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'İstifadəçi adı və ya şifrə səhvdir.',
            });
        }

        const { password: _, ...userWithoutPassword } = user;
        respondWithAuthSuccess(res, 200, 'Giriş uğurludur', userWithoutPassword);
    } catch (error) {
        console.error('Giriş xətası:', error);
        return res.status(500).json({
            success: false,
            message: 'Server xətası',
        });
    }
});

router.get('/me', auth, async (req, res) => {
    try {
        const result = await pool.query(
            `${buildUserSelectQuery()} WHERE id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'İstifadəçi tapılmadı.',
            });
        }

        res.status(200).json({
            success: true,
            user: sanitizeUser(result.rows[0]),
        });
    } catch (error) {
        console.error('İstifadəçi məlumatı xətası:', error);
        return res.status(500).json({
            success: false,
            message: 'Server xətası',
        });
    }
});

router.post('/forgotpassword', forgotPasswordLimiter, async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Düzgün email daxil edin.',
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const userResult = await pool.query(
            `${buildUserSelectQuery()} WHERE email = $1`,
            [normalizedEmail]
        );

        if (userResult.rows.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'Əgər email mövcuddursa, şifrəni sıfırlamaq üçün təlimatlar göndərildi.',
            });
        }

        const user = userResult.rows[0];
        const resetToken = buildResetToken();

        await pool.query(
            `UPDATE users
             SET reset_password_token = $1,
                 reset_password_expire = $2
             WHERE id = $3`,
            [resetToken.hashed, resetToken.expires, user.id]
        );

        const baseUrl = (process.env.PASSWORD_RESET_URL || process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
        const resetUrl = `${baseUrl}/reset-password.html?token=${resetToken.raw}`;
        const message = [
            `Salam ${user.username || 'istifadəçi'},`,
            '',
            'Şifrənizi sıfırlamaq üçün aşağıdakı linkə daxil olun:',
            resetUrl,
            '',
            'Bu link 10 dəqiqədən sonra etibarsız olacaq.',
        ].join('\n');

        try {
            await sendEmail({
                email: user.email,
                subject: 'Şifrəni Sıfırlama Sorğusu',
                message,
            });
        } catch (emailError) {
            await pool.query(
                `UPDATE users
                 SET reset_password_token = NULL,
                     reset_password_expire = NULL
                 WHERE id = $1`,
                [user.id]
            );
            console.error('Email göndərilərkən xəta:', emailError);
            return res.status(500).json({
                success: false,
                message: 'Email göndərilərkən xəta baş verdi.',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Əgər email mövcuddursa, şifrəni sıfırlamaq üçün təlimatlar göndərildi.',
        });
    } catch (error) {
        console.error('Şifrə sıfırlama xətası:', error);
        return res.status(500).json({
            success: false,
            message: 'Server xətası',
        });
    }
});

router.put('/resetpassword/:resettoken', async (req, res) => {
    try {
        const { resettoken } = req.params;
        const { password } = req.body;

        if (!password || !isStrongPassword(password)) {
            return res.status(400).json({
                success: false,
                message: 'Yeni şifrə ən azı 8 simvoldan ibarət olmalıdır.',
            });
        }

        const hashedToken = crypto.createHash('sha256').update(resettoken).digest('hex');
        const userResult = await pool.query(
            `${buildUserSelectQuery()} WHERE reset_password_token = $1 AND reset_password_expire > NOW()`,
            [hashedToken]
        );

        if (userResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Reset token etibarsız və ya müddəti bitib.',
            });
        }

        const user = userResult.rows[0];
        const hashedPassword = await hashPassword(password);

        await pool.query(
            `UPDATE users
             SET password = $1,
                 reset_password_token = NULL,
                 reset_password_expire = NULL,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [hashedPassword, user.id]
        );

        respondWithAuthSuccess(res, 200, 'Şifrə uğurla sıfırlandı', user);
    } catch (error) {
        console.error('Şifrə sıfırlama təsdiqi xətası:', error);
        return res.status(500).json({
            success: false,
            message: 'Server xətası',
        });
    }
});

=======

// Legacy MongoDB-based auth routes have been retired in favour of the
// PostgreSQL implementation located in server.js. This placeholder router
// ensures that any accidental mounts fail fast with a clear response.
const router = express.Router();

router.use((req, res) => {
    res.status(410).json({
        success: false,
        message: 'Bu autentifikasiya endpoint-i köhnə MongoDB modeli üçündür və deaktiv edilib.'
    });
});

>>>>>>> f9297cf571769da439d04e75e53e93291bb41b0f
module.exports = router;
