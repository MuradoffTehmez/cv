const express = require('express');
const sqlite3 = require('sqlite3').verbose();
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

// Statik fayllar üçün middleware (front-end)
app.use(express.static(path.join(__dirname, '.')));

// SQLite3 database yarat
const db = new sqlite3.Database('./portfolio.db', (err) => {
    if (err) {
        console.error('SQLite əlaqə xətası:', err.message);
    } else {
        console.log('SQLite bazasına uğurla qoşuldu');
    }
});

// Cədvəlləri yarat
const createTables = () => {
    // İstifadəçilər cədvəli
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            profile_name TEXT DEFAULT '',
            profile_title TEXT DEFAULT '',
            profile_bio TEXT DEFAULT '',
            profile_location TEXT DEFAULT '',
            profile_phone TEXT DEFAULT '',
            profile_avatar TEXT DEFAULT '',
            profile_social_linkedin TEXT DEFAULT '',
            profile_social_github TEXT DEFAULT '',
            profile_social_twitter TEXT DEFAULT '',
            reset_password_token TEXT,
            reset_password_expire INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('İstifadəçilər cədvəli yaradıla bilmədi:', err.message);
        } else {
            console.log('İstifadəçilər cədvəli uğurla yaradıldı');
        }
    });

    // Layihələr cədvəli
    db.run(`
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            technologies TEXT,
            start_date TEXT NOT NULL,
            end_date TEXT,
            status TEXT DEFAULT 'active',
            image_url TEXT,
            project_url TEXT,
            user_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    `, (err) => {
        if (err) {
            console.error('Layihələr cədvəli yaradıla bilmədi:', err.message);
        } else {
            console.log('Layihələr cədvəli uğurla yaradıldı');
        }
    });
};

// JWT token yarat
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};

// Giriş icazəsi middleware
const auth = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Tokeni götür
            token = req.headers.authorization.split(' ')[1];

            // Tokeni doğrula
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // İstifadəçini token-dən götür
            db.get('SELECT id, username, email, role FROM users WHERE id = ?', [decoded.id], (err, user) => {
                if (err) {
                    console.error('İstifadəçi axtarışı xətası:', err.message);
                    return res.status(500).json({
                        success: false,
                        message: 'Server xətası'
                    });
                }

                if (!user) {
                    return res.status(401).json({
                        success: false,
                        message: 'Giriş icazəsi yoxdur'
                    });
                }

                req.user = user;
                next();
            });
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Giriş icazəsi yoxdur'
            });
        }
    } else {
        return res.status(401).json({
            success: false,
            message: 'Giriş icazəsi yoxdur, zəhmət olmasa token daxil edin'
        });
    }
};

// Admin icazəsi middleware
const admin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Giriş icazəsi yoxdur'
        });
    }

    // İstifadəçini yenidən bazadan götür və ən son rolu ilə yoxla
    db.get('SELECT id, username, email, role FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (err) {
            console.error('Admin icazəsi yoxlanarkən xəta:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Server xətası'
            });
        }

        if (!user || user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Giriş icazəsi yoxdur. Yalnız admin istifadəçilərə icazə verilir'
            });
        }

        // İstifadəçi məlumatlarını req obyektinə yenilə
        req.user = user;
        next();
    });
};

