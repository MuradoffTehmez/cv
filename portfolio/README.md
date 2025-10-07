# Təhməz Muradov - Portfolio & Blog Saytı

Modern və professional portfel saytı. Software & Cybersecurity Engineer üçün hazırlanmış tam funksional web tətbiqi.

## 🚀 Xüsusiyyətlər

### Frontend
- ✅ Modern minimalist dizayn (Dark theme)
- ✅ Tam responsive - bütün cihazlarda mükəmməl işləyir
- ✅ Sürətli və yüngül performans
- ✅ SEO optimizasiyası
- ✅ Animasiyalı komponentlər (minimal və professional)

### Backend
- ✅ Node.js & Express framework
- ✅ PostgreSQL verilənlər bazası
- ✅ RESTful API
- ✅ JWT autentifikasiya
- ✅ Rate limiting və security headers (Helmet)
- ✅ File upload (Multer)
- ✅ Email bildirişləri (Nodemailer)

### Səhifələr
1. **Ana Səhifə** - Hero section, xidmətlər, statistika, seçilmiş layihələr
2. **Haqqında** - Şəxsi məlumat, iş təcrübəsi, təhsil
3. **Bacarıqlar** - Texniki bacarıqlar, sertifikatlar, alətlər
4. **Layihələr** - Portfolio layihələri showcase
5. **Bloq** - Məqalələr və yazılar
6. **Əlaqə** - Əlaqə formu
7. **Admin Panel** - İstifadəçi və məzmun idarəetməsi
8. **Profil** - İstifadəçi profili idarəetməsi

### Funksionallıq
- ✅ İstifadəçi qeydiyyatı və girişi
- ✅ Admin paneli (CRUD əməliyyatları)
- ✅ Bloq sistemı (posts, comments)
- ✅ Layihə showcase
- ✅ Əlaqə formu
- ✅ RSS feed
- ✅ Şifrə sıfırlama
- ✅ Profile picture upload
- ✅ Pagination

## 🛠️ Texnologiyalar

### Frontend
- HTML5, CSS3
- JavaScript (ES6+)
- Modern CSS Grid & Flexbox
- Intersection Observer API
- Fetch API

### Backend
- Node.js v16+
- Express.js v4.x
- PostgreSQL v12+
- JWT (jsonwebtoken)
- Bcrypt.js
- Multer
- Nodemailer v7.x
- Helmet
- CORS
- Express Rate Limit

## 📦 Quraşdırma

### 1. Dependencies yükləyin
```bash
npm install
```

### 2. PostgreSQL verilənlər bazasını yaradın
```sql
CREATE DATABASE portfolio;
```

### 3. Environment dəyişənləri konfiqurasiya edin

`.env` faylı yaradın:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_USER=postgres
DB_HOST=localhost
DB_NAME=portfolio
DB_PASSWORD=your_password
DB_PORT=5432

# JWT
JWT_SECRET=your_very_secure_jwt_secret_key
JWT_EXPIRE=7d

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
CONTACT_EMAIL=contact@yourdomain.com

# Site
SITE_URL=http://localhost:5000
SITE_TITLE=Portfolio Blog
SITE_DESCRIPTION=Personal portfolio and blog

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5000
```

### 4. Serveri işə salın

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server `http://localhost:5000` ünvanında işə düşəcək.

## 📂 Layihə Strukturu

```
portfolio/
├── css/
│   └── modern-style.css      # Əsas CSS faylı
├── js/
│   ├── script.js             # Əsas JavaScript
│   └── api.js                # API çağırışları
├── images/                   # Şəkillər
├── uploads/                  # Yüklənmiş fayllar
├── middleware/
│   └── auth.js              # Autentifikasiya middleware
├── routes/
│   ├── auth.js              # Auth route-ları
│   └── rss.js               # RSS feed
├── utils/
│   └── sendEmail.js         # Email utility
├── *.html                   # HTML səhifələr
├── server.js                # Express server
├── package.json
└── .env                     # Environment dəyişənləri
```

## 🔐 Admin Panel

Admin panelə daxil olmaq üçün admin istifadəçisi yaradın və `/admin.html` səhifəsinə daxil olun.

### Admin Funksiyaları:
- İstifadəçi idarəetməsi
- Layihə idarəetməsi
- Bloq məqalələri idarəetməsi
- Rəy moderasiyası
- Mesaj idarəetməsi
- Statistika

## 📡 API Endpoints

### Autentifikasiya
- `POST /api/auth/register` - Yeni istifadəçi qeydiyyatı
- `POST /api/auth/login` - İstifadəçi girişi
- `GET /api/auth/me` - Cari istifadəçi məlumatı
- `POST /api/auth/forgotpassword` - Şifrə sıfırlama
- `PUT /api/auth/resetpassword/:token` - Şifrəni təzələ

### İstifadəçi
- `GET /api/user/profile` - Profil məlumatı
- `PUT /api/user/profile` - Profil yenilə
- `PUT /api/user/avatar` - Profil şəkli yüklə
- `PUT /api/user/changepassword` - Şifrəni dəyiş

### Layihələr
- `GET /api/projects` - Bütün layihələr
- `GET /api/projects/:id` - Layihə detalı
- `GET /api/homepage` - Ana səhifə məlumatları

### Bloq
- `GET /api/posts` - Bütün məqalələr
- `GET /api/posts/:slug` - Məqalə detalı
- `POST /api/posts` - Yeni məqalə (admin)
- `PUT /api/posts/:id` - Məqalə redaktə (admin)
- `DELETE /api/posts/:id` - Məqalə sil (admin)

### RSS
- `GET /rss` - RSS feed

## 🎨 Dizayn

### Rəng Sxemi (Dark Theme)
- Primary: `#2563eb` (Mavi)
- Secondary: `#1e40af` (Tünd mavi)
- Background: `#0f172a` (Tünd fon)

### Font
- Inter (Google Fonts)

## 🔒 Təhlükəsizlik

- ✅ JWT token-based autentifikasiya
- ✅ Bcrypt password hashing
- ✅ Helmet.js security headers
- ✅ CORS konfiqurasiyası
- ✅ Rate limiting
- ✅ Input validation
- ✅ SQL injection protection

## 📱 Responsive Dizayn

Bütün ekran ölçülərində mükəmməl işləyir:
- Mobile: 320px+
- Tablet: 768px+
- Desktop: 1024px+

## 👨‍💻 Müəllif

**Təhməz Muradov**
- Software & Cybersecurity Engineer
- Email: info@tehmazmuradov.az

---

**Made with ❤️ in Azerbaijan** 🇦🇿
