const express = require('express');

// Legacy MongoDB-based admin routes have been removed.
// The PostgreSQL admin API is now defined directly in server.js.
// This router is kept for backward compatibility and responds with 410 Gone
// if it is accidentally mounted elsewhere in the application.
const router = express.Router();

<<<<<<< HEAD
/**
 * Legacy placeholder.
 *
 * This project now uses the PostgreSQL-first routes defined in server.js.
 * The original MongoDB implementation has been retired to avoid confusion.
 */
=======
router.use((req, res) => {
    res.status(410).json({
        success: false,
        message: 'Bu endpoint köhnə MongoDB strukturu üçün idi və deaktiv edilib. Zəhmət olmasa PostgreSQL əsaslı admin API-dən istifadə edin.'
    });
});
>>>>>>> f9297cf571769da439d04e75e53e93291bb41b0f

module.exports = router;
