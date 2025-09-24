const Profile = require('../models/Profile');

class ProfileController {
    constructor() {
        this.profileModel = new Profile();
    }

    async getAllProfiles(req, res) {
        console.log('📥 GET /api/profiles - Fetching all profiles');
        try {
            const profiles = await this.profileModel.getAllProfiles();

            res.json({
                success: true,
                data: {
                    profiles,
                    count: profiles.length
                }
            });
        } catch (error) {
            console.error('Error fetching profiles:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch profiles',
                message: error.message
            });
        }
    }

    async getProfileById(req, res) {
        console.log(`📥 GET /api/profiles/${req.params.id} - Fetching profile by ID`);
        try {
            const { id } = req.params;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'Profile ID is required'
                });
            }

            const profile = await this.profileModel.getProfileById(id);
            
            if (!profile) {
                return res.status(404).json({
                    success: false,
                    error: 'Profile not found'
                });
            }

            res.json({
                success: true,
                data: {
                    profile
                }
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch profile',
                message: error.message
            });
        }
    }

    async createProfile(req, res) {
        console.log('📥 POST /api/profiles - Creating new profile');
        try {
            const { id, name, avatar, preferences } = req.body;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'Profile ID is required'
                });
            }

            const profileData = {
                id,
                name: name || id.charAt(0).toUpperCase() + id.slice(1),
                avatar,
                preferences: preferences || { language: 'en' }
            };

            const newProfile = await this.profileModel.createProfile(profileData);

            res.status(201).json({
                success: true,
                data: {
                    profile: newProfile
                },
                message: 'Profile created successfully'
            });
        } catch (error) {
            console.error('Error creating profile:', error);
            
            if (error.message === 'Profile already exists') {
                return res.status(409).json({
                    success: false,
                    error: 'Profile already exists'
                });
            }
            
            res.status(500).json({
                success: false,
                error: 'Failed to create profile',
                message: error.message
            });
        }
    }

    async updateProfile(req, res) {
        console.log(`📥 PUT /api/profiles/${req.params.id} - Updating profile`);
        try {
            const { id } = req.params;
            const updates = req.body;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'Profile ID is required'
                });
            }

            const updatedProfile = await this.profileModel.updateProfile(id, updates);

            res.json({
                success: true,
                data: {
                    profile: updatedProfile
                },
                message: 'Profile updated successfully'
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            
            if (error.message === 'Profile not found') {
                return res.status(404).json({
                    success: false,
                    error: 'Profile not found'
                });
            }
            
            res.status(500).json({
                success: false,
                error: 'Failed to update profile',
                message: error.message
            });
        }
    }

    async deleteProfile(req, res) {
        console.log(`📥 DELETE /api/profiles/${req.params.id} - Deleting profile`);
        try {
            const { id } = req.params;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'Profile ID is required'
                });
            }

            await this.profileModel.deleteProfile(id);

            res.json({
                success: true,
                message: 'Profile deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting profile:', error);
            
            if (error.message === 'Profile not found') {
                return res.status(404).json({
                    success: false,
                    error: 'Profile not found'
                });
            }
            
            res.status(500).json({
                success: false,
                error: 'Failed to delete profile',
                message: error.message
            });
        }
    }

    // Additional method for frontend compatibility
    async getUserProfiles(req, res) {
        console.log(`📥 GET /api/profiles/user/${req.params.userId} - Fetching profiles for user`);
        try {
            // For now, return all profiles since the current system doesn't have user-specific profiles
            // This maintains compatibility with the existing route structure
            const profiles = await this.profileModel.getAllProfiles();

            res.json({
                success: true,
                data: {
                    profiles,
                    userId: req.params.userId,
                    count: profiles.length
                }
            });
        } catch (error) {
            console.error('Error fetching user profiles:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch user profiles',
                message: error.message
            });
        }
    }
}

module.exports = ProfileController;