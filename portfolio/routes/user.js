const express = require('express');

// Legacy MongoDB-based user routes have been removed.
// The PostgreSQL equivalents are implemented directly in server.js.
const router = express.Router();

router.use((req, res) => {
    res.status(410).json({
        success: false,
        message: 'İstifadəçi endpoint-i köhnə MongoDB modeli üçündür və deaktiv edilib.'
    });
});

module.exports = router;
