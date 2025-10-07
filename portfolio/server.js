const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const multer = require('multer');
const fs = require('fs');
const helmet = require('helmet');
const nodemailer = require('nodemailer');

const { auth, admin } = require('./middleware/auth');
const authRoutes = require('./routes/auth');

dotenv.config();

const app = express();

// Helmet ilə security header-ləri əlavə et
app.use(helmet());

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

// Statik fayllar üçün middleware (front-end)
const staticOptions = {
    index: false,
    dotfiles: 'ignore',
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
    setHeaders: (res, servedPath) => {
        if (servedPath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-store');
        }
    },
};

['css', 'images', 'js'].forEach((dir) => {
    app.use(`/${dir}`, express.static(path.join(__dirname, dir), staticOptions));
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    index: false,
    dotfiles: 'ignore',
}));

app.use('/api/auth', authRoutes);

const allowedStaticFiles = {
    '/': 'index.html',
    '/index.html': 'index.html',
    '/about.html': 'about.html',
    '/projects.html': 'projects.html',
    '/project-detail.html': 'project-detail.html',
    '/contact.html': 'contact.html',
    '/profile.html': 'profile.html',
    '/login.html': 'login.html',
    '/register.html': 'register.html',
    '/forgot-password.html': 'forgot-password.html',
    '/admin.html': 'admin.html',
    '/blog.html': 'blog.html',
    '/post-detail.html': 'post-detail.html',
    '/manifest.json': 'manifest.json',
};

app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return next();
    }

    const normalizedPath = req.path === '/' ? '/' : req.path;
    const targetFile = allowedStaticFiles[normalizedPath] || allowedStaticFiles[`${normalizedPath}.html`];

    if (targetFile) {
        return res.sendFile(path.join(__dirname, targetFile));
    }

    return next();
});

// Şəkilləri saxlamaq üçün uploads qovluğu yarat
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer konfiqurasiyası
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Fayl adını timestamp ilə əvəz et
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Yalnız şəkil fayllarına icazə ver
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Yalnız şəkil faylları yükləməyə icazə verilir!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

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
                demo_url VARCHAR(255),
                source_code_url VARCHAR(255),
                gallery_images TEXT[], -- şəkil URL-ləri arrayı
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Bloq məqalələri cədvəli
        await pool.query(`
            CREATE TABLE IF NOT EXISTS posts (
                id SERIAL PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                content TEXT NOT NULL,
                excerpt TEXT,
                slug VARCHAR(200) UNIQUE NOT NULL,
                featured_image VARCHAR(255),
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'published'
                published_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Rəylər cədvəli
        await pool.query(`
            CREATE TABLE IF NOT EXISTS comments (
                id SERIAL PRIMARY KEY,
                content TEXT NOT NULL,
                post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                parent_id INTEGER REFERENCES comments(id), -- cavablar üçün
                status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Əlaqə mesajları cədvəli
        await pool.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                subject VARCHAR(200) NOT NULL,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(
            'ALTER TABLE messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
        );

        console.log('Cədvəllər uğurla yaradıldı');
    } catch (err) {
        console.error('Cədvəl yaratma xətası:', err);
    }
};

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

