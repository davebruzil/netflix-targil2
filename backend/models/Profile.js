const fs = require('fs').promises;
const path = require('path');

class Profile {
    constructor() {
        this.dataFile = path.join(__dirname, '..', 'data', 'content.json');
    }

    async getAllData() {
        try {
            const data = await fs.readFile(this.dataFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading content data:', error);
            throw new Error('Failed to load content data');
        }
    }

    async saveData(data) {
        try {
            await fs.writeFile(this.dataFile, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('Error writing content data:', error);
            throw new Error('Failed to save content data');
        }
    }

    async getAllProfiles() {
        const data = await this.getAllData();
        const profiles = data.profiles || {};
        
        // Convert profile data to frontend-expected format
        const profileList = [];
        for (const [profileId, profileData] of Object.entries(profiles)) {
            // Skip test profiles that don't match expected format
            if (profileId.includes('_test') || profileId === 'user123') {
                continue;
            }
            
            profileList.push({
                id: profileId,
                name: profileId.charAt(0).toUpperCase() + profileId.slice(1),
                avatar: this.getAvatarUrl(profileId),
                preferences: {
                    language: 'en'
                },
                likedContent: profileData.likedContent || [],
                watchProgress: profileData.watchProgress || {},
                searchHistory: profileData.searchHistory || [],
                activityLog: profileData.activityLog || []
            });
        }
        
        return profileList;
    }

    async getProfileById(profileId) {
        const data = await this.getAllData();
        const profileData = data.profiles?.[profileId];
        
        if (!profileData) {
            return null;
        }
        
        return {
            id: profileId,
            name: profileId.charAt(0).toUpperCase() + profileId.slice(1),
            avatar: this.getAvatarUrl(profileId),
            preferences: {
                language: 'en'
            },
            likedContent: profileData.likedContent || [],
            watchProgress: profileData.watchProgress || {},
            searchHistory: profileData.searchHistory || [],
            activityLog: profileData.activityLog || []
        };
    }

    async createProfile(profileData) {
        const data = await this.getAllData();
        const { id, name, avatar, preferences } = profileData;
        
        if (!data.profiles) {
            data.profiles = {};
        }
        
        if (data.profiles[id]) {
            throw new Error('Profile already exists');
        }
        
        data.profiles[id] = {
            likedContent: [],
            watchProgress: {},
            searchHistory: [],
            activityLog: []
        };
        
        await this.saveData(data);
        
        return {
            id,
            name: name || id.charAt(0).toUpperCase() + id.slice(1),
            avatar: avatar || this.getAvatarUrl(id),
            preferences: preferences || { language: 'en' },
            likedContent: [],
            watchProgress: {},
            searchHistory: [],
            activityLog: []
        };
    }

    async updateProfile(profileId, updates) {
        const data = await this.getAllData();
        
        if (!data.profiles || !data.profiles[profileId]) {
            throw new Error('Profile not found');
        }
        
        // Only update the internal data structure, not the profile metadata
        const profileData = data.profiles[profileId];
        
        if (updates.likedContent !== undefined) {
            profileData.likedContent = updates.likedContent;
        }
        if (updates.watchProgress !== undefined) {
            profileData.watchProgress = updates.watchProgress;
        }
        if (updates.searchHistory !== undefined) {
            profileData.searchHistory = updates.searchHistory;
        }
        if (updates.activityLog !== undefined) {
            profileData.activityLog = updates.activityLog;
        }
        
        await this.saveData(data);
        
        return await this.getProfileById(profileId);
    }

    async deleteProfile(profileId) {
        const data = await this.getAllData();
        
        if (!data.profiles || !data.profiles[profileId]) {
            throw new Error('Profile not found');
        }
        
        delete data.profiles[profileId];
        await this.saveData(data);
        
        return true;
    }

    getAvatarUrl(profileId) {
        const avatarMap = {
            'paul': 'https://i.pravatar.cc/150?img=1',
            'alon': 'https://i.pravatar.cc/150?img=8', 
            'ronni': 'https://i.pravatar.cc/150?img=9',
            'anna': 'https://i.pravatar.cc/150?img=5',
            'noa': 'https://i.pravatar.cc/150?img=10'
        };
        
        return avatarMap[profileId] || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 20) + 1}`;
    }
}

module.exports = Profile;