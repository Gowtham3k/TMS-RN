const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { auth, checkRole } = require('../middleware/auth');

// Get all settings or a specific setting
router.get('/', async (req, res) => {
    try {
        const settings = await Settings.find();
        const settingsMap = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });
        res.json(settingsMap);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update a setting
router.put('/:key', auth, checkRole(['SUPER_ADMIN']), async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        let setting = await Settings.findOne({ key });
        if (setting) {
            setting.value = value;
            setting.updatedAt = Date.now();
            await setting.save();
        } else {
            setting = new Settings({ key, value });
            await setting.save();
        }

        res.json({ message: 'Setting updated successfully', setting });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
