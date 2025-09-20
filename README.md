# Netflix Clone - Backend Development Guide

## Server Information
- **Backend Server**: http://localhost:5000
- **API Base URL**: http://localhost:5000/api
- **Existing API**: http://localhost:5000/api/content (already working)

## MVC Architecture Pattern

Our backend follows the **MVC (Model-View-Controller)** pattern:

### 📁 **Model** (Data Layer)
- **Purpose**: Handle data operations (reading/writing files, data validation)
- **Location**: `backend/models/`
- **Responsibility**: Direct file system operations, data structure definitions
- **Example**: `User.js` reads/writes to `users.json`, validates user data

### 🎮 **Controller** (Business Logic Layer)
- **Purpose**: Process requests, implement business logic, handle errors
- **Location**: `backend/controllers/`
- **Responsibility**: HTTP request/response handling, calling models, error handling
- **Example**: `AuthController.js` handles login logic, calls User model, returns JSON responses

### 🛣️ **Routes** (URL Routing Layer)
- **Purpose**: Define API endpoints and delegate to controllers
- **Location**: `backend/routes/`
- **Responsibility**: URL mapping, middleware, route delegation
- **Example**: `AuthRoutes.js` defines `/register`, `/login` endpoints, calls AuthController methods

## Team Assignments

### 👨‍💻 **Alon - Authentication System** (`/api/auth`)
**Your mission**: Implement user registration, login, and authentication

**Model files** (already created for you):
- ✅ `backend/models/User.js` - Handle user data operations
- ✅ `backend/data/users.json` - User storage file

**You need to implement**:
- `backend/controllers/AuthController.js` - Authentication logic
- `backend/routes/AuthRoutes.js` - Auth API endpoints

**Required endpoints**:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

### 👨‍💻 **Yaron - Profile Management** (`/api/profiles`)
**Your mission**: Implement user profile management and preferences

**Model files** (already created for you):
- ✅ `backend/models/Profile.js` - Handle profile data operations

**You need to implement**:
- `backend/controllers/ProfileController.js` - Profile management logic
- `backend/routes/ProfileRoutes.js` - Profile API endpoints

**Required endpoints**:
- `GET /api/profiles` - Get all user profiles
- `POST /api/profiles` - Create new profile
- `GET /api/profiles/:id` - Get specific profile
- `PUT /api/profiles/:id` - Update profile
- `DELETE /api/profiles/:id` - Delete profile

**🔌 Frontend Integration (ALREADY EXISTS)**:
The frontend already uses these profile features:
- `profiles.html` - Shows profile selection page with hardcoded profiles
- `NetflixAPI.getCurrentProfileId()` - Gets current profile from localStorage
- Profile data stored as: `netflix:profileId` and `netflix:profileName` in localStorage
- Frontend expects profiles like: `paul`, `alon`, `ronni`, `anna`, `noa`

**📱 Current Frontend Profile Flow**:
1. User selects profile on `profiles.html` → calls `selectProfile(id, name)`
2. Profile ID/name saved to localStorage
3. Main app uses `localStorage.getItem('netflix:profileId')` everywhere
4. Your API should work with these existing profile IDs

## 📋 Implementation Guidelines

### 🔧 **For Controllers** (`AuthController.js`, `ProfileController.js`)
```javascript
// Structure your controllers like this:
class AuthController {
    static async register(req, res) {
        try {
            // 1. Extract data from req.body
            const { email, password, firstName, lastName } = req.body;

            // 2. Validate input data
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Email and password required'
                });
            }

            // 3. Call Model methods
            const user = await User.create({ email, password, firstName, lastName });

            // 4. Return standardized response
            res.status(201).json({
                success: true,
                data: { user }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}
```

### 🛣️ **For Routes** (`AuthRoutes.js`, `ProfileRoutes.js`)
```javascript
// Structure your routes like this:
const express = require('express');
const AuthController = require('../controllers/AuthController');
const router = express.Router();

// Define endpoints and delegate to controller methods
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/logout', AuthController.logout);
router.get('/me', AuthController.me);

module.exports = router;
```

### 📁 **Model Files Already Created**
The model files are already implemented and ready to use:
- `backend/models/User.js` - Contains methods like `User.create()`, `User.findByEmail()`, etc.
- `backend/models/Profile.js` - Contains methods like `Profile.create()`, `Profile.findById()`, etc.
- `backend/data/users.json` - Storage file for user data

## ✅ Testing Your Implementation

### Test Authentication (Alon):
```bash
# Register new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alon@test.com","password":"123","firstName":"Alon","lastName":"Dev"}'

# Login user
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alon@test.com","password":"123"}'
```

### Test Profiles (Yaron):
```bash
# Get all profiles (should return paul, alon, ronni, anna, noa)
curl -X GET http://localhost:5000/api/profiles

# Get specific profile
curl -X GET http://localhost:5000/api/profiles/paul

# Create new profile
curl -X POST http://localhost:5000/api/profiles \
  -H "Content-Type: application/json" \
  -d '{"id":"yaron","name":"Yaron","avatar":"https://i.pravatar.cc/150?img=12","preferences":{"language":"en"}}'

# Update profile
curl -X PUT http://localhost:5000/api/profiles/paul \
  -H "Content-Type: application/json" \
  -d '{"name":"Paul Updated","preferences":{"language":"he"}}'
```

**🔥 Important for Yaron**: Your profile API should return data compatible with the existing frontend:
```javascript
// Frontend expects this profile structure:
{
  "id": "paul",
  "name": "Paul",
  "avatar": "https://i.pravatar.cc/150?img=1",
  "preferences": {
    "language": "en"
  }
}
```

## 🚨 Important Rules
1. **Always use try-catch blocks** in controller methods
2. **Return standardized JSON**: `{ success: true/false, data: ..., error: ... }`
3. **Models handle file operations only** - don't put HTTP logic in models
4. **Controllers handle HTTP logic** - request/response, status codes, validation
5. **Routes just delegate** - keep them simple, just call controller methods
6. **Follow the existing pattern** - look at `ContentController.js` as reference

## ❌ Do NOT Touch
- `NetflixAPI` (frontend code)
- `Content.js`, `ContentController.js`, `ContentRoutes.js` (existing working code)
- `server.js` (main server file)
- Any existing functionality