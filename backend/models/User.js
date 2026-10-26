const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumber: { type: String },
    role: {
        type: String,
        enum: ['USER', 'STAFF', 'ADMIN', 'SUPER_ADMIN'],
        default: 'USER'
    },
    department: { type: String },
    programme: { type: String },
    bio: { type: String },
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    avatar: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
