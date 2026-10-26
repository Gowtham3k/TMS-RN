/**
 * TMS - Password Reset Script
 * Run: node resetPasswords.js
 * Resets all user passwords to known values
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI;

// ─── Password config ───────────────────────────────────────────
const ADMIN_PASSWORD = 'Admin@123';   // for admin@tms.com (SUPER_ADMIN)
const COMMON_PASSWORD = 'Staff@123';   // for all STAFF accounts
const USER_PASSWORD = 'User@1234';   // for all USER accounts
// ──────────────────────────────────────────────────────────────

async function main() {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({
        name: String,
        email: String,
        password: String,
        role: String,
    }, { strict: false }));

    const users = await User.find({});
    console.log(`\n📋 Found ${users.length} users\n`);

    for (const u of users) {
        let newRaw;
        if (u.role === 'SUPER_ADMIN' || u.role === 'ADMIN') {
            newRaw = ADMIN_PASSWORD;
        } else if (u.role === 'STAFF') {
            newRaw = COMMON_PASSWORD;
        } else {
            newRaw = USER_PASSWORD;
        }

        const salt = await bcrypt.genSalt(10);
        u.password = await bcrypt.hash(newRaw, salt);
        await u.save();

        console.log(`  ✔ ${u.role.padEnd(12)} | ${u.email.padEnd(25)} | password: ${newRaw}`);
    }

    console.log('\n✅ All passwords reset successfully!\n');
    await mongoose.disconnect();
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
