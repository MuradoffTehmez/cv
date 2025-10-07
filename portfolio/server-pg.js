const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// CORS tənzimləmələri
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'];
const corsOptions = {
    origin: allowedOrigins,
    credentials: true,
    optionsSuccessStatus: 200
};

// Middleware-lər
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Statik fayllar üçün middleware (yalnız public qovluğu)
app.use(express.static(path.join(__dirname, 'public')));

// PostgreSQL Pool yarat
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'portfolio',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

// Cədvəlləri yarat
const createTables = async () => {
    try {
        // İstifadəçilər cədvəli
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(30) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'user',
                profile_name VARCHAR(50) DEFAULT '',
                profile_title VARCHAR(100) DEFAULT '',
                profile_bio VARCHAR(500) DEFAULT '',
                profile_location VARCHAR(100) DEFAULT '',
                profile_phone VARCHAR(20) DEFAULT '',
                profile_avatar VARCHAR(255) DEFAULT '',
                profile_social_linkedin VARCHAR(255) DEFAULT '',
                profile_social_github VARCHAR(255) DEFAULT '',
                profile_social_twitter VARCHAR(255) DEFAULT '',
                reset_password_token VARCHAR(255),
                reset_password_expire TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Layihələr cədvəli
        await pool.query(`
            CREATE TABLE IF NOT EXISTS projects (
                id SERIAL PRIMARY KEY,
                title VARCHAR(100) NOT NULL,
                description TEXT NOT NULL,
                technologies TEXT[],
                start_date DATE NOT NULL,
                end_date DATE,
                status VARCHAR(20) DEFAULT 'active',
                image_url VARCHAR(255),
                project_url VARCHAR(255),
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Cədvəllər uğurla yaradıldı');
    } catch (err) {
        console.error('Cədvəl yaratma xətası:', err);
    }
};

// JWT token yarat
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};

// Giriş icazəsi middleware
const auth = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Tokeni götür
            token = req.headers.authorization.split(' ')[1];

            // Tokeni doğrula
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // İstifadəçini token-dən götür
            const userResult = await pool.query('SELECT id, username, email, role FROM users WHERE id = $1', [decoded.id]);
            req.user = userResult.rows[0];

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

// Admin icazəsi middleware
const admin = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Giriş icazəsi yoxdur'
        });
    }

    // İstifadəçini yenidən bazadan götür və ən son rolu ilə yoxla
    try {
        const userResult = await pool.query('SELECT id, username, email, role FROM users WHERE id = $1', [req.user.id]);
        const user = userResult.rows[0];
        
        if (!user || user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Giriş icazəsi yoxdur. Yalnız admin istifadəçilərə icazə verilir'
            });
        }

        // İstifadəçi məlumatlarını req obyektinə yenilə
        req.user = user;
        next();
    } catch (error) {
        console.error('Admin icazəsi yoxlanarkən xəta:', error);
        return res.status(500).json({
            success: false,
            message: 'Server xətası'
        });
    }
};

// Autentifikasiya route-ları
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Şifrəni hash et
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Yeni istifadəçi yarat
        const result = await pool.query(
            `INSERT INTO users (username, email, password) 
             VALUES ($1, $2, $3) 
             RETURNING id, username, email, role`,
            [username, email, hashedPassword]
        );

        const user = result.rows[0];
        const token = generateToken(user.id);

        res.status(201).json({
            success: true,
            message: 'İstifadəçi uğurla qeydiyyatdan keçdi',
            token,
            user
        });
    } catch (error) {
        console.error('Qeydiyyat xətası:', error);
        if (error.constraint && error.constraint.includes('users_username_key')) {
            return res.status(400).json({
                success: false,
                message: 'Bu istifadəçi adı artıq mövcuddur'
            });
        }
        if (error.constraint && error.constraint.includes('users_email_key')) {
            return res.status(400).json({
                success: false,
                message: 'Bu email artıq mövcuddur'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server xətası'
        });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // İstifadəçini tap
        const result = await pool.query(
            'SELECT id, username, email, password, role FROM users WHERE username = $1 OR email = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'İstifadəçi adı və ya şifrə səhvdir'
            });
        }

        const user = result.rows[0];

        // Şifrəni yoxla
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'İstifadəçi adı və ya şifrə səhvdir'
            });
        }

        // Token yarat
        const token = generateToken(user.id);

        res.status(200).json({
            success: true,
            message: 'Giriş uğurludur',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Giriş xətası:', error);
        res.status(500).json({
            success: false,
            message: 'Server xətası'
        });
    }
});

app.get('/api/auth/me', auth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, username, email, role, profile_name, profile_title, profile_bio, profile_location, profile_phone, profile_avatar, profile_social_linkedin, profile_social_github, profile_social_twitter FROM users WHERE id = $1',
            [req.user.id]
        );

        const user = result.rows[0];

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error('İstifadəçi məlumatı xətası:', error);
        res.status(500).json({
            success: false,
            message: 'Server xətası'
        });
    }
});

// İstifadəçi route-ları
app.get('/api/user/profile', auth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, username, email, role, profile_name, profile_title, profile_bio, profile_location, profile_phone, profile_avatar, profile_social_linkedin, profile_social_github, profile_social_twitter FROM users WHERE id = $1',
            [req.user.id]
        );

        const user = result.rows[0];

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Profil məlumatı xətası:', error);
        res.status(500).json({
            success: false,
            message: 'Server xətası'
        });
    }
});

// İstifadəçi profilini yenilə
app.put('/api/user/profile', auth, async (req, res) => {
    try {
        const { profile } = req.body;
        
        // Profil məlumatlarını yenilə
        const result = await pool.query(
            `UPDATE users 
             SET profile_name = $1, profile_title = $2, profile_bio = $3, 
                 profile_location = $4, profile_phone = $5, 
                 profile_social_linkedin = $6, profile_social_github = $7, 
                 profile_social_twitter = $8,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $9
             RETURNING id, username, email, role, profile_name, profile_title, profile_bio, profile_location, profile_phone, profile_avatar, profile_social_linkedin, profile_social_github, profile_social_twitter`,
            [
                profile.profile_name || '',
                profile.profile_title || '',
                profile.profile_bio || '',
                profile.profile_location || '',
                profile.profile_phone || '',
                profile.profile_social_linkedin || '',
                profile.profile_social_github || '',
                profile.profile_social_twitter || '',
                req.user.id
            ]
        );

        const user = result.rows[0];

        res.status(200).json({
            success: true,
            message: 'Profil uğurla yeniləndi',
            user
        });
    } catch (error) {
        console.error('Profil yeniləmə xətası:', error);
        res.status(500).json({
            success: false,
            message: 'Server xətası'
        });
    }
});

// Şifrəni dəyiş
app.put('/api/user/changepassword', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Cari istifadəçini şifrə ilə birlikdə götür
        const userResult = await pool.query(
            'SELECT id, password FROM users WHERE id = $1',
            [req.user.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'İstifadəçi tapılmadı'
            });
        }

        const user = userResult.rows[0];

        // Cari şifrəni yoxla
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Hazırkı şifrə səhvdir'
            });
        }

        // Yeni şifrəni hash et
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        // Yeni şifrəni yenilə
        await pool.query(
            'UPDATE users SET password = $1 WHERE id = $2',
            [hashedNewPassword, req.user.id]
        );

        res.status(200).json({
            success: true,
            message: 'Şifrə uğurla dəyişdirildi'
        });
    } catch (error) {
        console.error('Şifrə dəyişmə xətası:', error);
        res.status(500).json({
            success: false,
            message: 'Server xətası'
        });
    }
});

// Frontend üçün layihələri əldə et (giriş tələb olunmur)
app.get('/api/projects', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.id, p.title, p.description, p.technologies, p.start_date, p.end_date, p.status, 
                   p.image_url, p.project_url, u.username as user_username
            FROM projects p
            JOIN users u ON p.user_id = u.id
            ORDER BY p.created_at DESC
        `);

        const projects = result.rows;

        res.status(200).json({
            success: true,
            projects
        });
    } catch (error) {
        console.error('Layihələr xətası:', error);
        res.status(500).json({
            success: false,
            message: 'Server xətası'
        });
    }
});

