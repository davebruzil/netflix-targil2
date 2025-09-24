const express = require('express');
const ProfileController = require('../controllers/ProfileController');

const router = express.Router();
const profileController = new ProfileController();

// GET /api/profiles - Get all profiles
router.get('/', (req, res) => profileController.getAllProfiles(req, res));

// POST /api/profiles - Create new profile
router.post('/', (req, res) => profileController.createProfile(req, res));

// GET /api/profiles/user/:userId - Get profiles for specific user (compatibility route)
// This MUST come before /:id to avoid route conflicts
router.get('/user/:userId', (req, res) => profileController.getUserProfiles(req, res));

// GET /api/profiles/:id - Get specific profile by ID
router.get('/:id', (req, res) => profileController.getProfileById(req, res));

// PUT /api/profiles/:id - Update profile
router.put('/:id', (req, res) => profileController.updateProfile(req, res));

// DELETE /api/profiles/:id - Delete profile
router.delete('/:id', (req, res) => profileController.deleteProfile(req, res));

module.exports = router;