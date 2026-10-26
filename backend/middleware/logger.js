const AuditLog = require('../models/AuditLog');

const logAction = async (userId, action, details, req) => {
    try {
        const log = new AuditLog({
            user: userId,
            action,
            details,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress
        });
        await log.save();
    } catch (err) {
        console.error('Audit Log Error:', err);
    }
};

module.exports = { logAction };
