// Content Routes - Routing Layer (MVC)
const express = require('express');
const ContentController = require('../controllers/ContentController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { contentUpload, handleUploadError } = require('../middleware/upload');

const router = express.Router();
const contentController = new ContentController();

// Apply auth middleware to all content routes
router.use(requireAuth);

// GET /api/content - Fetch all content catalog
router.get('/', (req, res) => contentController.getAllContent(req, res));

// GET /api/content/sections - Fetch content organized by sections
router.get('/sections', (req, res) => contentController.getContentBySections(req, res));

// GET /api/content/search - Search content with history tracking
router.get('/search', (req, res) => contentController.searchContent(req, res));

// =============================================================================
// DEV #3 (ALON) - RECOMMENDATION & ADVANCED SEARCH ROUTES
// =============================================================================
// NOTE: These specific routes MUST come before the generic /:id route
// to prevent Express from matching them as IDs

// GET /api/content/trending - Get trending/popular content
router.get('/trending', (req, res) => contentController.getTrending(req, res));

// GET /api/content/browse/genre/:genre - Browse genre with pagination, sorting, filtering
router.get('/browse/genre/:genre', (req, res) => contentController.browseGenre(req, res));

// GET /api/content/recommendations/:profileId - Get personalized recommendations
router.get('/recommendations/:profileId', (req, res) => contentController.getRecommendations(req, res));

// GET /api/content/profile/:profileId/likes - Get liked content for profile
router.get('/profile/:profileId/likes', (req, res) => contentController.getLikedContent(req, res));

// GET /api/content/profile/:profileId/mylist - Get My List for profile
router.get('/profile/:profileId/mylist', (req, res) => contentController.getMyList(req, res));

// GET /api/content/profile/:profileId/search-history - Get search history for profile
router.get('/profile/:profileId/search-history', (req, res) => contentController.getSearchHistory(req, res));

// GET /api/content/:id/related - Get related/similar content
router.get('/:id/related', (req, res) => contentController.getRelatedContent(req, res));

// GET /api/content/tv/:tvId/season/:seasonNumber - Get TV show episodes
router.get('/tv/:tvId/season/:seasonNumber', (req, res) => contentController.getTVSeasons(req, res));

// =============================================================================
// GENERIC ROUTES WITH WILDCARDS - MUST BE LAST
// =============================================================================

// GET /api/content/:id - Fetch specific content item
router.get('/:id', (req, res) => contentController.getContentById(req, res));

// POST /api/content/:id/like - Toggle like status for content
router.post('/:id/like', (req, res) => contentController.toggleLike(req, res));

// POST /api/content/:id/progress - Update watch progress
router.post('/:id/progress', (req, res) => contentController.updateProgress(req, res));

// POST /api/content/:id/mylist - Toggle My List status
router.post('/:id/mylist', (req, res) => contentController.toggleMyList(req, res));

// =============================================================================
// DYNAMIC CONTENT SECTIONS ROUTES
// =============================================================================

// GET /api/content/sections/trending - Get trending content
router.get('/sections/trending', (req, res) => contentController.getTrendingContent(req, res));

// GET /api/content/sections/new-releases - Get new releases
router.get('/sections/new-releases', (req, res) => contentController.getNewReleases(req, res));

// GET /api/content/sections/top-rated - Get top rated content
router.get('/sections/top-rated', (req, res) => contentController.getTopRated(req, res));

// GET /api/content/sections/genre/:genre - Get content by genre
router.get('/sections/genre/:genre', (req, res) => contentController.getContentByGenre(req, res));

// GET /api/content/sections/continue-watching/:profileId - Get continue watching
router.get('/sections/continue-watching/:profileId', (req, res) => contentController.getContinueWatching(req, res));

// GET /api/content/sections/genres - Get all available genres
router.get('/sections/genres', (req, res) => contentController.getAvailableGenres(req, res));

// =============================================================================
// ADMIN ROUTES (Require Admin Authentication)
// =============================================================================

// POST /api/content/admin/add - Add new content (Admin only)
router.post('/admin/add', contentUpload, handleUploadError, (req, res) => contentController.addContent(req, res));

// GET /api/content/admin/ratings/:title - Get external ratings (Admin only)
router.get('/admin/ratings/:title', (req, res) => contentController.getExternalRatings(req, res));

module.exports = router;