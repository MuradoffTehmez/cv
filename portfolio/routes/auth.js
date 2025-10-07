const express = require('express');

// Legacy MongoDB-based auth routes have been retired in favour of the
// PostgreSQL implementation located in server.js. This placeholder router
// ensures that any accidental mounts fail fast with a clear response.
const router = express.Router();

router.use((req, res) => {
    res.status(410).json({
        success: false,
        message: 'Bu autentifikasiya endpoint-i köhnə MongoDB modeli üçündür və deaktiv edilib.'
    });
});

module.exports = router;