// Autentifikasiya route-ları
app.post('/api/auth/register', (req, res) => {
    const { username, email, password } = req.body;

    // Şifrəni hash et
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Şifrə hash xətası:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Server xətası'
            });
        }

        // Yeni istifadəçi yarat
        db.run(
            `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`,
            [username, email, hashedPassword],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        if (err.message.includes('username')) {
                            return res.status(400).json({
                                success: false,
                                message: 'Bu istifadəçi adı artıq mövcuddur'
                            });
                        } else if (err.message.includes('email')) {
                            return res.status(400).json({
                                success: false,
                                message: 'Bu email artıq mövcuddur'
                            });
                        }
                    }
                    console.error('Qeydiyyat xətası:', err.message);
                    return res.status(500).json({
                        success: false,
                        message: 'Server xətası'
                    });
                }

                const userId = this.lastID;
                const token = generateToken(userId);

                res.status(201).json({
                    success: true,
                    message: 'İstifadəçi uğurla qeydiyyatdan keçdi',
                    token,
                    user: {
                        id: userId,
                        username: username,
                        email: email,
                        role: 'user'
                    }
                });
            }
        );
    });
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    // İstifadəçini tap
    db.get(
        'SELECT id, username, email, password, role FROM users WHERE username = ? OR email = ?',
        [username, username],
        (err, user) => {
            if (err) {
                console.error('Giriş xətası:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Server xətası'
                });
            }

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'İstifadəçi adı və ya şifrə səhvdir'
                });
            }

            // Şifrəni yoxla
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) {
                    console.error('Şifrə müqayisə xətası:', err.message);
                    return res.status(500).json({
                        success: false,
                        message: 'Server xətası'
                    });
                }

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
            });
        }
    );
});

app.get('/api/auth/me', auth, (req, res) => {
    db.get(
        'SELECT id, username, email, role, profile_name, profile_title, profile_bio, profile_location, profile_phone, profile_avatar, profile_social_linkedin, profile_social_github, profile_social_twitter FROM users WHERE id = ?',
        [req.user.id],
        (err, user) => {
            if (err) {
                console.error('İstifadəçi məlumatı xətası:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Server xətası'
                });
            }

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'İstifadəçi tapılmadı'
                });
            }

            res.status(200).json({
                success: true,
                user
            });
        }
    );
});

// İstifadəçi route-ları
app.get('/api/user/profile', auth, (req, res) => {
    db.get(
        'SELECT id, username, email, role, profile_name, profile_title, profile_bio, profile_location, profile_phone, profile_avatar, profile_social_linkedin, profile_social_github, profile_social_twitter FROM users WHERE id = ?',
        [req.user.id],
        (err, user) => {
            if (err) {
                console.error('Profil məlumatı xətası:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Server xətası'
                });
            }

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'İstifadəçi tapılmadı'
                });
            }

            res.status(200).json({
                success: true,
                user
            });
        }
    );
});

