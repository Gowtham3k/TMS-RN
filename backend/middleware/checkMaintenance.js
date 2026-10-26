const Settings = require('../models/Settings');

const checkMaintenance = async (req, res, next) => {
    try {
        const maintenanceSetting = await Settings.findOne({ key: 'isSystemUnderMaintenance' });

        if (maintenanceSetting && maintenanceSetting.value === true) {
            // Check if the user is an admin - maybe admins can still raise complaints?
            // Usually, maintenance blocks everyone except super admins or just everyone.
            // Following user request: "System maintenance time la users complaint raise panna mudiyathu."

            if (req.user && (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN')) {
                return next();
            }

            return res.status(503).json({
                message: 'System is currently under maintenance. Please try again later.',
                maintenanceMode: true
            });
        }
        next();
    } catch (err) {
        next(); // If settings check fails, allow the request to proceed (safer)
    }
};

module.exports = checkMaintenance;
