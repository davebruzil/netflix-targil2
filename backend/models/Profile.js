// Profile Model - MongoDB Implementation with Mongoose
const ProfileSchema = require('../schemas/ProfileSchema');

class Profile {
    constructor() {
        this.model = ProfileSchema;
    }

    async getAllProfiles() {
        try {
            const profiles = await this.model.find().populate('userId', '-password');
            return { profiles };
        } catch (error) {
            console.error('Error reading profiles data:', error);
            return { profiles: [] };
        }
    }

    async createProfile(profileData) {
        try {
            // Check profile count for user (max 5 profiles)
            const userProfileCount = await this.model.countDocuments({ userId: profileData.userId });
            if (userProfileCount >= 5) {
                throw new Error('Maximum 5 profiles per user');
            }

            // Generate avatar if not provided
            const avatar = profileData.avatar ||
                `https://via.placeholder.com/150/${Math.floor(Math.random()*16777215).toString(16)}/FFFFFF?text=${profileData.name.charAt(0).toUpperCase()}`;

            // Create new profile
            const newProfile = new this.model({
                userId: profileData.userId,
                name: profileData.name,
                avatar: avatar,
                isChild: profileData.isChild || false
            });

            await newProfile.save();
            return newProfile;
        } catch (error) {
            console.error('Error creating profile:', error);
            throw error;
        }
    }

    async getProfilesByUserId(userId) {
        try {
            const profiles = await this.model.find({ userId });
            return profiles;
        } catch (error) {
            console.error('Error finding profiles by user ID:', error);
            throw error;
        }
    }

    async getProfileById(profileId) {
        try {
            const profile = await this.model.findById(profileId);
            return profile || null;
        } catch (error) {
            console.error('Error finding profile by ID:', error);
            throw error;
        }
    }

    async updateProfile(profileId, profileData) {
        try {
            const profile = await this.model.findById(profileId);
            if (!profile) {
                throw new Error('Profile not found');
            }

            // Update fields
            if (profileData.name) profile.name = profileData.name;
            if (profileData.avatar) profile.avatar = profileData.avatar;
            if (profileData.isChild !== undefined) profile.isChild = profileData.isChild;

            await profile.save();
            return profile;
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    }

    async deleteProfile(profileId) {
        try {
            const profile = await this.model.findById(profileId);
            if (!profile) {
                throw new Error('Profile not found');
            }

            // Check if this is the last profile for the user
            const userProfiles = await this.model.find({ userId: profile.userId });
            if (userProfiles.length <= 1) {
                throw new Error('Cannot delete the last profile for a user');
            }

            await this.model.findByIdAndDelete(profileId);
            return true;
        } catch (error) {
            console.error('Error deleting profile:', error);
            throw error;
        }
    }

    async saveWatchProgress(profileId, contentId, progress, currentTime, totalDuration) {
        try {
            const profile = await this.model.findById(profileId);
            if (!profile) {
                throw new Error('Profile not found');
            }

            // Cap progress at 100% to avoid validation errors
            const cappedProgress = Math.min(Math.max(0, progress), 100);

            // Check if watch history entry exists for this content
            const existingIndex = profile.watchHistory.findIndex(
                item => item.contentId === contentId
            );

            const isCompleted = cappedProgress >= 90; // Mark as completed if 90% or more watched

            if (existingIndex >= 0) {
                // Update existing entry
                profile.watchHistory[existingIndex].progress = cappedProgress;
                profile.watchHistory[existingIndex].currentTime = currentTime;
                profile.watchHistory[existingIndex].totalDuration = totalDuration;
                profile.watchHistory[existingIndex].lastWatchedAt = new Date();
                profile.watchHistory[existingIndex].isCompleted = isCompleted;
            } else {
                // Add new entry
                profile.watchHistory.push({
                    contentId,
                    progress: cappedProgress,
                    currentTime,
                    totalDuration,
                    lastWatchedAt: new Date(),
                    isCompleted
                });
            }

            await profile.save();

            // SYNCHRONIZATION FIX: Also update ProfileInteraction.watchProgress Map
            // This ensures statistics can track daily views properly
            const ProfileInteractionSchema = require('../schemas/ProfileInteractionSchema');
            let interaction = await ProfileInteractionSchema.findOne({ profileId });

            if (!interaction) {
                interaction = new ProfileInteractionSchema({
                    profileId,
                    likedContent: [],
                    myList: [],
                    watchProgress: new Map(),
                    searchHistory: [],
                    activityLog: []
                });
            }

            // Update watchProgress Map for statistics tracking
            interaction.watchProgress.set(contentId.toString(), {
                progress: cappedProgress,
                lastWatched: new Date()
            });

            await interaction.save();

            return profile.watchHistory[existingIndex >= 0 ? existingIndex : profile.watchHistory.length - 1];
        } catch (error) {
            console.error('Error saving watch progress:', error);
            throw error;
        }
    }

    async getWatchHistory(profileId) {
        try {
            const profile = await this.model.findById(profileId);
            if (!profile) {
                throw new Error('Profile not found');
            }

            // Return watch history sorted by last watched date (most recent first)
            return profile.watchHistory.sort((a, b) =>
                new Date(b.lastWatchedAt) - new Date(a.lastWatchedAt)
            );
        } catch (error) {
            console.error('Error getting watch history:', error);
            throw error;
        }
    }

    async getContinueWatching(profileId) {
        try {
            const profile = await this.model.findById(profileId);
            if (!profile) {
                throw new Error('Profile not found');
            }

            // Return only in-progress content (not completed) sorted by last watched date
            // Include items with 0% progress (just opened) and up to 89% (not completed)
            return profile.watchHistory
                .filter(item => !item.isCompleted && item.progress >= 0)
                .sort((a, b) => new Date(b.lastWatchedAt) - new Date(a.lastWatchedAt));
        } catch (error) {
            console.error('Error getting continue watching:', error);
            throw error;
        }
    }
}

module.exports = Profile;
