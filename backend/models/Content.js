// Content Model - MongoDB Implementation with Mongoose
const ContentSchema = require('../schemas/ContentSchema');
const ProfileInteractionSchema = require('../schemas/ProfileInteractionSchema');

class Content {
    constructor() {
        this.model = ContentSchema;
        this.interactionModel = ProfileInteractionSchema;
    }

    // Get all content data
    async getAllData() {
        try {
            const content = await this.model.find();
            const profiles = await this.interactionModel.find();
            
            // Organize content by sections
            const sections = {
                continue: content.filter(item => item.section === 'continue'),
                trending: content.filter(item => item.section === 'trending'),
                movies: content.filter(item => item.section === 'movies'),
                series: content.filter(item => item.section === 'series')
            };
            
            // Add metadata
            const metadata = {
                totalContent: content.length,
                totalMovies: sections.movies.length,
                totalSeries: sections.series.length,
                lastUpdated: new Date().toISOString()
            };
            
            return { content, sections, metadata };
        } catch (error) {
            console.error('Error reading content data:', error);
            throw new Error('Failed to load content data');
        }
    }

    // Get all content items
    async getAllContent() {
        try {
            const content = await this.model.find();
            return content;
        } catch (error) {
            console.error('Error getting all content:', error);
            throw error;
        }
    }

    // Get content organized by sections
    async getContentBySections() {
        try {
            const sections = {
                continue: await this.model.find({ section: 'continue' }),
                trending: await this.model.find({ section: 'trending' }),
                movies: await this.model.find({ section: 'movies' }),
                series: await this.model.find({ section: 'series' })
            };
            return sections;
        } catch (error) {
            console.error('Error getting content by sections:', error);
            throw error;
        }
    }

    // Get single content item by ID
    async getContentById(id) {
        try {
            const item = await this.model.findById(id);
            return item;
        } catch (error) {
            console.error('Error getting content by ID:', error);
            return null;
        }
    }

    // Search content by query
    async searchContent(query, limit = 20) {
        try {
            const searchTerm = query.toLowerCase().trim();

            const results = await this.model.find({
                $or: [
                    { title: { $regex: searchTerm, $options: 'i' } },
                    { description: { $regex: searchTerm, $options: 'i' } },
                    { genre: { $regex: searchTerm, $options: 'i' } },
                    { category: { $regex: searchTerm, $options: 'i' } }
                ]
            }).limit(parseInt(limit));

            return results;
        } catch (error) {
            console.error('Error searching content:', error);
            return [];
        }
    }

    // Toggle like status for content
    async toggleLike(contentId, profileId, liked) {
        try {
            // Find or create profile interaction
            let interaction = await this.interactionModel.findOne({ profileId });
            if (!interaction) {
                interaction = new this.interactionModel({
                    profileId,
                    likedContent: [],
                    watchProgress: new Map(),
                    searchHistory: [],
                    activityLog: []
                });
            }

            // Find content - handle both ObjectId and string IDs (like "movie_634649")
            let content;
            if (contentId.match(/^[0-9a-fA-F]{24}$/)) {
                // It's a MongoDB ObjectId
                content = await this.model.findById(contentId);
            } else {
                // It's a custom string ID - try to find or create it
                // For now, we'll store the interaction but skip updating content likes
                console.log(`⚠️ Content ID "${contentId}" is not a MongoDB ObjectId, storing in profile interaction only`);
            }

            // If content doesn't exist in DB, we still track the like in profile interaction
            if (!content) {
                console.log(`⚠️ Content not found in database: ${contentId}, tracking in profile only`);
            }

            // Update like status in profile interaction
            if (liked) {
                if (!interaction.likedContent.includes(contentId)) {
                    interaction.likedContent.push(contentId);
                    // Only update content likes if content exists in DB
                    if (content) {
                        content.likes += 1;
                    }
                }
            } else {
                const index = interaction.likedContent.indexOf(contentId);
                if (index > -1) {
                    interaction.likedContent.splice(index, 1);
                    // Only update content likes if content exists in DB
                    if (content) {
                        content.likes = Math.max(0, content.likes - 1);
                    }
                }
            }

            // Save interaction (always) and content (if exists)
            await interaction.save();
            if (content) {
                await content.save();
            }

            return {
                contentId,
                liked: interaction.likedContent.includes(contentId),
                totalLikes: content ? content.likes : 0
            };
        } catch (error) {
            console.error('Error toggling like:', error);
            throw error;
        }
    }

