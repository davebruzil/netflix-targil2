# Netflix Clone - Backend MVC Development Guide

> **Copy-paste instructions for AI development**

## 🚀 SERVER INFO:
- **Backend Server**: http://localhost:5000
- **API Base URL**: http://localhost:5000/api
- **Existing API**: http://localhost:5000/api/content (already working)
- **Your New APIs**:
  - http://localhost:5000/api/auth (Dev 1)
  - http://localhost:5000/api/profiles (Dev 2)

## DEVELOPER 1 TASK: Registration & Authentication

**COPY THIS TO AI:**

Create complete registration and login system using MVC pattern. Follow the existing Content.js example exactly.

### 1. Create models/User.js
```javascript
const fs = require('fs').promises;
const path = require('path');

class User {
    constructor() {
        this.dataFile = path.join(__dirname, '..', 'data', 'users.json');
    }

    async getAllUsers() {
        // Read users.json file, return parsed JSON
    }

    async saveUsers(users) {
        // Save users array to users.json file
    }

    async createUser(userData) {
        // Add new user to users array, save file
        // userData: {email, password, firstName, lastName}
    }

    async getUserByEmail(email) {
        // Find user by email, return user or null
    }

    async validatePassword(email, password) {
        // Check if email and password match, return true/false
    }
}

module.exports = User;
```

### 2. Create controllers/AuthController.js
```javascript
const User = require('../models/User');

class AuthController {
    constructor() {
        this.userModel = new User();
    }

    async register(req, res) {
        // Handle POST /api/auth/register
        // Validate email, password, firstName, lastName
        // Check if email already exists
        // Create new user
        // Return success response
    }

    async login(req, res) {
        // Handle POST /api/auth/login
        // Validate email, password
        // Check credentials with userModel.validatePassword
        // Return success/error response
    }
}

module.exports = AuthController;
```

### 3. Create routes/AuthRoutes.js
```javascript
const express = require('express');
const AuthController = require('../controllers/AuthController');

const router = express.Router();
const authController = new AuthController();

router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));

module.exports = router;
```

### 4. Create data/users.json
```json
{
  "users": []
}
```

### 5. Update server.js
Add this line:
```javascript
const authRoutes = require('./routes/AuthRoutes');
app.use('/api/auth', authRoutes);
```

---

## DEVELOPER 2 TASK: Profile Management

**COPY THIS TO AI:**

Create profile management system using MVC pattern. Follow the existing Content.js example exactly.

### 1. Create models/Profile.js
```javascript
const fs = require('fs').promises;
const path = require('path');

class Profile {
    constructor() {
        this.dataFile = path.join(__dirname, '..', 'data', 'content.json');
    }

    async getAllData() {
        // Read content.json file (profiles are stored here)
    }

    async saveData(data) {
        // Save data to content.json file
    }

    async createProfile(userId, profileData) {
        // Add new profile to user's profiles array
        // profileData: {name, avatar, preferences}
    }

    async getProfilesByUser(userId) {
        // Get all profiles for specific user
    }

    async updateProfile(profileId, updates) {
        // Update existing profile
    }

    async deleteProfile(profileId) {
        // Remove profile from user
    }
}

module.exports = Profile;
```

### 2. Create controllers/ProfileController.js
```javascript
const Profile = require('../models/Profile');

class ProfileController {
    constructor() {
        this.profileModel = new Profile();
    }

    async createProfile(req, res) {
        // Handle POST /api/profiles
        // Validate userId, name
        // Create new profile
        // Return success response
    }

    async getUserProfiles(req, res) {
        // Handle GET /api/profiles/user/:userId
        // Get all profiles for user
        // Return profiles array
    }

    async updateProfile(req, res) {
        // Handle PUT /api/profiles/:id
        // Update profile
        // Return success response
    }

    async deleteProfile(req, res) {
        // Handle DELETE /api/profiles/:id
        // Delete profile
        // Return success response
    }
}

module.exports = ProfileController;
```

### 3. Create routes/ProfileRoutes.js
```javascript
const express = require('express');
const ProfileController = require('../controllers/ProfileController');

const router = express.Router();
const profileController = new ProfileController();

router.post('/', (req, res) => profileController.createProfile(req, res));
router.get('/user/:userId', (req, res) => profileController.getUserProfiles(req, res));
router.put('/:id', (req, res) => profileController.updateProfile(req, res));
router.delete('/:id', (req, res) => profileController.deleteProfile(req, res));

module.exports = router;
```

### 4. Update server.js
Add this line:
```javascript
const profileRoutes = require('./routes/ProfileRoutes');
app.use('/api/profiles', profileRoutes);
```

---

## IMPORTANT RULES:

1. **COPY Content.js pattern exactly** - same file structure, same async/await pattern
2. **Always use try-catch in controllers**
3. **Always return JSON responses: `{ success: true, data: ... }`**
4. **Models do file operations only, Controllers handle HTTP logic**
5. **Routes just delegate to controllers**
6. **Test with: `curl -X POST http://localhost:5000/api/auth/register -d '{"email":"test@test.com","password":"123","firstName":"John","lastName":"Doe"}' -H "Content-Type: application/json"`**

## DON'T TOUCH:
- NetflixAPI (frontend)
- Content.js, ContentController.js, ContentRoutes.js
- Any existing functionality

THAT'S IT. COPY PASTE AND BUILD.