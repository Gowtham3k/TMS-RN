const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    summary: { type: String, default: '' },
    complaint: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Complaint',
        required: false
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    department: { type: String, default: '' },
    programme: { type: String, default: '' },
    status: { type: String, default: 'Generated' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', ReportSchema);
