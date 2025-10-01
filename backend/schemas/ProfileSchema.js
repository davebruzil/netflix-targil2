// Profile Schema - MongoDB Model for user profiles
const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    name: {
        type: String,
        required: [true, 'Profile name is required'],
        trim: true,
        maxlength: [50, 'Profile name cannot exceed 50 characters']
    },
    avatar: {
        type: String,
        required: [true, 'Avatar is required'],
        default: 'https://via.placeholder.com/150'
    },
    isChild: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries
profileSchema.index({ userId: 1 });

// Virtual for profile count per user (use in aggregations)
profileSchema.statics.countByUser = async function(userId) {
    return await this.countDocuments({ userId });
};

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;
