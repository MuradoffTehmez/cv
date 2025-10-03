# Portfolio Backend

Bu layihə Təhməz Muradov üçün portfolio saytının backend hissəsidir. Node.js, Express və MongoDB istifadə edərək istifadəçi autentifikasiyası, layihə idarəetməsi və admin paneli funksiyalarını təmin edir.

## Xüsusiyyətlər

- İstifadəçi qeydiyyatı və girişi
- JWT əsaslı autentifikasiya
- Şifrə sıfırlama sistemi
- Layihələrin idarə edilməsi (yaratmaq, redaktə etmək, silmək)
- Admin paneli
- Profil idarəetməsi
- Şifrə dəyişmə funksiyası

## Tələblər

- Node.js (v14 və ya daha yuxarı)
- MongoDB (lokal və ya məsələn MongoDB Atlas)

## Quraşdırma

1. Layihəni klonlayın və ya ZIP faylını açın
2. Terminalda layihə qovluğuna daxil olun:

```bash
cd portfolio
```

3. Tələb olunan modulları quraşdırın:

```bash
npm install
```

4. `.env` faylını yaradın və aşağıdakı məzmunu əlavə edin:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/portfolio
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
SMTP_HOST=smtp.your-email-service.com
SMTP_PORT=587
SMTP_EMAIL=your-email@domain.com
SMTP_PASSWORD=your-email-password
```

> Qeyd: `MONGODB_URI` dəyərini öz lokal və ya MongoDB Atlas ünvanınıza uyğun olaraq dəyişdirin.

## İşə salma

Layihəni inkişaf rejimində işə salmaq üçün:

```bash
npm run dev
```

Və ya istehsal rejimində:

```bash
npm start
```

Server `http://localhost:5000` ünvanında işə düşəcək.

## API Uç Nöqtələri

### Autentifikasiya

- `POST /api/auth/register` - İstifadəçi qeydiyyatı
- `POST /api/auth/login` - İstifadəçi girişi
- `POST /api/auth/forgotpassword` - Şifrə sıfırlama
- `PUT /api/auth/resetpassword/:resettoken` - Şifrəni sıfırla
- `GET /api/auth/me` - Cari istifadəçini əldə et

### İstifadəçi

- `GET /api/user/profile` - İstifadəçi profilini əldə et
- `PUT /api/user/profile` - İstifadəçi profilini yenilə
- `PUT /api/user/changepassword` - Şifrəni dəyiş
- `GET /api/user/projects` - İstifadəçinin layihələrini əldə et

### Layihələr

- `GET /api/project` - Bütün layihələri əldə et
- `GET /api/project/:id` - Tək layihəni əldə et
- `POST /api/project` - Layihə yarat (tələb olunan: autentifikasiya)
- `PUT /api/project/:id` - Layihəni yenilə (tələb olunan: sahib və ya admin)
- `DELETE /api/project/:id` - Layihəni sil (tələb olunan: sahib və ya admin)

### Admin

- `GET /api/admin/users` - Bütün istifadəçiləri əldə et (tələb olunan: admin)
- `GET /api/admin/users/:id` - Tək istifadəçini əldə et (tələb olunan: admin)
- `DELETE /api/admin/users/:id` - İstifadəçini sil (tələb olunan: admin)
- `PUT /api/admin/users/:id/role` - İstifadəçi rolu dəyiş (tələb olunan: admin)
- `GET /api/admin/projects` - Bütün layihələri əldə et (tələb olunan: admin)
- `DELETE /api/admin/projects` - Bütün layihələri sil (tələb olunan: admin)

## HTTP Cavab Formatı

Cavablar aşağıdakı formatda qaytarılır:

```json
{
  "success": true,
  "message": "Əməliyyat uğurla yerinə yetirildi",
  "data": {}
}
```

Xəta halında:

```json
{
  "success": false,
  "message": "Xəta məlumatı",
  "errors": []
}
```

## Təhlükəsizlik

- Bütün şifrələr bcrypt ilə hash edilir
- JWT token-lar istifadə olunur
- Middleware ilə giriş icazələri yoxlanılır
- Giriş icazəsi olmayan əməliyyatlarda 401 və 403 status kodları qaytarılır

## Müəllif

Assistant

## Lisenziya

MIT