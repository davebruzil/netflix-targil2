// Content API Routes
// Handles all content-related endpoints for the Netflix clone

const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// Path to content data file
const CONTENT_FILE = path.join(__dirname, '..', 'data', 'content.json');

// Helper function to read content data
async function readContentData() {
    try {
        const data = await fs.readFile(CONTENT_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading content data:', error);
        throw new Error('Failed to load content data');
    }
}

// Helper function to write content data
async function writeContentData(data) {
    try {
        await fs.writeFile(CONTENT_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing content data:', error);
        throw new Error('Failed to save content data');
    }
}

// GET /api/content - Fetch all content catalog
router.get('/', async (req, res) => {
    console.log('📥 GET /api/content - Fetching all content catalog');
    try {
        const contentData = await readContentData();

        res.json({
            success: true,
            data: {
                content: contentData.content,
                sections: contentData.sections,
                metadata: contentData.metadata
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch content catalog',
            message: error.message
        });
    }
});

// GET /api/content/sections - Fetch content organized by sections
router.get('/sections', async (req, res) => {
    try {
        const contentData = await readContentData();
        const { sections, content } = contentData;

        // Organize content by sections
        const organizedContent = {};

        for (const [sectionName, contentIds] of Object.entries(sections)) {
            organizedContent[sectionName] = contentIds.map(id =>
                content.find(item => item.id === id)
            ).filter(Boolean); // Remove any null/undefined items
        }

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
});

// GET /api/content/search - Search content with history tracking
router.get('/search', async (req, res) => {
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

        const contentData = await readContentData();
        const searchTerm = query.toLowerCase().trim();

        // Search through content
        const results = contentData.content.filter(item => {
            const titleMatch = item.title.toLowerCase().includes(searchTerm);
            const descriptionMatch = item.description.toLowerCase().includes(searchTerm);
            const genreMatch = item.genre.toLowerCase().includes(searchTerm);
            const categoryMatch = item.category.toLowerCase().includes(searchTerm);

            return titleMatch || descriptionMatch || genreMatch || categoryMatch;
        }).slice(0, parseInt(limit));

        // Track search history if profileId provided
        if (profileId && results.length > 0) {
            console.log(`📝 Tracking search history for profile: ${profileId}, Query: "${searchTerm}", Results: ${results.length}`);

            if (!contentData.profiles[profileId]) {
                contentData.profiles[profileId] = {
                    likedContent: [],
                    watchProgress: {},
                    searchHistory: [],
                    activityLog: []
                };
            }

            // Add to search history (keep last 50 searches)
            const profile = contentData.profiles[profileId];
            profile.searchHistory.unshift({
                query: searchTerm,
                resultsCount: results.length,
                timestamp: new Date().toISOString()
            });
            profile.searchHistory = profile.searchHistory.slice(0, 50);

            // Add to activity log
            profile.activityLog.unshift({
                action: 'search',
                query: searchTerm,
                resultsCount: results.length,
                timestamp: new Date().toISOString()
            });
            profile.activityLog = profile.activityLog.slice(0, 100);

            await writeContentData(contentData);
            console.log(`✅ Search history saved for profile: ${profileId}`);
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
});

// GET /api/content/:id - Fetch specific content item
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const contentData = await readContentData();

        const item = contentData.content.find(content => content.id === id);

        if (!item) {
            return res.status(404).json({
                success: false,
                error: 'Content not found',
                message: `No content found with ID: ${id}`
            });
        }

        // Add like count from contentLikes
        const itemWithLikes = {
            ...item,
            likes: contentData.contentLikes?.[id] || 0
        };

        res.json({
            success: true,
            data: itemWithLikes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch content item',
            message: error.message
        });
    }
});

// POST /api/content/:id/like - Toggle like status for content
router.post('/:id/like', async (req, res) => {
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

        const contentData = await readContentData();

        // Find the content item
        const contentIndex = contentData.content.findIndex(item => item.id === id);
        if (contentIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Content not found'
            });
        }

        // Initialize profiles object if it doesn't exist
        if (!contentData.profiles) {
            contentData.profiles = {};
        }

        // Initialize profile if it doesn't exist
        if (!contentData.profiles[profileId]) {
            contentData.profiles[profileId] = {
                likedContent: [],
                watchProgress: {},
                searchHistory: [],
                activityLog: []
            };
        }

        const profile = contentData.profiles[profileId];
        const contentItem = contentData.content[contentIndex];

        // Initialize contentLikes if it doesn't exist
        if (!contentData.contentLikes) {
            contentData.contentLikes = {};
        }
        if (!contentData.contentLikes[id]) {
            contentData.contentLikes[id] = 0;
        }

        // Toggle like status
        if (liked) {
            // Add to liked content if not already there
            if (!profile.likedContent.includes(id)) {
                profile.likedContent.push(id);
                contentData.contentLikes[id] += 1;

                // Log activity
                profile.activityLog.unshift({
                    action: 'like',
                    contentId: id,
                    contentTitle: contentItem.title,
                    timestamp: new Date().toISOString()
                });
                profile.activityLog = profile.activityLog.slice(0, 100);
                console.log(`✅ Like activity logged for profile: ${profileId}, Content: ${contentItem.title}`);
            }
        } else {
            // Remove from liked content
            const likedIndex = profile.likedContent.indexOf(id);
            if (likedIndex > -1) {
                profile.likedContent.splice(likedIndex, 1);
                contentData.contentLikes[id] = Math.max(0, contentData.contentLikes[id] - 1);

                // Log activity
                profile.activityLog.unshift({
                    action: 'unlike',
                    contentId: id,
                    contentTitle: contentItem.title,
                    timestamp: new Date().toISOString()
                });
                profile.activityLog = profile.activityLog.slice(0, 100);
                console.log(`✅ Unlike activity logged for profile: ${profileId}, Content: ${contentItem.title}`);
            }
        }

        // Save updated data
        await writeContentData(contentData);

        res.json({
            success: true,
            data: {
                contentId: id,
                liked: profile.likedContent.includes(id),
                totalLikes: contentData.contentLikes[id]
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to update like status',
            message: error.message
        });
    }
});

