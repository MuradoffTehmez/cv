const express = require('express');

// Legacy MongoDB-based user routes have been removed.
// The PostgreSQL equivalents are implemented directly in server.js.
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
        message: 'İstifadəçi endpoint-i köhnə MongoDB modeli üçündür və deaktiv edilib.'
    });
});
>>>>>>> f9297cf571769da439d04e75e53e93291bb41b0f

module.exports = router;
