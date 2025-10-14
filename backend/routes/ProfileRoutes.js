const express = require('express');
const ProfileController = require('../controllers/ProfileController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const profileController = new ProfileController();

// Apply auth middleware to all profile routes
router.use(requireAuth);

// GET /api/profiles - Get all profiles
router.get('/', (req, res) => profileController.getAllProfiles(req, res));

// POST /api/profiles - Create new profile
router.post('/', (req, res) => profileController.createProfile(req, res));

// GET /api/profiles/user/:userId - Get profiles for specific user (compatibility route)
// This MUST come before /:id to avoid route conflicts
router.get('/user/:userId', (req, res) => profileController.getUserProfiles(req, res));

// GET /api/profiles/statistics/:userId - Get statistics for user's profiles
router.get('/statistics/:userId', (req, res) => profileController.getStatistics(req, res));

// GET /api/profiles/:id - Get specific profile by ID
router.get('/:id', (req, res) => profileController.getProfileById(req, res));

// PUT /api/profiles/:id - Update profile
router.put('/:id', (req, res) => profileController.updateProfile(req, res));

// DELETE /api/profiles/:id - Delete profile
router.delete('/:id', (req, res) => profileController.deleteProfile(req, res));

module.exports = router;