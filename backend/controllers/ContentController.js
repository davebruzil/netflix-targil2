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

            // Find or create profile interaction
            let interaction = await this.contentModel.interactionModel.findOne({ profileId });
            if (!interaction) {
                interaction = new this.contentModel.interactionModel({
                    profileId,
                    likedContent: [],
                    watchProgress: new Map(),
                    searchHistory: [],
                    activityLog: []
                });
            }

            // Add to search history
            interaction.searchHistory.unshift({
                query: query,
                resultsCount: resultsCount,
                timestamp: new Date()
            });

            // Keep only last 50 searches
            interaction.searchHistory = interaction.searchHistory.slice(0, 50);

            // Add to activity log
            interaction.activityLog.unshift({
                action: 'search',
                query: query,
                resultsCount: resultsCount,
                timestamp: new Date()
            });

            // Keep only last 100 activities
            interaction.activityLog = interaction.activityLog.slice(0, 100);

            await interaction.save();
            console.log(`✅ Search history saved for profile: ${profileId}`);
        } catch (error) {
            console.error('Failed to track search history:', error);
        }
    }

    // Helper method to log activity
    async logActivity(profileId, action, contentId, extra = {}) {
        try {
            // Find or create profile interaction
            let interaction = await this.contentModel.interactionModel.findOne({ profileId });
            if (!interaction) {
                interaction = new this.contentModel.interactionModel({
                    profileId,
                    likedContent: [],
                    watchProgress: new Map(),
                    searchHistory: [],
                    activityLog: []
                });
            }

            // Find content item for title
            const contentItem = await this.contentModel.model.findById(contentId);
            if (!contentItem) return;

            // Add to activity log
            interaction.activityLog.unshift({
                action,
                contentId,
                contentTitle: contentItem.title,
                timestamp: new Date(),
                ...extra
            });

            // Keep only last 100 activities
            interaction.activityLog = interaction.activityLog.slice(0, 100);

            await interaction.save();
            console.log(`✅ ${action} activity logged for profile: ${profileId}, Content: ${contentItem.title}`);
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }

    /**
     * Get search history for a profile
     * @route GET /api/content/profile/:profileId/search-history
     */
    async getSearchHistory(req, res) {
        try {
            const { profileId } = req.params;
            const { limit = 20 } = req.query;

            console.log(`📝 GET /api/content/profile/${profileId}/search-history - Limit: ${limit}`);

            if (!profileId) {
                return res.status(400).json({
                    success: false,
                    error: 'Profile ID is required'
                });
            }

            const interaction = await this.contentModel.interactionModel.findOne({ profileId });
            if (!interaction) {
                return res.json({
                    success: true,
                    data: [],
                    message: 'No search history found'
                });
            }

            const searchHistory = interaction.searchHistory.slice(0, parseInt(limit));

            res.json({
                success: true,
                data: searchHistory,
                count: searchHistory.length,
                profileId: profileId
            });

        } catch (error) {
            console.error('Error getting search history:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get search history',
                message: error.message
            });
        }
    }

    // =============================================================================
    // DEV #2 (YARON) - MY LIST FEATURE
    // =============================================================================

    /**
     * Toggle My List status for content
     * @route POST /api/content/:id/mylist
     */
    async toggleMyList(req, res) {
        console.log(`📋 POST /api/content/${req.params.id}/mylist - ProfileId: ${req.body.profileId}, AddToList: ${req.body.addToList}`);
        try {
            const { id } = req.params;
            const { profileId, addToList } = req.body;

            if (!profileId) {
                return res.status(400).json({
                    success: false,
                    error: 'Profile ID is required'
                });
            }

            const result = await this.contentModel.toggleMyList(id, profileId, addToList);

            // Log activity
            await this.logActivity(profileId, addToList ? 'add_to_mylist' : 'remove_from_mylist', id);

            res.json({
                success: true,
                data: result,
                message: addToList ? 'Added to My List' : 'Removed from My List'
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
                error: 'Failed to update My List',
                message: error.message
            });
        }
    }

    /**
     * Get My List for a profile
     * @route GET /api/content/profile/:profileId/mylist
     */
    async getMyList(req, res) {
        console.log(`📋 GET /api/content/profile/${req.params.profileId}/mylist`);
        try {
            const { profileId } = req.params;

            if (!profileId) {
                return res.status(400).json({
                    success: false,
                    error: 'Profile ID is required'
                });
            }

            const myList = await this.contentModel.getMyList(profileId);

            res.json({
                success: true,
                data: myList,
                count: myList.length
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch My List',
                message: error.message
            });
        }
    }

    // =============================================================================
    // DEV #3 (ALON) - RECOMMENDATION & ADVANCED SEARCH METHODS (TO BE IMPLEMENTED)
    // =============================================================================

    /**
     * Get trending content
     * Algorithm: Use RecommendationEngine.getPopularContent()
     *
     * @route GET /api/content/trending
     */
    async getTrending(req, res) {
        try {
            const { limit = 10 } = req.query;

            console.log(`🔥 GET /api/content/trending - Limit: ${limit}`);

            // Import and use RecommendationEngine
            const RecommendationEngine = require('../services/RecommendationEngine');
            const trendingContent = await RecommendationEngine.getPopularContent(parseInt(limit));

            res.json({
                success: true,
                data: trendingContent,
                count: trendingContent.length
            });

        } catch (error) {
            console.error('Error getting trending content:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get trending content',
                message: error.message
            });
        }
    }

    /**
     * Get personalized recommendations for a profile
     * Algorithm: Use RecommendationEngine.getRecommendations()
     *
     * @route GET /api/content/recommendations/:profileId
     */
    async getRecommendations(req, res) {
        try {
            const { profileId } = req.params;
            const { limit = 10 } = req.query;

            console.log(`🎯 GET /api/content/recommendations/${profileId} - Limit: ${limit}`);

            if (!profileId) {
                return res.status(400).json({
                    success: false,
                    error: 'Profile ID is required'
                });
            }

            // Import and use RecommendationEngine
            const RecommendationEngine = require('../services/RecommendationEngine');
            const recommendations = await RecommendationEngine.getRecommendations(profileId, parseInt(limit));

            res.json({
                success: true,
                data: recommendations,
                count: recommendations.length,
                profileId: profileId
            });

        } catch (error) {
            console.error('Error getting recommendations:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get recommendations',
                message: error.message
            });
        }
    }

    /**
     * Get related/similar content for a specific item
     * "More Like This" functionality
     * Algorithm: Use RecommendationEngine.getRelatedContent()
     *
     * @route GET /api/content/:id/related
     */
    async getRelatedContent(req, res) {
        try {
            const { id } = req.params;
            const { limit = 6 } = req.query;

            console.log(`🔗 GET /api/content/${id}/related - Limit: ${limit}`);

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'Content ID is required'
                });
            }

            // Import and use RecommendationEngine
            const RecommendationEngine = require('../services/RecommendationEngine');
            const relatedContent = await RecommendationEngine.getRelatedContent(id, parseInt(limit));

            res.json({
                success: true,
                data: relatedContent,
                count: relatedContent.length,
                sourceContentId: id
            });

        } catch (error) {
            console.error('Error getting related content:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get related content',
                message: error.message
            });
        }
    }

    /**
     * Get trending content section
     * @route GET /api/content/sections/trending
     */
    async getTrendingContent(req, res) {
        return this.getTrending(req, res);
    }

    /**
     * Get new releases section
     * @route GET /api/content/sections/new-releases
     */
    async getNewReleases(req, res) {
        try {
            const { limit = 10 } = req.query;
            const ContentSchema = require('../schemas/ContentSchema');

            const newReleases = await ContentSchema.find()
                .sort({ createdAt: -1 })
                .limit(parseInt(limit));

            res.json({
                success: true,
                data: {
                    content: newReleases,
                    section: 'New Releases',
                    total: newReleases.length
                }
            });
        } catch (error) {
            console.error('Error getting new releases:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch new releases',
                message: error.message
            });
        }
    }

    /**
     * Get top rated section
     * @route GET /api/content/sections/top-rated
     */
    async getTopRated(req, res) {
        try {
            const { limit = 10 } = req.query;
            const ContentSchema = require('../schemas/ContentSchema');

            const topRated = await ContentSchema.find()
                .sort({ rating: -1, likes: -1 })
                .limit(parseInt(limit));

            res.json({
                success: true,
                data: {
                    content: topRated,
                    section: 'Top Rated',
                    total: topRated.length
                }
            });
        } catch (error) {
            console.error('Error getting top rated:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch top rated content',
                message: error.message
            });
        }
    }

    /**
     * Get continue watching section
     * @route GET /api/content/sections/continue-watching/:profileId
     */
    async getContinueWatching(req, res) {
        try {
            const { profileId } = req.params;
            const { limit = 10 } = req.query;

            if (!profileId) {
                return res.status(400).json({
                    success: false,
                    error: 'Profile ID is required'
                });
            }

            const ProfileInteractionSchema = require('../schemas/ProfileInteractionSchema');
            const ContentSchema = require('../schemas/ContentSchema');

            const interaction = await ProfileInteractionSchema.findOne({ profileId });

            if (!interaction || !interaction.watchProgress || interaction.watchProgress.size === 0) {
                return res.json({
                    success: true,
                    data: {
                        content: [],
                        section: 'Continue Watching',
                        total: 0
                    }
                });
            }

            // Get only MongoDB ObjectIds from watch progress
            const contentIds = Array.from(interaction.watchProgress.keys())
                .filter(id => id.match(/^[0-9a-fA-F]{24}$/));

            if (contentIds.length === 0) {
                return res.json({
                    success: true,
                    data: {
                        content: [],
                        section: 'Continue Watching',
                        total: 0
                    }
                });
            }

            const continueContent = await ContentSchema.find({
                _id: { $in: contentIds }
            }).limit(parseInt(limit));

            res.json({
                success: true,
                data: {
                    content: continueContent,
                    section: 'Continue Watching',
                    total: continueContent.length
                }
            });
        } catch (error) {
            console.error('Error getting continue watching:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch continue watching content',
                message: error.message
            });
        }
    }

    /**
     * Get available genres
     * @route GET /api/content/sections/genres
     */
    async getAvailableGenres(req, res) {
        try {
            const ContentSchema = require('../schemas/ContentSchema');
            const genres = await ContentSchema.distinct('genre');

            const uniqueGenres = [...new Set(
                genres.flatMap(g => g.split(',').map(genre => genre.trim())).filter(g => g)
            )].sort();

            res.json({
                success: true,
                data: {
                    genres: uniqueGenres,
                    total: uniqueGenres.length
                }
            });
        } catch (error) {
            console.error('Error getting genres:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch genres',
                message: error.message
            });
        }
    }
}

module.exports = ContentController;