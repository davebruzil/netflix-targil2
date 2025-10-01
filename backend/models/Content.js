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
            return { content, profiles };
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
}

module.exports = Content;