// Profil şəkli yüklə
app.put('/api/user/avatar', auth, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Şəkil seçilməyib'
            });
        }

        // Şəkil yolunu verilənlər bazasında yenilə
        const avatarPath = `/uploads/${req.file.filename}`;
        await pool.query(
            'UPDATE users SET profile_avatar = $1 WHERE id = $2',
            [avatarPath, req.user.id]
        );
        res.status(200).json({
            success: true,
            message: 'Profil şəkli uğurla yeniləndi',
            avatarPath: avatarPath
        });
    } catch (error) {
        console.error('Profil şəkli yükləmə xətası:', error);
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



// Bütün istifadəçiləri əldə et (yalnız admin) - pagination və filtering ilə
app.get('/api/admin/users', auth, admin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const role = req.query.role || '';
        const offset = (page - 1) * limit;
        let whereClause = '';
        const queryParams = [];
        let paramIndex = 1;
        if (search) {
            whereClause += ` AND (username ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
            queryParams.push(`%${search}%`);
            paramIndex += 1;
        }
        if (role) {
            whereClause += ` AND role = $${paramIndex}`;
            queryParams.push(role);
            paramIndex += 1;
        }
        const limitParamPos = queryParams.length + 1;
        const offsetParamPos = queryParams.length + 2;
        const result = await pool.query(
            `SELECT id, username, email, role, created_at
             FROM users
             WHERE 1=1 ${whereClause}
             ORDER BY created_at DESC
             LIMIT $${limitParamPos} OFFSET $${offsetParamPos}`,
            [...queryParams, limit, offset]
        );
        const countResult = await pool.query(
            `SELECT COUNT(*) as total
             FROM users
             WHERE 1=1 ${whereClause}`,
            queryParams
        );
        const total = parseInt(countResult.rows[0].total, 10);
        const totalPages = Math.max(Math.ceil(total / limit), 1);
        res.status(200).json({
            success: true,
            users: result.rows,
            pagination: {
                currentPage: page,
                totalPages,
                totalUsers: total,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        });
    } catch (error) {
        console.error('İstifadəçilər xətası:', error);
        res.status(500).json({
            success: false,
            message: 'Server xətası',
        });
    }
});
// Bütün layihələri əldə et (yalnız admin) - pagination və filtering ilə
app.get('/api/admin/projects', auth, admin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const status = req.query.status || '';
        const offset = (page - 1) * limit;
        let whereClause = '';
        const queryParams = [];
        let paramIndex = 1;
        if (search) {
            whereClause += ` AND (p.title ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
            queryParams.push(`%${search}%`);
            paramIndex += 1;
        }
        if (status) {
            whereClause += ` AND p.status = $${paramIndex}`;
            queryParams.push(status);
            paramIndex += 1;
        }
        const limitParamPos = queryParams.length + 1;
        const offsetParamPos = queryParams.length + 2;
        const result = await pool.query(
            `SELECT p.id, p.title, p.description, p.technologies, p.start_date, p.end_date, p.status,
                    p.image_url, p.project_url, u.username as user_username, u.email as user_email
             FROM projects p
             JOIN users u ON p.user_id = u.id
             WHERE 1=1 ${whereClause}
             ORDER BY p.created_at DESC
             LIMIT $${limitParamPos} OFFSET $${offsetParamPos}`,
            [...queryParams, limit, offset]
        );
        const countResult = await pool.query(
            `SELECT COUNT(*) as total
             FROM projects p
             JOIN users u ON p.user_id = u.id
             WHERE 1=1 ${whereClause}`,
            queryParams
        );
        const total = parseInt(countResult.rows[0].total, 10);
        const totalPages = Math.max(Math.ceil(total / limit), 1);
        res.status(200).json({
            success: true,
            projects: result.rows,
            pagination: {
                currentPage: page,
                totalPages,
                totalProjects: total,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        });
    } catch (error) {
        console.error('Admin layihələri xətası:', error);
        res.status(500).json({
            success: false,
            message: 'Server xətası',
        });
    }
});
// BLOQ MƏQALƏLƏRİ API ENDPOINT'LƏRİ
// Bütün məqalələri əldə et (statusu published olanlar)
app.get('/api/posts', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        // Məlumatları əldə et
        const result = await pool.query(`
            SELECT p.id, p.title, p.excerpt, p.slug, p.featured_image, p.created_at, p.updated_at,
                   u.username as author_username
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.status = 'published'
            ORDER BY p.created_at DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);
        
        // Ümumi məqalə sayını əldə et
        const countResult = await pool.query(`
            SELECT COUNT(*) as total
            FROM posts
            WHERE status = 'published'
        `);
        
        const total = parseInt(countResult.rows[0].total, 10);
        const totalPages = Math.max(Math.ceil(total / limit), 1);
        
        res.status(200).json({
            success: true,
            posts: result.rows,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalPosts: total,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error('Məqalələr alınarkən xəta:', error);
        res.status(500).json({
            success: false,
            message: 'Server xətası'
        });
    }
});

// Məqaləni slug ilə əldə et
app.get('/api/posts/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        
        const result = await pool.query(`
            SELECT p.id, p.title, p.content, p.excerpt, p.slug, p.featured_image, 
                   p.created_at, p.updated_at, p.published_at,
                   u.username as author_username, u.profile_avatar as author_avatar
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.slug = $1 AND p.status = {paramIndex}'published'
        `, [slug]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Məqalə tapılmadı'
            });
        }
        
        // Məqaləni oxunan sayda artırmaq üçün əlavə funksionallıq (əgər lazımsa)
        const post = result.rows[0];
        
        res.status(200).json({
            success: true,
            post: post
        });
    } catch (error) {
        console.error('Məqalə alınarkən xəta:', error);
        res.status(500).json({
            success: false,
            message: 'Server xətası'
        });
    }
});

// Yeni məqalə yarat (yalnız admin)
app.post('/api/posts', auth, admin, upload.single('featured_image'), async (req, res) => {
    try {
        const { title, content, excerpt, status } = req.body;
        
        // Slug yaradırıq (kiçik hərf və tire ilə)
        const slug = title.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
        
        // Şəkil yoxlanır
        let featuredImage = null;
        if (req.file) {
            featuredImage = `/uploads/${req.file.filename}`;
        }
        
        // Məqaləni verilənlər bazasına əlavə edirik
        const result = await pool.query(`
            INSERT INTO posts (title, content, excerpt, slug, featured_image, user_id, status, published_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, CASE WHEN $7 = 'published' THEN NOW() ELSE NULL END)
            RETURNING id, title, slug, created_at, updated_at
        `, [title, content, excerpt, slug, featuredImage, req.user.id, status || 'draft']);
        
        res.status(201).json({
            success: true,
            message: 'Məqalə uğurla yaradıldı',
            post: result.rows[0]
        });
    } catch (error) {
        console.error('Məqalə yaradarkən xəta:', error);
        res.status(500).json({
            success: false,
            message: 'Server xətası'
        });
    }
});

// Məqaləni redaktə et (yalnız admin)
app.put('/api/posts/:id', auth, admin, upload.single('featured_image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, excerpt, status } = req.body;
        
        // Mövcud məqaləni yoxlayaq
        const existingPost = await pool.query('SELECT * FROM posts WHERE id = $1', [id]);
        if (existingPost.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Məqalə tapılmadı'
            });
        }
        
        // Mövcud məqalənin sahibi deyilsə və admin deyilsə icazə yoxdur
        if (existingPost.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Giriş icazəsi yoxdur'
            });
        }
        
        // Əgər başlıq dəyişilibsə, yeni slug yarat
        let slug = existingPost.rows[0].slug;
        if (title !== existingPost.rows[0].title) {
            slug = title.toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');
        }
        
        // Şəkil yoxlanır
        let featuredImage = existingPost.rows[0].featured_image;
        if (req.file) {
            featuredImage = `/uploads/${req.file.filename}`;
        }
        
        // Məqaləni yeniləyirik
        const result = await pool.query(`
            UPDATE posts
            SET title = $1, content = $2, excerpt = $3, slug = $4, 
                featured_image = $5, status = $6, updated_at = CURRENT_TIMESTAMP,
                published_at = CASE WHEN $6 = 'published' AND published_at IS NULL THEN NOW()
                                   WHEN $6 != 'published' THEN NULL
                                   ELSE published_at END
            WHERE id = $7
            RETURNING id, title, slug, status, created_at, updated_at
        `, [title, content, excerpt, slug, featuredImage, status, id]);
        
        res.status(200).json({
            success: true,
            message: 'Məqalə uğurla yeniləndi',
            post: result.rows[0]
        });
    } catch (error) {
        console.error('Məqalə yenilənərkən xəta:', error);
        res.status(500).json({
            success: false,
            message: 'Server xətası'
        });
    }
});

// Məqaləni sil (yalnız admin)
app.delete('/api/posts/:id', auth, admin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query('DELETE FROM posts WHERE id = $1', [id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Məqalə tapılmadı'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Məqalə uğurla silindi'
        });
    } catch (error) {
        console.error('Məqalə silinərkən xəta:', error);
        res.status(500).json({
            success: false,
            message: 'Server xətası'
        });
    }
});

// PROJEKT DETAYLARI API ENDPOINT'LƏRI
// Layihəni ID ilə əldə et
app.get('/api/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(`
            SELECT p.id, p.title, p.description, p.technologies, p.start_date, p.end_date, p.status, 
                   p.image_url, p.project_url, p.demo_url, p.source_code_url, p.gallery_images,
                   u.username as user_username
            FROM projects p
            JOIN users u ON p.user_id = u.id
            WHERE p.id = $1
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Layihə tapılmadı'
            });
        }
        
        res.status(200).json({
            success: true,
            project: result.rows[0]
        });
    } catch (error) {
        console.error('Layihə alınarkən xəta:', error);
        res.status(500).json({
            success: false,
            message: 'Server xətası'
        });
    }
});