// İstifadəçi profilini yenilə
app.put('/api/user/profile', auth, (req, res) => {
    const { profile } = req.body;
    
    // Profil məlumatlarını yenilə
    db.run(
        `UPDATE users 
         SET profile_name = ?, profile_title = ?, profile_bio = ?, 
             profile_location = ?, profile_phone = ?, 
             profile_social_linkedin = ?, profile_social_github = ?, 
             profile_social_twitter = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
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
        ],
        function(err) {
            if (err) {
                console.error('Profil yeniləmə xətası:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Server xətası'
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'İstifadəçi tapılmadı'
                });
            }

            // Yenilənmiş istifadəçini qaytar
            db.get(
                'SELECT id, username, email, role, profile_name, profile_title, profile_bio, profile_location, profile_phone, profile_avatar, profile_social_linkedin, profile_social_github, profile_social_twitter FROM users WHERE id = ?',
                [req.user.id],
                (err, user) => {
                    if (err) {
                        console.error('İstifadəçi məlumatı xətası:', err.message);
                        return res.status(500).json({
                            success: false,
                            message: 'Server xətası'
                        });
                    }

                    res.status(200).json({
                        success: true,
                        message: 'Profil uğurla yeniləndi',
                        user
                    });
                }
            );
        }
    );
});

// Şifrəni dəyiş
app.put('/api/user/changepassword', auth, (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Cari istifadəçini şifrə ilə birlikdə götür
    db.get(
        'SELECT id, password FROM users WHERE id = ?',
        [req.user.id],
        (err, user) => {
            if (err) {
                console.error('Şifrə dəyişmə xətası:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Server xətası'
                });
            }

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'İstifadəçi tapılmadı'
                });
            }

            // Cari şifrəni yoxla
            bcrypt.compare(currentPassword, user.password, (err, isMatch) => {
                if (err) {
                    console.error('Şifrə müqayisə xətası:', err.message);
                    return res.status(500).json({
                        success: false,
                        message: 'Server xətası'
                    });
                }

                if (!isMatch) {
                    return res.status(401).json({
                        success: false,
                        message: 'Hazırkı şifrə səhvdir'
                    });
                }

                // Yeni şifrəni hash et və yenilə
                bcrypt.hash(newPassword, 10, (err, hashedNewPassword) => {
                    if (err) {
                        console.error('Yeni şifrə hash xətası:', err.message);
                        return res.status(500).json({
                            success: false,
                            message: 'Server xətası'
                        });
                    }

                    db.run(
                        'UPDATE users SET password = ? WHERE id = ?',
                        [hashedNewPassword, req.user.id],
                        function(err) {
                            if (err) {
                                console.error('Şifrə yeniləmə xətası:', err.message);
                                return res.status(500).json({
                                    success: false,
                                    message: 'Server xətası'
                                });
                            }

                            if (this.changes === 0) {
                                return res.status(404).json({
                                    success: false,
                                    message: 'İstifadəçi tapılmadı'
                                });
                            }

                            res.status(200).json({
                                success: true,
                                message: 'Şifrə uğurla dəyişdirildi'
                            });
                        }
                    );
                });
            });
        }
    );
});

// Frontend üçün layihələri əldə et (giriş tələb olunmur)
app.get('/api/projects', (req, res) => {
    db.all(`
        SELECT p.id, p.title, p.description, p.technologies, p.start_date, p.end_date, p.status, 
               p.image_url, p.project_url, u.username as user_username
        FROM projects p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
    `, (err, projects) => {
        if (err) {
            console.error('Layihələr xətası:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Server xətası'
            });
        }

        // SQLite JSON saxlamadığı üçün technologies sütununu JSON-a çeviririk
        const formattedProjects = projects.map(project => {
            return {
                ...project,
                technologies: project.technologies ? JSON.parse(project.technologies) : []
            };
        });

        res.status(200).json({
            success: true,
            projects: formattedProjects
        });
    });
});

// Ana səhifə məlumatları (giriş tələb olunmur)
app.get('/api/homepage', (req, res) => {
    // Ən son 3 layihəni əldə et
    db.all(`
        SELECT p.id, p.title, p.description, p.technologies, p.start_date, p.end_date, p.status, 
               p.image_url, p.project_url, u.username as user_username
        FROM projects p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
        LIMIT 3
    `, (err, recentProjects) => {
        if (err) {
            console.error('Ana səhifə layihələri xətası:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Server xətası'
            });
        }

        // Ümumi statistika
        db.get(`
            SELECT 
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM projects) as total_projects
        `, (err, stats) => {
            if (err) {
                console.error('Statistika xətası:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Server xətası'
                });
            }

            const homepageData = {
                recentProjects: recentProjects.map(project => ({
                    ...project,
                    technologies: project.technologies ? JSON.parse(project.technologies) : []
                })),
                stats: stats
            };

            res.status(200).json({
                success: true,
                data: homepageData
            });
        });
    });
});

// Bütün istifadəçiləri əldə et (yalnız admin)
app.get('/api/admin/users', auth, admin, (req, res) => {
    db.all('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC', (err, users) => {
        if (err) {
            console.error('İstifadəçilər xətası:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Server xətası'
            });
        }
        
        res.status(200).json({
            success: true,
            users: users
        });
    });
});

// Bütün layihələri əldə et (yalnız admin)
app.get('/api/admin/projects', auth, admin, (req, res) => {
    db.all(`
        SELECT p.id, p.title, p.description, p.technologies, p.start_date, p.end_date, p.status, 
               p.image_url, p.project_url, u.username as user_username, u.email as user_email
        FROM projects p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
    `, (err, projects) => {
        if (err) {
            console.error('Admin layihələri xətası:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Server xətası'
            });
        }

        const formattedProjects = projects.map(project => {
            return {
                ...project,
                technologies: project.technologies ? JSON.parse(project.technologies) : []
            };
        });

        res.status(200).json({
            success: true,
            projects: formattedProjects
        });
    });
});

// Server başlayanda cədvəlləri yarat
createTables();
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server ${PORT} portunda işləyir...`);
});