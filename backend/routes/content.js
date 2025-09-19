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

// GET /api/content/search - Search content
router.get('/search', async (req, res) => {
    try {
        const { q: query, limit = 20 } = req.query;

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
});

// POST /api/content/:id/like - Toggle like status for content
router.post('/:id/like', async (req, res) => {
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
                watchProgress: {}
            };
        }

        const profile = contentData.profiles[profileId];
        const contentItem = contentData.content[contentIndex];

        // Toggle like status
        if (liked) {
            // Add to liked content if not already there
            if (!profile.likedContent.includes(id)) {
                profile.likedContent.push(id);
                contentItem.likes += 1;
            }
        } else {
            // Remove from liked content
            const likedIndex = profile.likedContent.indexOf(id);
            if (likedIndex > -1) {
                profile.likedContent.splice(likedIndex, 1);
                contentItem.likes = Math.max(0, contentItem.likes - 1);
            }
        }

        // Save updated data
        await writeContentData(contentData);

        res.json({
            success: true,
            data: {
                contentId: id,
                liked: profile.likedContent.includes(id),
                totalLikes: contentItem.likes
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
                watchProgress: {}
            };
        }

        // Update progress
        contentData.profiles[profileId].watchProgress[id] = Math.max(0, Math.min(100, progress));

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

module.exports = router;