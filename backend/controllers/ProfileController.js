const Profile = require('../models/Profile');

class ProfileController {
    constructor() {
        this.profileModel = new Profile();
    }

    async getAllProfiles(req, res) {
        try {
            const result = await this.profileModel.getAllProfiles();
            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('❌ Error getting all profiles:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get profiles',
                message: error.message
            });
        }
    }

    async getProfileById(req, res) {
        try {
            const { id } = req.params;
            const profile = await this.profileModel.getProfileById(id);

            if (!profile) {
                return res.status(404).json({
                    success: false,
                    error: 'Profile not found'
                });
            }

            res.json({
                success: true,
                data: { profile }
            });
        } catch (error) {
            console.error('❌ Error getting profile by ID:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get profile',
                message: error.message
            });
        }
    }

    async createProfile(req, res) {
        try {
            const { userId, name, avatar, isChild } = req.body;

            console.log('📝 POST /api/profiles - Creating new profile:', { userId, name, avatar, isChild });

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    error: 'User ID is required',
                    message: 'Please provide a valid user ID'
                });
            }

            if (!name || name.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Profile name is required',
                    message: 'Please provide a profile name'
                });
            }

            const profileData = {
                userId,
                name: name.trim(),
                avatar,
                isChild: isChild || false
            };

            const newProfile = await this.profileModel.createProfile(profileData);

            console.log('✅ Profile created successfully:', newProfile.id);

            res.status(201).json({
                success: true,
                message: 'Profile created successfully',
                data: { profile: newProfile }
            });
        } catch (error) {
            console.error('❌ Error creating profile:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create profile',
                message: error.message
            });
        }
    }

    async getUserProfiles(req, res) {
        try {
            const { userId } = req.params;
            
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    error: 'User ID is required',
                    message: 'Please provide a valid user ID'
                });
            }

            const profiles = await this.profileModel.getProfilesByUserId(userId);
            
            res.status(200).json({
                success: true,
                message: 'Profiles retrieved successfully',
                data: { profiles }
            });
        } catch (error) {
            console.error('Error getting user profiles:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get profiles',
                message: error.message
            });
        }
    }

    async updateProfile(req, res) {
        try {
            const { id } = req.params;
            const { name, avatar, isChild } = req.body;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'Profile ID is required',
                    message: 'Please provide a valid profile ID'
                });
            }

            const profileData = {};
            if (name) profileData.name = name.trim();
            if (avatar) profileData.avatar = avatar;
            if (isChild !== undefined) profileData.isChild = isChild;

            if (Object.keys(profileData).length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No update data provided',
                    message: 'Please provide at least one field to update'
                });
            }

            const updatedProfile = await this.profileModel.updateProfile(id, profileData);
            
            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                data: { profile: updatedProfile }
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update profile',
                message: error.message
            });
        }
    }

    async deleteProfile(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'Profile ID is required',
                    message: 'Please provide a valid profile ID'
                });
            }

            await this.profileModel.deleteProfile(id);

            res.status(200).json({
                success: true,
                message: 'Profile deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting profile:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete profile',
                message: error.message
            });
        }
    }

    async saveWatchProgress(req, res) {
        try {
            const { id: profileId } = req.params;
            const { contentId, progress, currentTime, totalDuration } = req.body;

            if (!profileId || !contentId) {
                return res.status(400).json({
                    success: false,
                    error: 'Profile ID and Content ID are required'
                });
            }

            const result = await this.profileModel.saveWatchProgress(
                profileId,
                contentId,
                progress || 0,
                currentTime || 0,
                totalDuration || 60
            );

            res.status(200).json({
                success: true,
                message: 'Watch progress saved successfully',
                data: result
            });
        } catch (error) {
            console.error('Error saving watch progress:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to save watch progress',
                message: error.message
            });
        }
    }

    async getWatchHistory(req, res) {
        try {
            const { id: profileId } = req.params;

            if (!profileId) {
                return res.status(400).json({
                    success: false,
                    error: 'Profile ID is required'
                });
            }

            const watchHistory = await this.profileModel.getWatchHistory(profileId);

            res.status(200).json({
                success: true,
                data: watchHistory,
                count: watchHistory.length
            });
        } catch (error) {
            console.error('Error getting watch history:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get watch history',
                message: error.message
            });
        }
    }

    async getContinueWatching(req, res) {
        try {
            const { id: profileId } = req.params;

            if (!profileId) {
                return res.status(400).json({
                    success: false,
                    error: 'Profile ID is required'
                });
            }

            const continueWatching = await this.profileModel.getContinueWatching(profileId);

            res.status(200).json({
                success: true,
                data: continueWatching,
                count: continueWatching.length
            });
        } catch (error) {
            console.error('Error getting continue watching:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get continue watching',
                message: error.message
            });
        }
    }
}

module.exports = ProfileController;