// GET /api/content/profile/:profileId/likes - Get liked content for profile
router.get('/profile/:profileId/likes', async (req, res) => {
    try {
        const { profileId } = req.params;
        const contentData = await readContentData();

        const profile = contentData.profiles?.[profileId];
        if (!profile) {
            return res.json({
                success: true,
                data: []
            });
        }

        // Get full content data for liked items
        const likedContent = profile.likedContent.map(id =>
            contentData.content.find(item => item.id === id)
        ).filter(Boolean);

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
});

// POST /api/content/:id/progress - Update watch progress
router.post('/:id/progress', async (req, res) => {
    try {
        const { id } = req.params;
        const { profileId, progress } = req.body;

        if (!profileId || progress === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Profile ID and progress are required'
            });
        }

        const contentData = await readContentData();

        // Validate content exists
        const contentExists = contentData.content.some(item => item.id === id);
        if (!contentExists) {
            return res.status(404).json({
                success: false,
                error: 'Content not found'
            });
        }

        // Initialize profile data if needed
        if (!contentData.profiles) {
            contentData.profiles = {};
        }

        if (!contentData.profiles[profileId]) {
            contentData.profiles[profileId] = {
                likedContent: [],
                watchProgress: {},
                searchHistory: [],
                activityLog: []
            };
        }

        // Update progress
        const newProgress = Math.max(0, Math.min(100, progress));
        const oldProgress = contentData.profiles[profileId].watchProgress[id] || 0;
        contentData.profiles[profileId].watchProgress[id] = newProgress;

        // Log activity
        const contentItem = contentData.content.find(item => item.id === id);
        if (contentItem) {
            contentData.profiles[profileId].activityLog.unshift({
                action: 'watch_progress',
                contentId: id,
                contentTitle: contentItem.title,
                progress: newProgress,
                previousProgress: oldProgress,
                timestamp: new Date().toISOString()
            });
            contentData.profiles[profileId].activityLog = contentData.profiles[profileId].activityLog.slice(0, 100);
        }

        // Save updated data
        await writeContentData(contentData);

        res.json({
            success: true,
            data: {
                contentId: id,
                progress: contentData.profiles[profileId].watchProgress[id]
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to update progress',
            message: error.message
        });
    }
});

// GET /api/content/profile/:profileId/search-history - Get search history for profile
router.get('/profile/:profileId/search-history', async (req, res) => {
    try {
        const { profileId } = req.params;
        const { limit = 20 } = req.query;
        const contentData = await readContentData();

        const profile = contentData.profiles?.[profileId];
        if (!profile) {
            return res.json({
                success: true,
                data: []
            });
        }

        const searchHistory = profile.searchHistory?.slice(0, parseInt(limit)) || [];

        res.json({
            success: true,
            data: searchHistory
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch search history',
            message: error.message
        });
    }
});

// GET /api/content/profile/:profileId/activity - Get activity log for profile
router.get('/profile/:profileId/activity', async (req, res) => {
    try {
        const { profileId } = req.params;
        const { limit = 50 } = req.query;
        const contentData = await readContentData();

        const profile = contentData.profiles?.[profileId];
        if (!profile) {
            return res.json({
                success: true,
                data: []
            });
        }

        const activityLog = profile.activityLog?.slice(0, parseInt(limit)) || [];

        res.json({
            success: true,
            data: activityLog
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch activity log',
            message: error.message
        });
    }
});

module.exports = router;