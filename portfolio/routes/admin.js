const express = require('express');

// Legacy MongoDB-based admin routes have been removed.
// The PostgreSQL admin API is now defined directly in server.js.
// This router is kept for backward compatibility and responds with 410 Gone
// if it is accidentally mounted elsewhere in the application.
const router = express.Router();

router.use((req, res) => {
    res.status(410).json({
        success: false,
        message: 'Bu endpoint köhnə MongoDB strukturu üçün idi və deaktiv edilib. Zəhmət olmasa PostgreSQL əsaslı admin API-dən istifadə edin.'
    });
});

module.exports = router;
