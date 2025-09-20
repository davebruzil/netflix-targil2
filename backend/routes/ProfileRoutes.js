const express = require('express');
const ProfileController = require('../controllers/ProfileController');

const router = express.Router();
const profileController = new ProfileController();

// POST /api/profiles
router.post('/', (req, res) => profileController.createProfile(req, res));

// GET /api/profiles/user/:userId
router.get('/user/:userId', (req, res) => profileController.getUserProfiles(req, res));

// PUT /api/profiles/:id
router.put('/:id', (req, res) => profileController.updateProfile(req, res));

// DELETE /api/profiles/:id
router.delete('/:id', (req, res) => profileController.deleteProfile(req, res));

module.exports = router;