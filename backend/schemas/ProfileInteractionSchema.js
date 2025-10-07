// Profile Interaction Schema - Tracks user interactions with content
const mongoose = require('mongoose');

const profileInteractionSchema = new mongoose.Schema({
    profileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
        required: true
    },
    likedContent: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Content'
    }],
    myList: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Content'
    }],
    watchProgress: {
        type: Map,
        of: {
            progress: {
                type: Number,
                min: 0,
                max: 100
            },
            lastWatched: {
                type: Date,
                default: Date.now
            }
        },
        default: new Map()
    },
    searchHistory: [{
        query: String,
        resultsCount: Number,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    activityLog: [{
        action: {
            type: String,
            enum: ['like', 'unlike', 'watch', 'search', 'watch_progress']
        },
        contentId: mongoose.Schema.Types.ObjectId,
        contentTitle: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        extra: mongoose.Schema.Types.Mixed
    }]
}, {
    timestamps: true
});

// Index for faster profile lookups
profileInteractionSchema.index({ profileId: 1 });

const ProfileInteraction = mongoose.model('ProfileInteraction', profileInteractionSchema);

module.exports = ProfileInteraction;
