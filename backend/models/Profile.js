const fs = require('fs').promises;
const path = require('path');

class Profile {
    constructor() {
        this.dataFile = path.join(__dirname, '..', 'data', 'profiles.json');
    }

    async getAllProfiles() {
        try {
            const data = await fs.readFile(this.dataFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading profiles data:', error);
            // Return empty structure if file doesn't exist or is corrupted
            return { profiles: [] };
        }
    }

    async saveProfiles(profiles) {
        try {
            await fs.writeFile(this.dataFile, JSON.stringify(profiles, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving profiles data:', error);
            throw new Error('Failed to save profiles data');
        }
    }

    async createProfile(profileData) {
        try {
            // 1. Get existing profiles
            const profilesData = await this.getAllProfiles();
            
            // 2. Create new profile object
            const newProfile = {
                id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId: profileData.userId,
                name: profileData.name,
                avatar: profileData.avatar || `https://via.placeholder.com/150/${Math.floor(Math.random()*16777215).toString(16)}/FFFFFF?text=${profileData.name.charAt(0).toUpperCase()}`,
                isChild: profileData.isChild || false,
                createdAt: new Date().toISOString()
            };
            
            // 3. Add to profiles array
            profilesData.profiles.push(newProfile);
            
            // 4. Save to file
            await this.saveProfiles(profilesData);
            
            // 5. Return profile
            return newProfile;
        } catch (error) {
            console.error('Error creating profile:', error);
            throw error;
        }
    }

    async getProfilesByUserId(userId) {
        try {
            const profilesData = await this.getAllProfiles();
            const userProfiles = profilesData.profiles.filter(profile => profile.userId === userId);
            return userProfiles;
        } catch (error) {
            console.error('Error finding profiles by user ID:', error);
            throw error;
        }
    }

    async getProfileById(profileId) {
        try {
            const profilesData = await this.getAllProfiles();
            const profile = profilesData.profiles.find(profile => profile.id === profileId);
            return profile || null;
        } catch (error) {
            console.error('Error finding profile by ID:', error);
            throw error;
        }
    }

    async updateProfile(profileId, profileData) {
        try {
            const profilesData = await this.getAllProfiles();
            const profileIndex = profilesData.profiles.findIndex(profile => profile.id === profileId);
            
            if (profileIndex === -1) {
                throw new Error('Profile not found');
            }

            // Update profile fields
            const profile = profilesData.profiles[profileIndex];
            if (profileData.name) profile.name = profileData.name;
            if (profileData.avatar) profile.avatar = profileData.avatar;
            if (profileData.isChild !== undefined) profile.isChild = profileData.isChild;

            await this.saveProfiles(profilesData);
            return profile;
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    }

    async deleteProfile(profileId) {
        try {
            const profilesData = await this.getAllProfiles();
            const profileIndex = profilesData.profiles.findIndex(profile => profile.id === profileId);
            
            if (profileIndex === -1) {
                throw new Error('Profile not found');
            }

            // Check if this is the last profile for the user
            const profile = profilesData.profiles[profileIndex];
            const userProfiles = profilesData.profiles.filter(p => p.userId === profile.userId);
            
            if (userProfiles.length <= 1) {
                throw new Error('Cannot delete the last profile for a user');
            }

            profilesData.profiles.splice(profileIndex, 1);
            await this.saveProfiles(profilesData);
            return true;
        } catch (error) {
            console.error('Error deleting profile:', error);
            throw error;
        }
    }
}

module.exports = Profile;