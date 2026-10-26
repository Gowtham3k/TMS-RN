const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { auth, checkRole } = require('../middleware/auth');

// Get all logs (Super Admin only)
router.get('/', auth, checkRole(['SUPER_ADMIN']), async (req, res) => {
    try {
        const logs = await AuditLog.find()
            .populate('user', 'name email role')
            .sort({ timestamp: -1 })
            .limit(100);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

module.exports = router;
