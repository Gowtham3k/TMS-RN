const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['BROADCAST', 'PERSONAL', 'SYSTEM'],
        default: 'SYSTEM'
    },
    target: {
        type: String, // 'ALL' or User ObjectID
        default: 'ALL'
    },
    complaintId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Complaint'
    },
    actionType: {
        type: String
    },
    isReadBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Notification', NotificationSchema);
