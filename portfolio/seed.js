const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
require('dotenv').config();

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

// Test məlumatlarını əlavə et
const seedData = () => {
    console.log('Test məlumatları əlavə olunur...');

    // 1. Admin istifadəçini yarat (əgər mövcud deyilsə)
    db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, row) => {
        if (err) {
            console.error('Admin yoxlanışı xətası:', err.message);
            return;
        }

        if (!row) {
            bcrypt.hash('admin123', 10, (err, hashedPassword) => {
                if (err) {
                    console.error('Şifrə hash xətası:', err.message);
                    return;
                }

                db.run(
                    `INSERT INTO users (username, email, password, role, profile_name, profile_title, profile_bio) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    ['admin', 'admin@portfolio.com', hashedPassword, 'admin', 'Admin User', 'System Administrator', 'System administrator account'],
                    function(err) {
                        if (err) {
                            console.error('Admin əlavə xətası:', err.message);
                        } else {
                            console.log('Admin istifadəçisi yaradıldı: admin / admin123');
                            // Admin yarandıqdan sonra digər əməliyyatları yerinə yetir
                            createOtherData();
                        }
                    }
                );
            });
        } else {
            console.log('Admin istifadəçisi artıq mövcuddur');
            // Admin mövcuddursa, digər əməliyyatları yerinə yetir
            createOtherData();
        }
    });
};

// Digər məlumatları yarat
const createOtherData = () => {
    // Normal istifadəçini yarat (əgər mövcud deyilsə)
    db.get('SELECT * FROM users WHERE username = ?', ['testuser'], (err, row) => {
        if (err) {
            console.error('Test istifadəçisi yoxlanışı xətası:', err.message);
            return;
        }

        if (!row) {
            bcrypt.hash('test123', 10, (err, hashedPassword) => {
                if (err) {
                    console.error('Şifrə hash xətası:', err.message);
                    return;
                }

                db.run(
                    `INSERT INTO users (username, email, password, profile_name, profile_title, profile_bio) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    ['testuser', 'user@portfolio.com', hashedPassword, 'Test User', 'Test User', 'This is a test user account'],
                    function(err) {
                        if (err) {
                            console.error('Test istifadəçisi əlavə xətası:', err.message);
                        } else {
                            console.log('Test istifadəçisi yaradıldı: testuser / test123');
                        }
                    }
                );
            });
        } else {
            console.log('Test istifadəçisi artıq mövcuddur');
        }
    });

    // Layihələri yarat (əgər mövcud deyilsə)
    db.get('SELECT COUNT(*) as count FROM projects', (err, row) => {
        if (err) {
            console.error('Layihə yoxlanışı xətası:', err.message);
            return;
        }

        if (row.count === 0) {
            // Əvvəlcə admin istifadəçisini tapaq
            db.get('SELECT id FROM users WHERE username = ?', ['admin'], (err, adminUser) => {
                if (err) {
                    console.error('Admin istifadəçisi axtarışı xətası:', err.message);
                    return;
                }

                if (!adminUser) {
                    console.log('Admin istifadəçisi tapılmadı, layihələr yaradılmır');
                    return;
                }

                const userId = adminUser.id;
                const projects = [
                    {
                        title: 'AzAgroPOS',
                        description: 'Birgə satılan mallar üçün növbəti nəsildə poçt sistemi. Bu layihə şirkətlərin satış prosesini avtomatlaşdırmağa və məlumatları effektiv idarə etməyə kömək edir.',
                        technologies: JSON.stringify(['C#.NET', 'SQL', 'Entity Framework', 'Windows Forms', 'DevExpress Controls']),
                        startDate: '2022-01-15',
                        endDate: '2023-06-30',
                        status: 'completed',
                        image_url: '',
                        project_url: ''
                    },
                    {
                        title: 'JavaScript Quiz App',
                        description: 'İstifadəçi dostu kviz tətbiqi. İstifadəçilər fərqli mövzularda bilik sınağı keçə bilər və nəticələrini yoxlaya bilərlər.',
                        technologies: JSON.stringify(['JavaScript', 'HTML5', 'CSS3', 'AJAX', 'JSON']),
                        startDate: '2021-03-10',
                        endDate: '2021-08-20',
                        status: 'completed',
                        image_url: '',
                        project_url: ''
                    },
                    {
                        title: 'Arduino Metal Detector',
                        description: 'Arduino mikrokontrolleri əsasında hazırlanmış metal detektoru. Elektromaqnit sahəsindən istifadə edərək metalları aşkarlamaq üçün istifadə olunur.',
                        technologies: JSON.stringify(['Arduino', 'C/C++', 'Sensorlar', 'Elektronika', 'Signal Processing']),
                        startDate: '2020-05-01',
                        endDate: '2020-11-15',
                        status: 'completed',
                        image_url: '',
                        project_url: ''
                    },
                    {
                        title: 'Network Security Assessment Tool',
                        description: 'Korporativ şəbəkələrin təhlükəsizliyini qiymətləndirmək üçün avtomatlaşdırılmış alət.',
                        technologies: JSON.stringify(['Python', 'Nmap', 'Scapy', 'Network Security', 'Vulnerability Assessment']),
                        startDate: '2023-02-01',
                        endDate: '2023-09-30',
                        status: 'completed',
                        image_url: '',
                        project_url: ''
                    },
                    {
                        title: 'IoT Monitoring System',
                        description: 'Müxtəlif sensorlardan məlumat toplayan və mərkəzi idarəetmə təmin edən IoT sistem.',
                        technologies: JSON.stringify(['Arduino', 'Raspberry Pi', 'Python', 'WebSockets', 'Real-time Monitoring']),
                        startDate: '2022-01-10',
                        endDate: '2022-12-20',
                        status: 'completed',
                        image_url: '',
                        project_url: ''
                    }
                ];

                projects.forEach((project, index) => {
                    db.run(
                        `INSERT INTO projects 
                         (title, description, technologies, start_date, end_date, status, image_url, project_url, user_id) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            project.title,
                            project.description,
                            project.technologies,
                            project.startDate,
                            project.endDate,
                            project.status,
                            project.image_url,
                            project.project_url,
                            userId
                        ],
                        function(err) {
                            if (err) {
                                console.error(`Layihə əlavə xətası (${project.title}):`, err.message);
                            } else {
                                console.log(`${project.title} layihəsi əlavə olundu`);
                                
                                // Bütün layihələr əlavə olunduqda mesajı göstər
                                if (index === projects.length - 1) {
                                    console.log('Bütün layihələr bazaya əlavə olundu');
                                    console.log('Baza konfiqurasiyası tamamlandı!');
                                    db.close();
                                }
                            }
                        }
                    );
                });
            });
        } else {
            console.log('Layihələr artıq bazada mövcuddur');
            console.log('Baza konfiqurasiyası tamamlandı!');
            db.close();
        }
    });
};

// Server başlayanda cədvəlləri yarat və məlumatları əlavə et
createTables();
// Cədvəllər yarandıqdan sonra bir az gözlə və sonra məlumatları əlavə et
setTimeout(seedData, 1000);