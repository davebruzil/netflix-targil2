const Profile = require('../models/Profile');
const ProfileInteraction = require('../schemas/ProfileInteractionSchema');
const Content = require('../schemas/ContentSchema');

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

    async getStatistics(req, res) {
        try {
            const { userId } = req.params;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    error: 'User ID is required'
                });
            }

            // Get all profiles for this user
            const profiles = await this.profileModel.getProfilesByUserId(userId);

            if (!profiles || profiles.length === 0) {
                return res.json({
                    success: true,
                    data: {
                        dailyViews: [],
                        genrePopularity: []
                    }
                });
            }

            const profileIds = profiles.map(p => p._id);

            // Get daily views for each profile (last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const dailyViewsData = await ProfileInteraction.aggregate([
                {
                    $match: {
                        profileId: { $in: profileIds },
                        'activityLog.timestamp': { $gte: sevenDaysAgo },
                        'activityLog.action': 'watch'
                    }
                },
                { $unwind: '$activityLog' },
                {
                    $match: {
                        'activityLog.action': 'watch',
                        'activityLog.timestamp': { $gte: sevenDaysAgo }
                    }
                },
                {
                    $group: {
                        _id: {
                            profileId: '$profileId',
                            date: {
                                $dateToString: {
                                    format: '%Y-%m-%d',
                                    date: '$activityLog.timestamp'
                                }
                            }
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { '_id.date': 1 }
                }
            ]);

            // Format daily views for Chart.js
            const dailyViews = {};
            profiles.forEach(profile => {
                dailyViews[profile.name] = [];
            });

            const dates = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                dates.push(dateStr);

                profiles.forEach(profile => {
                    dailyViews[profile.name].push(0);
                });
            }

            dailyViewsData.forEach(item => {
                const profile = profiles.find(p => p._id.toString() === item._id.profileId.toString());
                if (profile) {
                    const dateIndex = dates.indexOf(item._id.date);
                    if (dateIndex !== -1) {
                        dailyViews[profile.name][dateIndex] = item.count;
                    }
                }
            });

            // Get genre popularity (from liked content)
            const genreData = await ProfileInteraction.aggregate([
                {
                    $match: {
                        profileId: { $in: profileIds }
                    }
                },
                { $unwind: '$likedContent' },
                {
                    $lookup: {
                        from: 'contents',
                        localField: 'likedContent.id',
                        foreignField: '_id',
                        as: 'contentInfo'
                    }
                },
                { $unwind: '$contentInfo' },
                {
                    $group: {
                        _id: '$contentInfo.genre',
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { count: -1 }
                }
            ]);

            res.json({
                success: true,
                data: {
                    dailyViews: {
                        labels: dates.map(d => {
                            const date = new Date(d);
                            return `${date.getMonth() + 1}/${date.getDate()}`;
                        }),
                        datasets: Object.keys(dailyViews).map((profileName, index) => ({
                            label: profileName,
                            data: dailyViews[profileName],
                            backgroundColor: `hsl(${index * 60}, 70%, 50%)`
                        }))
                    },
                    genrePopularity: {
                        labels: genreData.map(g => g._id || 'Unknown'),
                        data: genreData.map(g => g.count)
                    }
                }
            });
        } catch (error) {
            console.error('Error getting statistics:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get statistics',
                message: error.message
            });
        }
    }
}

module.exports = ProfileController;