// RƏYLƏR API ENDPOINT'LƏRI
// Məqaləyə rəy əlavə et
app.post('/api/posts/:id/comments', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { content, parent_id } = req.body;
        
        // Məqalə mövcudluğunu yoxlayaq
        const postResult = await pool.query('SELECT id FROM posts WHERE id = $1 AND status = \'published\'', [id]);
        if (postResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Məqalə tapılmadı'
            });
        }
        
        // Rəyi yaradırıq
        const result = await pool.query(`
            INSERT INTO comments (content, post_id, user_id, parent_id, status)
            VALUES ($1, $2, $3, $4, 'approved') -- Rəylər avtomatik təsdiqlənir
            RETURNING id, content, created_at
        `, [content, id, req.user.id, parent_id || null]);
        
        res.status(201).json({
            success: true,
            message: 'Rəy uğurla əlavə olundu',
            comment: result.rows[0]
        });
    } catch (error) {
        console.error('Rəy əlavə olunarkən xəta:', error);
        res.status(500).json({
            success: false,
            message: 'Server xətası'
        });
    }
});

// Əlaqə mesajlarını verilənlər bazasına yaz
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        // Mesajı verilənlər bazasına əlavə edirik
        const result = await pool.query(`
            INSERT INTO messages (name, email, subject, message)
            VALUES ($1, $2, $3, $4)
            RETURNING id, created_at
        `, [name, email, subject, message]);
        
        // Əgər konfiqurasiya varsa, email göndərilir
        const smtpHost = process.env.SMTP_HOST;
        const smtpPort = Number(process.env.SMTP_PORT);

        if (
            process.env.SMTP_EMAIL &&
            process.env.SMTP_PASSWORD &&
            smtpHost &&
            !Number.isNaN(smtpPort)
        ) {
            const transporter = nodemailer.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: smtpPort === 465,
                auth: {
                    user: process.env.SMTP_EMAIL,
                    pass: process.env.SMTP_PASSWORD,
                },
            });

            const mailOptions = {
                from: process.env.SMTP_EMAIL,
                to: process.env.CONTACT_EMAIL || process.env.SMTP_EMAIL,
                subject: `Contact Form: ${subject}`,
                text: `
Name: ${name}
Email: ${email}
Subject: ${subject}
Message: ${message}
                `,
                html: `
<h2>Contact Form Message</h2>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Subject:</strong> ${subject}</p>
<p><strong>Message:</strong></p>
<p>${message.replace(/\n/g, '<br>')}</p>
                `,
            };

            await transporter.sendMail(mailOptions);
        } else {
            console.warn('SMTP configuration is incomplete; contact form email not sent.');
        }

        res.status(200).json({
            success: true,
            message: 'Mesajınız uğurla göndərildi!'
        });
    } catch (error) {
        console.error('Contact form xətası:', error);
        res.status(500).json({
            success: false,
            message: 'Mesaj göndərilərkən xəta baş verdi'
        });
    }
});

