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

            // Find content
            const content = await this.model.findById(contentId);
            if (!content) {
                throw new Error('Content not found');
            }

            // Update like status
            if (liked) {
                if (!interaction.likedContent.includes(contentId)) {
                    interaction.likedContent.push(contentId);
                    content.likes += 1;
                }
            } else {
                const index = interaction.likedContent.indexOf(contentId);
                if (index > -1) {
                    interaction.likedContent.splice(index, 1);
                    content.likes = Math.max(0, content.likes - 1);
                }
            }

            // Save both
            await interaction.save();
            await content.save();

            return {
                contentId,
                liked: interaction.likedContent.includes(contentId),
                totalLikes: content.likes
            };
        } catch (error) {
            console.error('Error toggling like:', error);
            throw error;
        }
    }

    // Get liked content for profile
    async getLikedContent(profileId) {
        try {
            const interaction = await this.interactionModel.findOne({ profileId }).populate('likedContent');
            if (!interaction) {
                return [];
            }
            return interaction.likedContent;
        } catch (error) {
            console.error('Error getting liked content:', error);
            return [];
        }
    }

    // Update watch progress
    async updateProgress(contentId, profileId, progress) {
        try {
            // Validate content exists
            const content = await this.model.findById(contentId);
            if (!content) {
                throw new Error('Content not found');
            }

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

            // Update progress
            const newProgress = Math.max(0, Math.min(100, progress));
            interaction.watchProgress.set(contentId.toString(), newProgress);

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

            // Find content to verify it exists
            const content = await this.model.findById(contentId);
            if (!content) {
                throw new Error('Content not found');
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
}

module.exports = Content;
