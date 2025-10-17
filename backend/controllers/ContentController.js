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

            // Search both MongoDB and TMDB in parallel
            const [dbResults, tmdbResults] = await Promise.all([
                this.contentModel.searchContent(query, Math.ceil(limit / 2)),
                this.searchTMDB(query, Math.ceil(limit / 2))
            ]);

            // Combine results (DB results first, then TMDB)
            const combinedResults = [...dbResults, ...tmdbResults].slice(0, parseInt(limit));

            console.log(`🔍 Search results: ${dbResults.length} from DB, ${tmdbResults.length} from TMDB`);

            // Track search history if profileId provided
            if (profileId && combinedResults.length > 0) {
                await this.trackSearchHistory(profileId, query.trim(), combinedResults.length);
            }

            res.json({
                success: true,
                data: combinedResults,
                query: query,
                resultsCount: combinedResults.length,
                sources: {
                    database: dbResults.length,
                    tmdb: tmdbResults.length
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Search failed',
                message: error.message
            });
        }
    }

    // Helper method to search TMDB API
    async searchTMDB(query, limit = 10) {
        try {
            const axios = require('axios');

            const response = await axios.get('https://api.themoviedb.org/3/search/multi', {
                params: {
                    api_key: process.env.TMDB_API_KEY,
                    query: query,
                    page: 1
                }
            });

            if (!response.data || !response.data.results) {
                return [];
            }

            // Format TMDB results to match our content structure
            const formattedResults = response.data.results
                .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
                .slice(0, limit)
                .map(item => ({
                    id: `${item.media_type}_${item.id}`,
                    _id: `${item.media_type}_${item.id}`,
                    title: item.title || item.name,
                    description: item.overview || 'No description available.',
                    image: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
                    backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
                    rating: item.vote_average ? parseFloat(item.vote_average.toFixed(1)) : 0,
                    year: item.release_date ? new Date(item.release_date).getFullYear() :
                          item.first_air_date ? new Date(item.first_air_date).getFullYear() : null,
                    genre: item.media_type === 'movie' ? 'Movie' : 'TV Show',
                    category: item.media_type === 'movie' ? 'Movie' : 'Series',
                    popularity: item.popularity || 0,
                    likes: Math.floor(item.vote_count / 100) || 0,
                    source: 'tmdb'
                }));

            return formattedResults;
        } catch (error) {
            console.error('TMDB search error:', error.message);
            return [];
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

    // Helper method to track search history with retry logic for version conflicts
    async trackSearchHistory(profileId, query, resultsCount, retries = 3) {
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                console.log(`📝 Tracking search history for profile: ${profileId}, Query: "${query}", Results: ${resultsCount} (Attempt ${attempt + 1})`);

                // Use findOneAndUpdate with atomic operations to avoid version conflicts
                const result = await this.contentModel.interactionModel.findOneAndUpdate(
                    { profileId },
                    {
                        $push: {
                            searchHistory: {
                                $each: [{
                                    query: query,
                                    resultsCount: resultsCount,
                                    timestamp: new Date()
                                }],
                                $position: 0,
                                $slice: 50 // Keep only last 50 searches
                            },
                            activityLog: {
                                $each: [{
                                    action: 'search',
                                    query: query,
                                    resultsCount: resultsCount,
                                    timestamp: new Date()
                                }],
                                $position: 0,
                                $slice: 100 // Keep only last 100 activities
                            }
                        }
                    },
                    {
                        upsert: true, // Create if doesn't exist
                        new: true,
                        setDefaultsOnInsert: true
                    }
                );

                console.log(`✅ Search history saved for profile: ${profileId}`);
                return; // Success, exit retry loop
            } catch (error) {
                if (error.name === 'VersionError' && attempt < retries - 1) {
                    console.warn(`⚠️ Version conflict on attempt ${attempt + 1}, retrying...`);
                    // Wait a bit before retrying to reduce conflicts
                    await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)));
                    continue;
                } else {
                    console.error('Failed to track search history:', error.message);
                    return; // Give up after retries
                }
            }
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
                    myList: [],
                    watchProgress: new Map(),
                    searchHistory: [],
                    activityLog: []
                });
            }

            // Try to find content item for title (only works with MongoDB ObjectIds)
            let contentTitle = contentId; // Default to contentId
            if (contentId.match(/^[0-9a-fA-F]{24}$/)) {
                const contentItem = await this.contentModel.model.findById(contentId);
                if (contentItem) {
                    contentTitle = contentItem.title;
                }
            } else {
                // For TMDB IDs, just use the ID as the title
                contentTitle = contentId;
            }

            // Add to activity log
            interaction.activityLog.unshift({
                action,
                contentId,
                contentTitle: contentTitle,
                timestamp: new Date(),
                ...extra
            });

            // Keep only last 100 activities
            interaction.activityLog = interaction.activityLog.slice(0, 100);

            await interaction.save();
            console.log(`✅ ${action} activity logged for profile: ${profileId}, Content: ${contentTitle}`);
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
     * Get content by genre (simple version for sections)
     * @route GET /api/content/sections/genre/:genre
     */
    async getContentByGenre(req, res) {
        try {
            const { genre } = req.params;
            const { limit = 10 } = req.query;
            const ContentSchema = require('../schemas/ContentSchema');

            // Find content that contains the specified genre
            const content = await ContentSchema.find({
                genre: { $regex: genre, $options: 'i' }
            }).limit(parseInt(limit));

            res.json({
                success: true,
                data: {
                    content: content,
                    genre: genre,
                    total: content.length
                }
            });
        } catch (error) {
            console.error('Error getting content by genre:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch content by genre',
                message: error.message
            });
        }
    }

    /**
     * Browse genre with pagination, sorting, and filtering
     * @route GET /api/content/browse/genre/:genre
     */
    async browseGenre(req, res) {
        try {
            const { genre } = req.params;
            const {
                page = 1,
                limit = 20,
                sort = 'popularity', // popularity, rating, title, recent
                watchStatus = 'all', // all, watched, unwatched
                profileId
            } = req.query;

            console.log(`🎬 GET /api/content/browse/genre/${genre} - Page: ${page}, Sort: ${sort}, Status: ${watchStatus}, ProfileId: ${profileId}`);

            const axios = require('axios');
            const ContentSchema = require('../schemas/ContentSchema');
            const ProfileInteractionSchema = require('../schemas/ProfileInteractionSchema');
            const ProfileSchema = require('../schemas/ProfileSchema');

            // Map genre names to TMDB genre IDs
            const genreMap = {
                'Action': 28,
                'Adventure': 12,
                'Animation': 16,
                'Comedy': 35,
                'Crime': 80,
                'Documentary': 99,
                'Drama': 18,
                'Family': 10751,
                'Fantasy': 14,
                'History': 36,
                'Horror': 27,
                'Music': 10402,
                'Mystery': 9648,
                'Romance': 10749,
                'Science Fiction': 878,
                'Sci-Fi': 878,
                'TV Movie': 10770,
                'Thriller': 53,
                'War': 10752,
                'Western': 37
            };

            const tmdbGenreId = genreMap[genre] || null;
            let allContent = [];

            // Fetch from TMDB API if we have a matching genre
            if (tmdbGenreId) {
                try {
                    const tmdbResponse = await axios.get(`https://api.themoviedb.org/3/discover/movie`, {
                        params: {
                            api_key: process.env.TMDB_API_KEY,
                            with_genres: tmdbGenreId,
                            page: parseInt(page),
                            sort_by: sort === 'rating' ? 'vote_average.desc' : sort === 'recent' ? 'release_date.desc' : 'popularity.desc',
                            'vote_count.gte': 100 // Minimum votes for quality
                        }
                    });

                    if (tmdbResponse.data && tmdbResponse.data.results) {
                        const tmdbContent = tmdbResponse.data.results.map(movie => ({
                            id: `movie_${movie.id}`,
                            _id: `movie_${movie.id}`,
                            title: movie.title,
                            description: movie.overview,
                            image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
                            backdrop: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null,
                            rating: movie.vote_average ? parseFloat(movie.vote_average.toFixed(1)) : 0,
                            year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
                            genre: genre,
                            category: 'Movie',
                            popularity: movie.popularity || 0,
                            likes: Math.floor(movie.vote_count / 100) || 0,
                            source: 'tmdb'
                        }));
                        allContent = tmdbContent;
                        console.log(`✅ Fetched ${tmdbContent.length} movies from TMDB for genre: ${genre}`);
                    }
                } catch (tmdbError) {
                    console.error('TMDB API error:', tmdbError.message);
                }
            }

            // Also fetch from local MongoDB
            try {
                const localContent = await ContentSchema.find({
                    genre: { $regex: genre, $options: 'i' }
                });

                const localFormatted = localContent.map(item => ({
                    ...item.toObject(),
                    source: 'local'
                }));

                allContent = [...allContent, ...localFormatted];
                console.log(`✅ Total content: ${allContent.length} (${localFormatted.length} from local DB)`);
            } catch (dbError) {
                console.error('MongoDB error:', dbError.message);
            }

            // Get watched content IDs and continue watching IDs if profileId provided
            let watchedIds = [];
            let continueWatchingIds = [];
            if (profileId) {
                console.log(`📊 Checking watch progress for profile: ${profileId}`);

                // Check Profile.watchHistory (primary source)
                const profile = await ProfileSchema.findById(profileId);
                if (profile && profile.watchHistory && profile.watchHistory.length > 0) {
                    console.log(`📚 Found ${profile.watchHistory.length} items in watch history`);
                    profile.watchHistory.forEach(item => {
                        const progress = item.progress || 0;
                        console.log(`  - Content: ${item.contentId}, Progress: ${progress}%, Completed: ${item.isCompleted}`);

                        if (item.isCompleted || progress >= 90) {
                            watchedIds.push(item.contentId);
                        } else if (progress > 0) {
                            continueWatchingIds.push(item.contentId);
                        }
                    });
                }

                // Also check ProfileInteraction.watchProgress (secondary source)
                const interaction = await ProfileInteractionSchema.findOne({ profileId });
                if (interaction && interaction.watchProgress) {
                    console.log(`📝 Found ${interaction.watchProgress.size} items in profile interaction`);
                    Array.from(interaction.watchProgress.keys()).forEach(id => {
                        const progressData = interaction.watchProgress.get(id);
                        let progress = 0;

                        if (typeof progressData === 'object' && progressData.progress !== undefined) {
                            progress = progressData.progress;
                        } else if (typeof progressData === 'number') {
                            progress = progressData;
                        }

                        if (progress >= 90 && !watchedIds.includes(id)) {
                            watchedIds.push(id);
                        } else if (progress > 0 && progress < 90 && !continueWatchingIds.includes(id)) {
                            continueWatchingIds.push(id);
                        }
                    });
                }

                console.log(`✅ Watched IDs (${watchedIds.length}):`, watchedIds);
                console.log(`▶️ Continue Watching IDs (${continueWatchingIds.length}):`, continueWatchingIds);
            }

            // Apply watch status filter
            if (watchStatus === 'watched') {
                // Show only content marked as watched (>=90% progress)
                allContent = allContent.filter(item =>
                    watchedIds.includes(item._id?.toString()) || watchedIds.includes(item.id)
                );
            } else if (watchStatus === 'unwatched') {
                // Filter out BOTH watched content AND content in continue watching
                allContent = allContent.filter(item => {
                    const itemId = item._id?.toString() || item.id;
                    return !watchedIds.includes(itemId) && !continueWatchingIds.includes(itemId);
                });
            }

            // Apply sorting
            allContent.sort((a, b) => {
                switch (sort) {
                    case 'rating':
                        return (b.rating || 0) - (a.rating || 0);
                    case 'title':
                        return (a.title || '').localeCompare(b.title || '');
                    case 'recent':
                        return (b.year || 0) - (a.year || 0);
                    case 'popularity':
                    default:
                        return (b.popularity || 0) - (a.popularity || 0);
                }
            });

            // Apply pagination
            const totalCount = allContent.length;
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;
            const paginatedContent = allContent.slice(skip, skip + limitNum);

            // Mark which items are watched or in continue watching
            const contentWithStatus = paginatedContent.map(item => {
                const itemId = item._id?.toString() || item.id;
                return {
                    ...item,
                    watched: watchedIds.includes(itemId),
                    inContinueWatching: continueWatchingIds.includes(itemId)
                };
            });

            res.json({
                success: true,
                data: {
                    content: contentWithStatus,
                    pagination: {
                        currentPage: pageNum,
                        totalPages: Math.ceil(totalCount / limitNum),
                        totalItems: totalCount,
                        itemsPerPage: limitNum,
                        hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
                        hasPrevPage: pageNum > 1
                    },
                    filters: {
                        genre,
                        sort,
                        watchStatus
                    }
                }
            });

        } catch (error) {
            console.error('Error browsing genre:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to browse genre',
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

    // =============================================================================
    // ADMIN CONTENT MANAGEMENT
    // =============================================================================

    /**
     * Add new content (Admin only)
     * @route POST /api/content/admin/add
     */
    async addContent(req, res) {
        try {
            console.log('📤 POST /api/content/admin/add - Starting content upload');
            console.log('📊 Files uploaded:', req.files ? Object.keys(req.files) : 'none');

            const {
                title,
                description,
                category,
                year,
                genre,
                runtime,
                director,
                cast,
                section = 'movies'
            } = req.body;

            if (!title) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields',
                    message: 'Title is required'
                });
            }

            // Get file paths from multer upload
            const videoFilePath = req.files?.videoFile?.[0]?.path || null;
            const posterImagePath = req.files?.posterImage?.[0]?.path || null;
            const backdropImagePath = req.files?.backdropImage?.[0]?.path || null;

            // Log file info
            if (req.files?.videoFile?.[0]) {
                const videoFile = req.files.videoFile[0];
                console.log('🎥 Video uploaded:', videoFile.filename, '-', Math.round(videoFile.size / 1024 / 1024), 'MB');
            }
            if (req.files?.posterImage?.[0]) {
                const posterFile = req.files.posterImage[0];
                console.log('🖼️ Poster uploaded:', posterFile.filename);
            }
            if (req.files?.backdropImage?.[0]) {
                const backdropFile = req.files.backdropImage[0];
                console.log('🖼️ Backdrop uploaded:', backdropFile.filename);
            }

            // Create public URLs for the files
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const videoUrl = videoFilePath ? `${baseUrl}/uploads/videos/${req.files.videoFile[0].filename}` : null;
            const posterUrl = posterImagePath ? `${baseUrl}/uploads/images/${req.files.posterImage[0].filename}` : null;
            const backdropUrl = backdropImagePath ? `${baseUrl}/uploads/images/${req.files.backdropImage[0].filename}` : null;

            console.log('💾 Saving content metadata to MongoDB...');
            const newContent = await this.contentModel.createContent({
                title,
                description: description || 'A sample movie for testing purposes.',
                category: category || 'Movie',
                year: parseInt(year) || 2024,
                genre: genre || 'Action',
                runtime: runtime || '2h 15min',
                director: director || 'Unknown',
                cast: cast || 'Unknown',
                section: section || 'movies',
                image: posterUrl,
                backdrop: backdropUrl,
                videoFile: videoUrl,
                videoFilePath: videoFilePath,  // Store file path for server-side access
                posterImagePath: posterImagePath,
                backdropImagePath: backdropImagePath
            });

            console.log('✅ Content saved to MongoDB with ID:', newContent._id);
            res.status(201).json({
                success: true,
                message: 'Content added successfully',
                data: newContent
            });
        } catch (error) {
            console.error('❌ Error adding content:', error);
            console.error('Stack trace:', error.stack);
            res.status(500).json({
                success: false,
                error: 'Failed to add content',
                message: error.message
            });
        }
    }

    /**
     * Get external ratings for content
     * @route GET /api/content/admin/ratings/:title
     */
    async getExternalRatings(req, res) {
        try {
            const { title } = req.params;
            const { year } = req.query;

            if (!title) {
                return res.status(400).json({
                    success: false,
                    error: 'Title is required'
                });
            }

            const ratings = await this.fetchExternalRatings(title, year);
            
            res.json({
                success: true,
                data: ratings
            });
        } catch (error) {
            console.error('Error fetching external ratings:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch ratings',
                message: error.message
            });
        }
    }

    /**
     * Helper method to fetch external ratings
     */
    async fetchExternalRatings(title, year) {
        try {
            const axios = require('axios');
            const ratings = {
                imdb: null,
                rottenTomatoes: null
            };

            const searchQuery = encodeURIComponent(`${title} ${year || ''}`.trim());
            
            // Try OMDB API for IMDB ratings
            try {
                const omdbResponse = await axios.get(`https://www.omdbapi.com/?t=${searchQuery}&apikey=${process.env.OMDB_API_KEY}`);
                if (omdbResponse.data.Response === 'True') {
                    ratings.imdb = {
                        rating: omdbResponse.data.imdbRating,
                        votes: omdbResponse.data.imdbVotes,
                        id: omdbResponse.data.imdbID
                    };
                }
            } catch (omdbError) {
                console.log('OMDB API error:', omdbError.message);
            }

            // For Rotten Tomatoes, we'll use a mock response since their API requires special access
            ratings.rottenTomatoes = {
                rating: Math.floor(Math.random() * 30) + 70, // Mock rating 70-100
                reviews: Math.floor(Math.random() * 500) + 100 // Mock review count
            };

            return ratings;
        } catch (error) {
            console.error('Error fetching external ratings:', error);
            return {
                imdb: null,
                rottenTomatoes: null
            };
        }
    }

    /**
     * Get TV show season with episodes
     * @route GET /api/content/tv/:tvId/season/:seasonNumber
     */
    async getTVSeasons(req, res) {
        try {
            const { tvId, seasonNumber } = req.params;
            const axios = require('axios');

            console.log(`📺 GET /api/content/tv/${tvId}/season/${seasonNumber} - Fetching episodes from TMDB`);

            const response = await axios.get(
                `https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNumber}`,
                {
                    params: {
                        api_key: process.env.TMDB_API_KEY
                    }
                }
            );

            if (!response.data) {
                return res.status(404).json({
                    success: false,
                    error: 'Season not found'
                });
            }

            // Format episodes for frontend
            const episodes = response.data.episodes.map(ep => ({
                episodeNumber: ep.episode_number,
                seasonNumber: ep.season_number,
                title: `Episode ${ep.episode_number}: ${ep.name}`,
                description: ep.overview || 'No description available.',
                thumbnail: ep.still_path
                    ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
                    : null,
                duration: ep.runtime ? `${ep.runtime} min` : 'N/A',
                airDate: ep.air_date
            }));

            console.log(`✅ Found ${episodes.length} episodes for season ${seasonNumber}`);

            res.json({
                success: true,
                data: {
                    seasonNumber: response.data.season_number,
                    seasonName: response.data.name,
                    episodes: episodes,
                    totalEpisodes: episodes.length
                }
            });
        } catch (error) {
            console.error('Error fetching TV season:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch season episodes',
                message: error.message
            });
        }
    }
}

module.exports = ContentController;