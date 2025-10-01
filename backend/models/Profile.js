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
}

module.exports = Profile;
