const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const Report = require('../models/Report');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { logAction } = require('../middleware/logger');

// Generate a Report (Admin & Super Admin)
router.post('/', auth, checkRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
    const { complaintId, title, recipientEmail, recipientId, description, summary } = req.body;
    try {
        let recipient = null;
        if (recipientId) {
            recipient = await User.findById(recipientId);
        } else if (recipientEmail) {
            recipient = await User.findOne({ email: recipientEmail.trim() });
        }

        if (!recipient) {
            return res.status(400).json({ msg: 'Recipient user not found. Please select a valid user from the dropdown.' });
        }

        let compId = complaintId || null;
        if (!compId) {
            // Check if recipient has a registered complaint
            const userComp = await Complaint.findOne({ raisedBy: recipient._id }).sort({ createdAt: -1 });
            if (userComp) {
                compId = userComp._id;
            }
        }

        const newReport = new Report({
            title: title || `Official Performance Report - ${recipient.name}`,
            description: description || '',
            summary: summary || '',
            complaint: compId,
            recipient: recipient._id,
            generatedBy: req.user.id,
            department: recipient.department || '',
            programme: recipient.programme || '',
            status: 'Generated'
        });

        const report = await newReport.save();

        // Dispatch in-app notification to the recipient user
        try {
            await Notification.create({
                title: 'Official Report Generated',
                message: `An official report "${report.title}" has been issued to your account. View it in your Reports tab.`,
                type: 'PERSONAL',
                target: recipient._id.toString()
            });
        } catch (notifErr) {
            console.error('Notification dispatch warning:', notifErr.message);
        }

        await logAction(req.user.id, 'GENERATE_REPORT', `Generated report "${report.title}" for ${recipient.email}`, req);

        const populated = await Report.findById(report._id)
            .populate('complaint', 'title type status location block roomNo createdAt priority')
            .populate('recipient', 'name email role department programme')
            .populate('generatedBy', 'name email role');

        res.json(populated);
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// Get reports for logged in user (Recipient)
router.get('/my-reports', auth, async (req, res) => {
    try {
        if (req.user.role === 'STAFF') {
            return res.status(403).json({ msg: 'Reports access is not enabled for Staff accounts.' });
        }
        const reports = await Report.find({ recipient: req.user.id })
            .populate('complaint', 'title type status location block roomNo createdAt priority')
            .populate('recipient', 'name email role department programme')
            .populate('generatedBy', 'name email role')
            .sort({ createdAt: -1 });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// Get all reports (Admin & Super Admin)
router.get('/all', auth, checkRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
    try {
        const reports = await Report.find()
            .populate('complaint', 'title type status location block roomNo createdAt priority')
            .populate('recipient', 'name email role department programme')
            .populate('generatedBy', 'name email role')
            .sort({ createdAt: -1 });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// Delete Report (Admin & Super Admin)
router.delete('/:id', auth, checkRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ msg: 'Report not found' });

        await Report.findByIdAndDelete(req.params.id);
        await logAction(req.user.id, 'DELETE_REPORT', `Deleted report: ${report.title}`, req);

        res.json({ msg: 'Report deleted successfully' });
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

module.exports = router;