// ADMIN PANEL İSTİFADƏLƏRİ (RƏY VƏ MESAJ IDARƏETMƏ)
// Bütün rəyləri əldə et (yalnız admin)
app.get('/api/admin/comments', auth, admin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status || '';
        const search = req.query.search || '';
        const offset = (page - 1) * limit;
        let whereClause = '';
        const queryParams = [];
        let paramIndex = 1;
        if (status) {
            whereClause += ` AND c.status = $${paramIndex}`;
            queryParams.push(status);
            paramIndex += 1;
        }
        if (search) {
            whereClause += ` AND (c.content ILIKE $${paramIndex} OR u.username ILIKE $${paramIndex})`;
            queryParams.push(`%${search}%`);
            paramIndex += 1;
        }
        const limitParamPos = queryParams.length + 1;
        const offsetParamPos = queryParams.length + 2;
        const result = await pool.query(
            `SELECT c.id, c.content, c.status, c.created_at, c.updated_at,
                    u.username as user_username, p.title as post_title, p.slug as post_slug
             FROM comments c
             JOIN users u ON c.user_id = u.id
             JOIN posts p ON c.post_id = p.id
             WHERE 1=1 ${whereClause}
             ORDER BY c.created_at DESC
             LIMIT $${limitParamPos} OFFSET $${offsetParamPos}`,
            [...queryParams, limit, offset]
        );
        const countResult = await pool.query(
            `SELECT COUNT(*) as total
             FROM comments c
             JOIN users u ON c.user_id = u.id
             JOIN posts p ON c.post_id = p.id
             WHERE 1=1 ${whereClause}`,
            queryParams
        );
        const total = parseInt(countResult.rows[0].total, 10);
        const totalPages = Math.max(Math.ceil(total / limit), 1);
        res.status(200).json({
            success: true,
            comments: result.rows,
            pagination: {
                currentPage: page,
                totalPages,
                totalComments: total,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        });
    } catch (error) {
        console.error('Rəylər alınarkən xəta:', error);
        res.status(500).json({
            success: false,
            message: 'Server xətası',
        });
    }
});
// Rəy statusunu dəyiş (yalnız admin)
app.put('/api/admin/comments/:id', auth, admin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const result = await pool.query(`
            UPDATE comments
            SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING id, status
        `, [status, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Rəy tapılmadı'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Rəy statusu uğurla yeniləndi',
            comment: result.rows[0]
        });
    } catch (error) {
        console.error('Rəy statusu yenilənərkən xəta:', error);
        res.status(500).json({
            success: false,
            message: 'Server xətası'
        });
    }
});

