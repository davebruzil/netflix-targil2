// Content Controller - Business Logic Layer
const Content = require('../models/Content');

class ContentController {
    constructor() {
        this.contentModel = new Content();
    }

    // Get all content catalog
    async getAllContent(req, res) {
        console.log('📥 GET /api/content - Fetching all content catalog');
        try {
            const data = await this.contentModel.getAllData();

            res.json({
                success: true,
                data: {
                    content: data.content,
                    sections: data.sections,
                    metadata: data.metadata
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch content catalog',
                message: error.message
            });
        }
    }

    // Get content organized by sections
    async getContentBySections(req, res) {
        try {
            const organizedContent = await this.contentModel.getContentBySections();

            res.json({
                success: true,
                data: organizedContent
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch sectioned content',
                message: error.message
            });
        }
    }

    // Search content
    async searchContent(req, res) {
        console.log(`🔍 GET /api/content/search - Query: "${req.query.q}", ProfileId: ${req.query.profileId}, Limit: ${req.query.limit}`);
        try {
            const { q: query, limit = 20, profileId } = req.query;

            if (!query || query.trim().length === 0) {
                return res.json({
                    success: true,
                    data: [],
                    message: 'No search query provided'
                });
            }

            const results = await this.contentModel.searchContent(query, limit);

            // Track search history if profileId provided
            if (profileId && results.length > 0) {
                await this.trackSearchHistory(profileId, query.trim(), results.length);
            }

            res.json({
                success: true,
                data: results,
                query: query,
                resultsCount: results.length
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Search failed',
                message: error.message
            });
        }
    }

    // Get specific content item
    async getContentById(req, res) {
        try {
            const { id } = req.params;
            const item = await this.contentModel.getContentById(id);

            if (!item) {
                return res.status(404).json({
                    success: false,
                    error: 'Content not found',
                    message: `No content found with ID: ${id}`
                });
            }

            res.json({
                success: true,
                data: item
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch content item',
                message: error.message
            });
        }
    }

    // Toggle like status
    async toggleLike(req, res) {
        console.log(`❤️ POST /api/content/${req.params.id}/like - ProfileId: ${req.body.profileId}, Liked: ${req.body.liked}`);
        try {
            const { id } = req.params;
            const { profileId, liked } = req.body;

            if (!profileId) {
                return res.status(400).json({
                    success: false,
                    error: 'Profile ID is required'
                });
            }

            const result = await this.contentModel.toggleLike(id, profileId, liked);

            // Log activity
            await this.logActivity(profileId, liked ? 'like' : 'unlike', id);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            if (error.message === 'Content not found') {
                return res.status(404).json({
                    success: false,
                    error: 'Content not found'
                });
            }

            res.status(500).json({
                success: false,
                error: 'Failed to update like status',
                message: error.message
            });
        }
    }

    // Get liked content for profile
    async getLikedContent(req, res) {
        try {
            const { profileId } = req.params;
            const likedContent = await this.contentModel.getLikedContent(profileId);

            res.json({
                success: true,
                data: likedContent
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch liked content',
                message: error.message
            });
        }
    }

    // Update watch progress
    async updateProgress(req, res) {
        try {
            const { id } = req.params;
            const { profileId, progress } = req.body;

            if (!profileId || progress === undefined) {
                return res.status(400).json({
                    success: false,
                    error: 'Profile ID and progress are required'
                });
            }

            const result = await this.contentModel.updateProgress(id, profileId, progress);

            // Log activity
            await this.logActivity(profileId, 'watch_progress', id, { progress });

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            if (error.message === 'Content not found') {
                return res.status(404).json({
                    success: false,
                    error: 'Content not found'
                });
            }

            res.status(500).json({
                success: false,
                error: 'Failed to update progress',
                message: error.message
            });
        }
    }

    // Helper method to track search history
    async trackSearchHistory(profileId, query, resultsCount) {
        try {
            console.log(`📝 Tracking search history for profile: ${profileId}, Query: "${query}", Results: ${resultsCount}`);

            const data = await this.contentModel.getAllData();

            if (!data.profiles[profileId]) {
                data.profiles[profileId] = {
                    likedContent: [],
                    watchProgress: {},
                    searchHistory: [],
                    activityLog: []
                };
            }

            const profile = data.profiles[profileId];

            // Add to search history
            profile.searchHistory.unshift({
                query: query,
                resultsCount: resultsCount,
                timestamp: new Date().toISOString()
            });
            profile.searchHistory = profile.searchHistory.slice(0, 50);

            // Add to activity log
            profile.activityLog.unshift({
                action: 'search',
                query: query,
                resultsCount: resultsCount,
                timestamp: new Date().toISOString()
            });
            profile.activityLog = profile.activityLog.slice(0, 100);

            await this.contentModel.saveData(data);
            console.log(`✅ Search history saved for profile: ${profileId}`);
        } catch (error) {
            console.error('Failed to track search history:', error);
        }
    }

    // Helper method to log activity
    async logActivity(profileId, action, contentId, extra = {}) {
        try {
            const data = await this.contentModel.getAllData();

            if (!data.profiles[profileId]) return;

            const contentItem = data.content.find(item => item.id === contentId);
            if (!contentItem) return;

            data.profiles[profileId].activityLog.unshift({
                action,
                contentId,
                contentTitle: contentItem.title,
                timestamp: new Date().toISOString(),
                ...extra
            });
            data.profiles[profileId].activityLog = data.profiles[profileId].activityLog.slice(0, 100);

            await this.contentModel.saveData(data);
            console.log(`✅ ${action} activity logged for profile: ${profileId}, Content: ${contentItem.title}`);
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }
}

module.exports = ContentController;