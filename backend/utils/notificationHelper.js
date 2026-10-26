const Notification = require('../models/Notification');

/**
 * Send a notification to a specific user or all users
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - 'PERSONAL', 'BROADCAST', or 'SYSTEM'
 * @param {string} target - User ID or 'ALL'
 */
const sendNotification = async (title, message, type = 'SYSTEM', target = 'ALL', complaintId = null, actionType = null) => {
    try {
        const notification = new Notification({
            title,
            message,
            type,
            target,
            complaintId: complaintId || undefined,
            actionType: actionType || undefined
        });
        await notification.save();
        return notification;
    } catch (err) {
        console.error('Error sending notification:', err);
    }
};

module.exports = { sendNotification };