    // Get liked content for profile
    async getLikedContent(profileId) {
        try {
            const interaction = await this.interactionModel.findOne({ profileId });
            if (!interaction || !interaction.likedContent || interaction.likedContent.length === 0) {
                return [];
            }

            // Return array of objects with id field for frontend compatibility
            // This ensures the frontend can use likedItems.has(item.id)
            return interaction.likedContent.map(contentId => ({
                id: contentId.toString()
            }));
        } catch (error) {
            console.error('Error getting liked content:', error);
            return [];
        }
    }

    // Update watch progress
    async updateProgress(contentId, profileId, progress) {
        try {
            // Try to validate content exists if it's a MongoDB ID
            let content;
            if (contentId.match(/^[0-9a-fA-F]{24}$/)) {
                content = await this.model.findById(contentId);
            } else {
                // It's a custom string ID (like "movie_634649") - allow it
                console.log(`⚠️ Content ID "${contentId}" is not a MongoDB ObjectId, storing progress in profile only`);
            }

            // Find or create profile interaction
            let interaction = await this.interactionModel.findOne({ profileId });
            if (!interaction) {
                interaction = new this.interactionModel({
                    profileId,
                    likedContent: [],
                    myList: [],
                    watchProgress: new Map(),
                    searchHistory: [],
                    activityLog: []
                });
            }

            // Update progress
            const newProgress = Math.max(0, Math.min(100, progress));
            interaction.watchProgress.set(contentId.toString(), {
                progress: newProgress,
                lastWatched: new Date()
            });

            await interaction.save();

            return {
                contentId,
                progress: newProgress
            };
        } catch (error) {
            console.error('Error updating progress:', error);
            throw error;
        }
    }

    // Save data (for compatibility - not needed in MongoDB version)
    async saveData(data) {
        console.warn('saveData() is deprecated with MongoDB implementation');
        return true;
    }

    // =====================================================================
    // MY LIST FUNCTIONALITY (Dev #2 - Yaron)
    // =====================================================================

    /**
     * Toggle My List status for content
     * @param {string} contentId - Content ID
     * @param {string} profileId - Profile ID
     * @param {boolean} addToList - true to add, false to remove
     * @returns {object} Result with myList status
     */
    async toggleMyList(contentId, profileId, addToList) {
        try {
            // Find or create profile interaction
            let interaction = await this.interactionModel.findOne({ profileId });
            if (!interaction) {
                interaction = new this.interactionModel({
                    profileId,
                    likedContent: [],
                    myList: [],
                    watchProgress: new Map(),
                    searchHistory: [],
                    activityLog: []
                });
            }

            // Find content - handle both ObjectId and string IDs (like "movie_634649")
            let content;
            if (contentId.match(/^[0-9a-fA-F]{24}$/)) {
                // It's a MongoDB ObjectId
                content = await this.model.findById(contentId);
            } else {
                // It's a custom string ID - store in profile interaction only
                console.log(`⚠️ Content ID "${contentId}" is not a MongoDB ObjectId, storing in profile interaction only`);
            }

            // If content doesn't exist in DB, we still track it in profile interaction
            if (!content && contentId.match(/^[0-9a-fA-F]{24}$/)) {
                console.log(`⚠️ Content not found in database: ${contentId}, tracking in profile only`);
            }

            // Update My List status
            if (addToList) {
                if (!interaction.myList.includes(contentId)) {
                    interaction.myList.push(contentId);
                }
            } else {
                const index = interaction.myList.indexOf(contentId);
                if (index > -1) {
                    interaction.myList.splice(index, 1);
                }
            }

            await interaction.save();

            return {
                contentId,
                inMyList: interaction.myList.includes(contentId),
                myListCount: interaction.myList.length
            };
        } catch (error) {
            console.error('Error toggling My List:', error);
            throw error;
        }
    }

    /**
     * Get all content in profile's My List
     * @param {string} profileId - Profile ID
     * @returns {array} Array of content items
     */
    async getMyList(profileId) {
        try {
            const interaction = await this.interactionModel.findOne({ profileId });
            if (!interaction || !interaction.myList.length) {
                return [];
            }

            // Populate My List with full content details
            const myListContent = await this.model.find({
                _id: { $in: interaction.myList }
            });

            return myListContent;
        } catch (error) {
            console.error('Error getting My List:', error);
            return [];
        }
    }

    /**
     * Create new content item
     * @param {object} contentData - Content data
     * @returns {object} Created content item
     */
    async createContent(contentData) {
        try {
            const newContent = new this.model(contentData);
            await newContent.save();
            return newContent;
        } catch (error) {
            console.error('Error creating content:', error);
            throw error;
        }
    }
}

module.exports = Content;
