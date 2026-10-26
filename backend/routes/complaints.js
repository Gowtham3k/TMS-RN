const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const checkMaintenance = require('../middleware/checkMaintenance');
const Complaint = require('../models/Complaint');
const User = require('../models/User');

const { logAction } = require('../middleware/logger');
const { sendNotification } = require('../utils/notificationHelper');

// Raised by User
router.post('/', auth, checkMaintenance, async (req, res) => {
    const { title, description, type, location, priority, department, roomNo } = req.body;
    try {
        const newComplaint = new Complaint({
            title, description, type, location, priority, department, roomNo,
            raisedBy: req.user.id,
            timeline: [{ status: 'Pending', note: 'Complaint raised by user' }]
        });
        const complaint = await newComplaint.save();
        await logAction(req.user.id, 'RAISE_COMPLAINT', `Raised ticket: ${complaint.title}`, req);

        // Notify Admins
        await sendNotification(
            'New Complaint Raised',
            `${req.user.name || 'User'} raised a new complaint: ${complaint.title}`,
            'SYSTEM',
            'ALL',
            complaint._id,
            'COMPLAINT_RAISED'
        );

        res.json(complaint);
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// Get complaints (Filtered by role) - NEWEST FIRST
router.get('/', auth, async (req, res) => {
    try {
        const isAdminRole = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
        const isUserRole = req.user.role === 'USER';

        let complaints;
        if (isUserRole) {
            complaints = await Complaint.find({ raisedBy: req.user.id })
                .populate('assignedTo', 'name email role')
                .populate('reopenRequest.requestedBy', 'name email')
                .sort({ createdAt: -1 })
                .lean();
        } else if (isAdminRole) {
            complaints = await Complaint.find()
                .populate('raisedBy', 'name email department programme')
                .populate('assignedTo', 'name email role')
                .populate('reopenRequest.requestedBy', 'name email')
                .sort({ createdAt: -1 })
                .lean();
        } else {
            // Specialized staff roles see assigned tickets
            complaints = await Complaint.find({ assignedTo: req.user.id })
                .populate('raisedBy', 'name email department programme')
                .populate('assignedTo', 'name email role')
                .populate('reopenRequest.requestedBy', 'name email')
                .sort({ createdAt: -1 })
                .lean();
        }
        res.json(complaints);
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// Update status (Admin/Super Admin/Staff)
router.put('/:id/status', auth, async (req, res) => {
    const { status, note } = req.body;
    try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ msg: 'Complaint not found' });

        const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
        const isAssigned = complaint.assignedTo && complaint.assignedTo.toString() === req.user.id;

        if (!isAdmin && !isAssigned) {
            return res.status(403).json({ msg: 'Not authorized to update this complaint' });
        }

        // Staff cannot modify a resolved/closed complaint unless approved by admin
        if (!isAdmin && (complaint.status === 'Resolved' || complaint.status === 'Closed')) {
            return res.status(403).json({
                msg: 'This ticket is already Resolved and locked. You must request admin approval to unlock and make changes.'
            });
        }

        complaint.status = status;
        if (status === 'Resolved' || status === 'Closed') {
            complaint.resolutionDate = new Date();
            // Reset reopen request status once resolved again
            if (complaint.reopenRequest) {
                complaint.reopenRequest.status = 'None';
            }
        }

        complaint.timeline.push({ status, note: note || `Status updated to ${status}` });
        await complaint.save();
        await logAction(req.user.id, 'UPDATE_STATUS', `Updated status of ${complaint.title} to ${status}`, req);

        // Notify User
        await sendNotification(
            'Complaint Status Updated',
            `Your complaint "${complaint.title}" is now ${status}.`,
            'PERSONAL',
            complaint.raisedBy.toString(),
            complaint._id,
            'STATUS_UPDATED'
        );

        const populatedComplaint = await Complaint.findById(req.params.id)
            .populate('raisedBy', 'name email department programme')
            .populate('assignedTo', 'name email role')
            .populate('reopenRequest.requestedBy', 'name email')
            .lean();

        res.json(populatedComplaint);
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// Staff requests Admin approval to unlock / reopen a resolved complaint
router.post('/:id/request-unlock', auth, async (req, res) => {
    const { reason } = req.body;
    try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ msg: 'Complaint not found' });

        const isAssigned = complaint.assignedTo && complaint.assignedTo.toString() === req.user.id;
        const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);

        if (!isAssigned && !isAdmin) {
            return res.status(403).json({ msg: 'Not authorized to request unlock for this ticket' });
        }

        complaint.reopenRequest = {
            status: 'Pending',
            reason: reason || 'Staff requested ticket modification after resolution',
            requestedBy: req.user.id,
            requestedAt: new Date()
        };

        await complaint.save();
        await logAction(req.user.id, 'REQUEST_UNLOCK', `Requested unlock for ticket: ${complaint.title}. Reason: ${reason || 'Review'}`, req);

        // Notify All Admins
        await sendNotification(
            'Ticket Unlock Requested',
            `Staff ${req.user.name || 'Assigned Staff'} requested approval to unlock resolved ticket "${complaint.title}". Reason: ${reason || 'Additional work required'}`,
            'SYSTEM',
            'ALL',
            complaint._id,
            'UNLOCK_REQUEST'
        );

        const populated = await Complaint.findById(req.params.id)
            .populate('raisedBy', 'name email department programme')
            .populate('assignedTo', 'name email role')
            .populate('reopenRequest.requestedBy', 'name email')
            .lean();

        res.json(populated);
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// Admin approves unlock request
router.put('/:id/approve-unlock', auth, checkRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ msg: 'Complaint not found' });

        if (!complaint.reopenRequest) {
            complaint.reopenRequest = {};
        }

        complaint.reopenRequest.status = 'Approved';
        complaint.reopenRequest.reviewedBy = req.user.id;
        complaint.reopenRequest.reviewedAt = new Date();

        // Unlock ticket back to 'In Progress' so staff can edit and update it
        complaint.status = 'In Progress';
        complaint.timeline.push({
            status: 'In Progress',
            note: 'Admin approved staff unlock request. Ticket reopened for further work.',
            timestamp: new Date()
        });

        await complaint.save();
        await logAction(req.user.id, 'APPROVE_UNLOCK', `Approved unlock request for ticket: ${complaint.title}`, req);

        // Notify Assigned Staff
        if (complaint.assignedTo) {
            await sendNotification(
                'Unlock Request Approved',
                `Admin has approved your request to update "${complaint.title}". The ticket is now unlocked (In Progress).`,
                'PERSONAL',
                complaint.assignedTo.toString(),
                complaint._id,
                'UNLOCK_APPROVED'
            );
        }

        const populated = await Complaint.findById(req.params.id)
            .populate('raisedBy', 'name email department programme')
            .populate('assignedTo', 'name email role')
            .populate('reopenRequest.requestedBy', 'name email')
            .lean();

        res.json(populated);
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// Admin rejects unlock request
router.put('/:id/reject-unlock', auth, checkRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ msg: 'Complaint not found' });

        if (!complaint.reopenRequest) {
            complaint.reopenRequest = {};
        }

        complaint.reopenRequest.status = 'Rejected';
        complaint.reopenRequest.reviewedBy = req.user.id;
        complaint.reopenRequest.reviewedAt = new Date();

        await complaint.save();
        await logAction(req.user.id, 'REJECT_UNLOCK', `Rejected unlock request for ticket: ${complaint.title}`, req);

        // Notify Assigned Staff
        if (complaint.assignedTo) {
            await sendNotification(
                'Unlock Request Declined',
                `Admin declined the unlock request for ticket "${complaint.title}". The ticket remains Resolved.`,
                'PERSONAL',
                complaint.assignedTo.toString(),
                complaint._id,
                'UNLOCK_REJECTED'
            );
        }

        const populated = await Complaint.findById(req.params.id)
            .populate('raisedBy', 'name email department programme')
            .populate('assignedTo', 'name email role')
            .populate('reopenRequest.requestedBy', 'name email')
            .lean();

        res.json(populated);
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// Get all staff members (Admin/Super Admin)
router.get('/staff', auth, checkRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
    try {
        // Fetch users who are NOT standard users and NOT admins/super admins
        const staff = await User.find({
            role: { $nin: ['USER', 'ADMIN', 'SUPER_ADMIN'] }
        }).select('name email role department').lean();
        res.json(staff);
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// Assign (Admin/Super Admin)
router.put('/:id/assign', auth, checkRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
    const { adminId } = req.body;
    try {
        const complaint = await Complaint.findById(req.params.id);
        const assignedUser = await User.findById(adminId);

        complaint.assignedTo = adminId;
        complaint.status = 'In Progress';
        complaint.timeline.push({
            status: 'In Progress',
            note: `Assigned to ${assignedUser ? assignedUser.name : 'Staff'}`,
            timestamp: new Date()
        });

        await complaint.save();
        await logAction(req.user.id, 'ASSIGN_COMPLAINT', `Assigned ${complaint.title} to ${assignedUser ? assignedUser.email : adminId}`, req);

        // Notify User
        await sendNotification(
            'Complaint Assigned',
            `Your complaint "${complaint.title}" has been assigned to ${assignedUser ? assignedUser.name : 'a staff member'}.`,
            'PERSONAL',
            complaint.raisedBy.toString()
        );

        // Notify Staff
        if (assignedUser) {
            await sendNotification(
                'New Task Assigned',
                `You have been assigned to handle: "${complaint.title}". Please review and update status.`,
                'PERSONAL',
                adminId
            );
        }

        const populatedComplaint = await Complaint.findById(req.params.id)
            .populate('raisedBy', 'name email')
            .populate('assignedTo', 'name email')
            .lean();

        res.json(populatedComplaint);
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// Update Complaint (Admin/Super Admin)
router.put('/:id', auth, checkRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
    try {
        let complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ msg: 'Complaint not found' });

        const updatedData = {
            title: req.body.title,
            description: req.body.description,
            type: req.body.type,
            location: req.body.location,
            priority: req.body.priority,
            department: req.body.department,
            roomNo: req.body.roomNo,
            status: req.body.status
        };

        complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { $set: updatedData },
            { new: true }
        );

        await logAction(req.user.id, 'UPDATE_COMPLAINT', `Full update for ticket: ${complaint.title}`, req);

        res.json(complaint);
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// Delete Complaint (Admin/Super Admin/Staff)
router.delete('/:id', auth, async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ msg: 'Complaint not found' });

        const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
        const isAssigned = complaint.assignedTo && complaint.assignedTo.toString() === req.user.id;

        if (!isAdmin && !isAssigned) {
            return res.status(403).json({ msg: 'Not authorized to delete this complaint' });
        }

        const title = complaint.title;
        await Complaint.findByIdAndDelete(req.params.id);

        await logAction(req.user.id, 'DELETE_COMPLAINT', `Removed ticket: ${title}`, req);

        res.json({ msg: 'Complaint removed' });
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

const mongoose = require('mongoose');

// Dashboard Stats
router.get('/stats', auth, async (req, res) => {
    try {
        const isAdminRole = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
        const isUserRole = req.user.role === 'USER';

        let filter = {};
        if (isUserRole && req.user.id) {
            filter = { raisedBy: new mongoose.Types.ObjectId(req.user.id) };
        } else if (!isAdminRole && req.user.id) {
            // For specialized staff
            filter = { assignedTo: new mongoose.Types.ObjectId(req.user.id) };
        }

        const stats = await Complaint.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
                    inProgress: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
                    resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
                    closed: { $sum: { $cond: [{ $eq: ['$status', 'Closed'] }, 1, 0] } }
                }
            }
        ]);

        const result = stats[0] || { total: 0, pending: 0, inProgress: 0, resolved: 0, closed: 0 };
        res.json(result);
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// Submit Rating & Feedback (User only)
router.put('/:id/feedback', auth, checkRole(['USER']), async (req, res) => {
    const { rating, feedback } = req.body;
    try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ msg: 'Complaint not found' });
        if (complaint.raisedBy.toString() !== req.user.id) return res.status(403).json({ msg: 'Not authorized' });

        complaint.rating = rating;
        complaint.feedback = feedback;
        await complaint.save();
        res.json(complaint);
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

module.exports = router;
