// Content Routes - Routing Layer (MVC)
const express = require('express');
const ContentController = require('../controllers/ContentController');

const router = express.Router();
const contentController = new ContentController();

// GET /api/content - Fetch all content catalog
router.get('/', (req, res) => contentController.getAllContent(req, res));

// GET /api/content/sections - Fetch content organized by sections
router.get('/sections', (req, res) => contentController.getContentBySections(req, res));

// GET /api/content/search - Search content with history tracking
router.get('/search', (req, res) => contentController.searchContent(req, res));

// GET /api/content/:id - Fetch specific content item
router.get('/:id', (req, res) => contentController.getContentById(req, res));

// POST /api/content/:id/like - Toggle like status for content
router.post('/:id/like', (req, res) => contentController.toggleLike(req, res));

// GET /api/content/profile/:profileId/likes - Get liked content for profile
router.get('/profile/:profileId/likes', (req, res) => contentController.getLikedContent(req, res));

// POST /api/content/:id/progress - Update watch progress
router.post('/:id/progress', (req, res) => contentController.updateProgress(req, res));

module.exports = router;