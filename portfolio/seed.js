const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// PostgreSQL Pool yarat
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'portfolio',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

// Test məlumatlarını əlavə et
const seedData = async () => {
    try {
        console.log('Test məlumatları əlavə olunur...');

        // Admin istifadəçini yarat (əgər mövcud deyilsə)
        const adminCheck = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
        if (adminCheck.rows.length === 0) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            
            await pool.query(
                `INSERT INTO users (username, email, password, role, profile_name, profile_title, profile_bio) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                ['admin', 'admin@portfolio.com', hashedPassword, 'admin', 'Admin User', 'System Administrator', 'System administrator account']
            );
            
            console.log('Admin istifadəçisi yaradıldı: admin / admin123');
        } else {
            console.log('Admin istifadəçisi artıq mövcuddur');
        }

        // Normal istifadəçini yarat (əgər mövcud deyilsə)
        const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', ['testuser']);
        if (userCheck.rows.length === 0) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('test123', salt);
            
            await pool.query(
                `INSERT INTO users (username, email, password, profile_name, profile_title, profile_bio) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                ['testuser', 'user@portfolio.com', hashedPassword, 'Test User', 'Test User', 'This is a test user account']
            );
            
            console.log('Test istifadəçisi yaradıldı: testuser / test123');
        } else {
            console.log('Test istifadəçisi artıq mövcuddur');
        }

        // Layihələri yarat (əgər mövcud deyilsə)
        const projectCheck = await pool.query('SELECT COUNT(*) FROM projects');
        if (parseInt(projectCheck.rows[0].count) === 0) {
            // Əvvəlcə istifadəçiləri tapaq
            const adminUser = await pool.query('SELECT id FROM users WHERE username = $1', ['admin']);
            const userId = adminUser.rows[0].id;
            
            const projects = [
                {
                    title: 'AzAgroPOS',
                    description: 'Birgə satılan mallar üçün növbəti nəsildə poçt sistemi. Bu layihə şirkətlərin satış prosesini avtomatlaşdırmağa və məlumatları effektiv idarə etməyə kömək edir.',
                    technologies: ['C#.NET', 'SQL', 'Entity Framework', 'Windows Forms', 'DevExpress Controls'],
                    startDate: '2022-01-15',
                    endDate: '2023-06-30',
                    status: 'completed',
                    image_url: '',
                    project_url: ''
                },
                {
                    title: 'JavaScript Quiz App',
                    description: 'İstifadəçi dostu kviz tətbiqi. İstifadəçilər fərqli mövzularda bilik sınağı keçə bilər və nəticələrini yoxlaya bilərlər.',
                    technologies: ['JavaScript', 'HTML5', 'CSS3', 'AJAX', 'JSON'],
                    startDate: '2021-03-10',
                    endDate: '2021-08-20',
                    status: 'completed',
                    image_url: '',
                    project_url: ''
                },
                {
                    title: 'Arduino Metal Detector',
                    description: 'Arduino mikrokontrolleri əsasında hazırlanmış metal detektoru. Elektromaqnit sahəsindən istifadə edərək metalları aşkarlamaq üçün istifadə olunur.',
                    technologies: ['Arduino', 'C/C++', 'Sensorlar', 'Elektronika', 'Signal Processing'],
                    startDate: '2020-05-01',
                    endDate: '2020-11-15',
                    status: 'completed',
                    image_url: '',
                    project_url: ''
                },
                {
                    title: 'Network Security Assessment Tool',
                    description: 'Korporativ şəbəkələrin təhlükəsizliyini qiymətləndirmək üçün avtomatlaşdırılmış alət.',
                    technologies: ['Python', 'Nmap', 'Scapy', 'Network Security', 'Vulnerability Assessment'],
                    startDate: '2023-02-01',
                    endDate: '2023-09-30',
                    status: 'completed',
                    image_url: '',
                    project_url: ''
                },
                {
                    title: 'IoT Monitoring System',
                    description: 'Müxtəlif sensorlardan məlumat toplayan və mərkəzi idarəetmə təmin edən IoT sistem.',
                    technologies: ['Arduino', 'Raspberry Pi', 'Python', 'WebSockets', 'Real-time Monitoring'],
                    startDate: '2022-01-10',
                    endDate: '2022-12-20',
                    status: 'completed',
                    image_url: '',
                    project_url: ''
                }
            ];

            for (const project of projects) {
                await pool.query(
                    `INSERT INTO projects 
                     (title, description, technologies, start_date, end_date, status, image_url, project_url, user_id) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
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
                    ]
                );
            }
            
            console.log('Layihələr bazaya əlavə olundu');
        } else {
            console.log('Layihələr artıq bazada mövcuddur');
        }

        console.log('Baza konfiqurasiyası tamamlandı!');
    } catch (error) {
        console.error('Məlumat əlavə olunarkən xəta baş verdi:', error);
    } finally {
        await pool.end();
    }
};

seedData();