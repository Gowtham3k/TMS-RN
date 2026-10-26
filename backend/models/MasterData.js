const mongoose = require('mongoose');

const MasterDataSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: [
            'DEPARTMENT',
            'PROGRAMME',
            'BLOCK',
            'ROOM',
            'ROLE',
            'CATEGORY',
            'LOCATION',
            'PRIORITY'
        ]
    },
    name: {
        type: String,
        required: true
    },
    shortName: {
        type: String
    },
    description: {
        type: String
    },
    // For hierarchical structures: 
    // Programme -> Dept, Block -> Dept, Room -> Block (parentId) & Dept (departmentId)
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MasterData'
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MasterData'
    },
    // Optional: store full hierarchy path or specific refs if needed, 
    // but parentId is usually enough for a mini project.
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('MasterData', MasterDataSchema);
