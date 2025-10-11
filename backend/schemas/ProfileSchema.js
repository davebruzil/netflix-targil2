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
    watchHistory: [{
        contentId: {
            type: String,
            required: true
        },
        progress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        currentTime: {
            type: Number,
            default: 0
        },
        totalDuration: {
            type: Number,
            default: 60
        },
        lastWatchedAt: {
            type: Date,
            default: Date.now
        },
        isCompleted: {
            type: Boolean,
            default: false
        }
    }],
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

// Instance method to return profile object with id instead of _id
// Transforms _id to id for frontend compatibility
profileSchema.methods.toJSON = function() {
    const profile = this.toObject();

    // Transform MongoDB _id to id
    profile.id = profile._id.toString();
    delete profile._id;
    delete profile.__v;

    return profile;
};

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;
