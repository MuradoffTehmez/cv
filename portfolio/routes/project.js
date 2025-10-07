const express = require('express');

// Legacy MongoDB-based project routes have been removed.
// The PostgreSQL routes are implemented in server.js.
const router = express.Router();

router.use((req, res) => {
    res.status(410).json({
        success: false,
        message: 'Layihə endpoint-i köhnə MongoDB arxitekturası üçündür və deaktiv edilib.'
    });
});

module.exports = router;
