const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/complaint_system';
        console.log('Connecting to MongoDB...');
        const options = {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4 // Use IPv4, skip trying IPv6
        };
        console.log('Connecting to MongoDB...');
        await mongoose.connect(uri, options);
        console.log('MongoDB Connected Successfully');
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        // Don't exit process so server can still run for static assets/etc if needed
        // but log clearly for user
    }
};

module.exports = connectDB;
