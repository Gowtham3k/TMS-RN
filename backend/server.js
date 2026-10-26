const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Connect to Database
connectDB();

// Routes
const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const reportRoutes = require('./routes/reports');
const masterDataRoutes = require('./routes/masterData');
const notificationRoutes = require('./routes/notifications');
const auditRoutes = require('./routes/audit');
const settingsRoutes = require('./routes/settings');

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/master-data', masterDataRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/settings', settingsRoutes);

const PORT = process.env.PORT || 5001;

const path = require('path');

// Serve static frontend in production
app.use(express.static(path.join(__dirname, '../frontend/build')));

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