// Rəy sil (yalnız admin)
app.delete('/api/admin/comments/:id', auth, admin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query('DELETE FROM comments WHERE id = $1', [id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Rəy tapılmadı'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Rəy uğurla silindi'
        });
    } catch (error) {
        console.error('Rəy silinərkən xəta:', error);
        res.status(500).json({
            success: false,
            message: 'Server xətası'
        });
    }
});

// Bütün əlaqə mesajlarını əldə et (yalnız admin)
app.get('/api/admin/messages', auth, admin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const isRead = req.query.is_read;
        const search = req.query.search || '';
        const offset = (page - 1) * limit;
        let whereClause = '';
        const queryParams = [];
        let paramIndex = 1;
        if (isRead !== undefined) {
            whereClause += ` AND m.is_read = $${paramIndex} `;
            queryParams.push(isRead === 'true');
            paramIndex += 1;
        }
        if (search) {
            whereClause += ` AND (m.name ILIKE $${paramIndex} OR m.email ILIKE $${paramIndex} OR m.subject ILIKE $${paramIndex} OR m.message ILIKE $${paramIndex}) `;
            queryParams.push(`%${search}%`);
            paramIndex += 1;
        }
        const limitParamPos = queryParams.length + 1;
        const offsetParamPos = queryParams.length + 2;
        const result = await pool.query(
            `SELECT m.id, m.name, m.email, m.subject, m.message, m.is_read, m.created_at
             FROM messages m
             WHERE 1=1 ${whereClause}
             ORDER BY m.created_at DESC
             LIMIT $${limitParamPos} OFFSET $${offsetParamPos}`,
            [...queryParams, limit, offset]
        );
        const countResult = await pool.query(
            `SELECT COUNT(*) as total
             FROM messages m
             WHERE 1=1 ${whereClause}`,
            queryParams
        );
        const total = parseInt(countResult.rows[0].total, 10);
        const totalPages = Math.max(Math.ceil(total / limit), 1);
        res.status(200).json({
            success: true,
            messages: result.rows,
            pagination: {
                currentPage: page,
                totalPages,
                totalMessages: total,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        });
    } catch (error) {
        console.error('Mesajlar alınarkən xəta:', error);
        res.status(500).json({
            success: false,
            message: 'Server xətası',
        });
    }
});
// Əlaqə mesajı oxunub/oxunmayıb statusunu dəyiş (yalnız admin)
app.put('/api/admin/messages/:id', auth, admin, async (req, res) => {
    try {
        const { id } = req.params;
        const { is_read } = req.body;
        
        const result = await pool.query(`
            UPDATE messages
            SET is_read = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING id, is_read
        `, [is_read, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Mesaj tapılmadı'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Mesaj statusu uğurla yeniləndi',
            messageInfo: result.rows[0]
        });
    } catch (error) {
        console.error('Mesaj statusu yenilənərkən xəta:', error);
        res.status(500).json({
            success: false,
            message: 'Server xətası'
        });
    }
});

// Admin panel statistikası (yalnız admin)
app.get('/api/admin/stats', auth, admin, async (req, res) => {
    try {
        const statsResult = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM projects) as total_projects,
                (SELECT COUNT(*) FROM posts) as total_posts,
                (SELECT COUNT(*) FROM comments) as total_comments,
                (SELECT COUNT(*) FROM messages WHERE is_read = false) as unread_messages
        `);
        
        res.status(200).json({
            success: true,
            stats: statsResult.rows[0]
        });
    } catch (error) {
        console.error('Statistika alınarkən xəta:', error);
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
