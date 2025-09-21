// Content Model - Data Access Layer
const fs = require('fs').promises;
const path = require('path');

class Content {
    constructor() {
        this.dataFile = path.join(__dirname, '..', 'data', 'content.json');
    }

    // Read all content data from file
    async getAllData() {
        try {
            const data = await fs.readFile(this.dataFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading content data:', error);
            throw new Error('Failed to load content data');
        }
    }

    // Write content data to file
    async saveData(data) {
        try {
            await fs.writeFile(this.dataFile, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('Error writing content data:', error);
            throw new Error('Failed to save content data');
        }
    }

    // Get all content items
    async getAllContent() {
        const data = await this.getAllData();
        return data.content;
    }

    // Get content organized by sections
    async getContentBySections() {
        const data = await this.getAllData();
        const { sections, content } = data;

        const organizedContent = {};
        for (const [sectionName, contentIds] of Object.entries(sections)) {
            organizedContent[sectionName] = contentIds.map(id =>
                content.find(item => item.id === id)
            ).filter(Boolean);
        }

        return organizedContent;
    }

    // Get single content item by ID
    async getContentById(id) {
        const data = await this.getAllData();
        const item = data.content.find(content => content.id === id);

        if (!item) {
            return null;
        }

        // Add like count
        const itemWithLikes = {
            ...item,
            likes: data.contentLikes?.[id] || 0
        };

        return itemWithLikes;
    }

    // Search content by query
    async searchContent(query, limit = 20) {
        const data = await this.getAllData();
        const searchTerm = query.toLowerCase().trim();

        const results = data.content.filter(item => {
            const titleMatch = item.title.toLowerCase().includes(searchTerm);
            const descriptionMatch = item.description.toLowerCase().includes(searchTerm);
            const genreMatch = item.genre.toLowerCase().includes(searchTerm);
            const categoryMatch = item.category.toLowerCase().includes(searchTerm);

            return titleMatch || descriptionMatch || genreMatch || categoryMatch;
        }).slice(0, parseInt(limit));

        return results;
    }

    // Toggle like status for content
    async toggleLike(contentId, profileId, liked) {
        const data = await this.getAllData();

        // Find content
        const contentIndex = data.content.findIndex(item => item.id === contentId);
        if (contentIndex === -1) {
            throw new Error('Content not found');
        }

        // Initialize data structures
        if (!data.profiles) data.profiles = {};
        if (!data.profiles[profileId]) {
            data.profiles[profileId] = {
                likedContent: [],
                watchProgress: {},
                searchHistory: [],
                activityLog: []
            };
        }
        if (!data.contentLikes) data.contentLikes = {};
        if (!data.contentLikes[contentId]) data.contentLikes[contentId] = 0;

        const profile = data.profiles[profileId];
        const contentItem = data.content[contentIndex];

        // Update like status
        if (liked) {
            if (!profile.likedContent.includes(contentId)) {
                profile.likedContent.push(contentId);
                data.contentLikes[contentId] += 1;
            }
        } else {
            const likedIndex = profile.likedContent.indexOf(contentId);
            if (likedIndex > -1) {
                profile.likedContent.splice(likedIndex, 1);
                data.contentLikes[contentId] = Math.max(0, data.contentLikes[contentId] - 1);
            }
        }

        // Save data
        await this.saveData(data);

        return {
            contentId,
            liked: profile.likedContent.includes(contentId),
            totalLikes: data.contentLikes[contentId]
        };
    }

    // Get liked content for profile
    async getLikedContent(profileId) {
        const data = await this.getAllData();
        const profile = data.profiles?.[profileId];

        if (!profile) {
            return [];
        }

        const likedContent = profile.likedContent.map(id =>
            data.content.find(item => item.id === id)
        ).filter(Boolean);

        return likedContent;
    }

    // Update watch progress
    async updateProgress(contentId, profileId, progress) {
        const data = await this.getAllData();

        // Validate content exists
        const contentExists = data.content.some(item => item.id === contentId);
        if (!contentExists) {
            throw new Error('Content not found');
        }

        // Initialize profile data
        if (!data.profiles) data.profiles = {};
        if (!data.profiles[profileId]) {
            data.profiles[profileId] = {
                likedContent: [],
                watchProgress: {},
                searchHistory: [],
                activityLog: []
            };
        }

        // Update progress
        const newProgress = Math.max(0, Math.min(100, progress));
        data.profiles[profileId].watchProgress[contentId] = newProgress;

        await this.saveData(data);

        return {
            contentId,
            progress: newProgress
        };
    }
}

module.exports = Content;