// Ana səhifə məlumatları (giriş tələb olunmur)
app.get('/api/homepage', async (req, res) => {
    try {
        // Ən son 3 layihəni əldə et
        const projectsResult = await pool.query(`
            SELECT p.id, p.title, p.description, p.technologies, p.start_date, p.end_date, p.status, 
                   p.image_url, p.project_url, u.username as user_username
            FROM projects p
            JOIN users u ON p.user_id = u.id
            ORDER BY p.created_at DESC
            LIMIT 3
        `);

        // Statistika məlumatları
        const statsResult = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM projects) as total_projects
        `);

        const homepageData = {
            recentProjects: projectsResult.rows,
            stats: statsResult.rows[0]
        };

        res.status(200).json({
            success: true,
            data: homepageData
        });
    } catch (error) {
        console.error('Ana səhifə məlumatı xətası:', error);
        res.status(500).json({
            success: false,
            message: 'Server xətası'
        });
    }
});

// Bütün istifadəçiləri əldə et (yalnız admin)
app.get('/api/admin/users', auth, admin, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC');
        
        res.status(200).json({
            success: true,
            users: result.rows
        });
    } catch (error) {
        console.error('İstifadəçilər xətası:', error);
        res.status(500).json({
            success: false,
            message: 'Server xətası'
        });
    }
});

// Bütün layihələri əldə et (yalnız admin)
app.get('/api/admin/projects', auth, admin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.id, p.title, p.description, p.technologies, p.start_date, p.end_date, p.status, 
                   p.image_url, p.project_url, u.username as user_username, u.email as user_email
            FROM projects p
            JOIN users u ON p.user_id = u.id
            ORDER BY p.created_at DESC
        `);

        res.status(200).json({
            success: true,
            projects: result.rows
        });
    } catch (error) {
        console.error('Admin layihələri xətası:', error);
        res.status(500).json({
            success: false,
            message: 'Server xətası'
        });
    }
});

// Server başlayanda cədvəlləri yarat
createTables().then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server ${PORT} portunda işləyir...`);
    });
});