# 🎬 Netflix Clone - Development Tasks

## 👥 Team Assignments

### 👨‍💻 Developer #1: David - Authentication & Security

#### ✅ Already Implemented:
- Basic user registration (without bcrypt - **needs fixing**)
- Basic user login (plain text password comparison - **insecure**)
- User logout functionality
- User model with CRUD operations
- Auth routes and controller
- Basic email/password validation

#### 🔨 Your Priority Tasks:

**1. Password Encryption with bcrypt (CRITICAL - DO THIS FIRST)**
- [ ] Install bcrypt: `npm install bcrypt`
- [ ] Update `User.js` → `createUser()` to hash passwords before saving
- [ ] Update `User.js` → `validatePassword()` to use `bcrypt.compare()`
- [ ] Test registration and login with encrypted passwords

**Implementation:**
```javascript
// In backend/models/User.js
const bcrypt = require('bcrypt');

async createUser(userData) {
    // Hash password with salt rounds = 10
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const newUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: userData.email,
        password: hashedPassword,  // Store hashed password
        firstName: userData.firstName,
        lastName: userData.lastName,
        createdAt: new Date().toISOString()
    };

    usersData.users.push(newUser);
    await this.saveUsers(usersData);

    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
}

async validatePassword(email, password) {
    const user = await this.getUserByEmail(email);
    if (!user) return false;

    // Compare plain text password with hashed password
    return await bcrypt.compare(password, user.password);
}
```

**2. Enhanced Password Validation**
- [ ] Add strong password validation in `AuthController.js`
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character
- [ ] Return helpful error messages for weak passwords

**Password validation regex:**
```javascript
// In backend/controllers/AuthController.js
async register(req, res) {
    const { password } = req.body;

    // Strong password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            success: false,
            error: 'Weak password',
            message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
        });
    }

    // ... rest of registration
}
```

**3. Session Management with express-session**
- [ ] Install express-session: `npm install express-session`
- [ ] Configure session middleware in `server.js`
- [ ] Save user session on successful login
- [ ] Create secure session cookies
- [ ] Implement session timeout (24 hours)

**Session setup:**
```javascript
// In backend/server.js
const session = require('express-session');

app.use(session({
    secret: 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,  // Set to true if using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000  // 24 hours
    }
}));
```

**Update AuthController login:**
```javascript
async login(req, res) {
    // ... validate credentials ...

    // Create session
    req.session.userId = user.id;
    req.session.email = user.email;

    res.json({
        success: true,
        message: 'Login successful',
        data: { user: userWithoutPassword }
    });
}
```

**4. Logging System**
- [ ] Create `backend/middleware/logger.js` for automatic request logging
- [ ] Log all API requests (method, endpoint, timestamp, user, IP)
- [ ] Log authentication events in `content.json` → `activityLog`
- [ ] Log login attempts (success and failure)
- [ ] Log registration events
- [ ] Apply logging middleware to all routes

**Logger middleware:**
```javascript
// backend/middleware/logger.js
const fs = require('fs').promises;
const path = require('path');

async function requestLogger(req, res, next) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        method: req.method,
        endpoint: req.path,
        ip: req.ip || req.connection.remoteAddress,
        userId: req.session?.userId || 'anonymous'
    };

    console.log('📝 API Request:', logEntry);

    // Save to content.json activityLog
    try {
        const contentPath = path.join(__dirname, '..', 'data', 'content.json');
        const data = JSON.parse(await fs.readFile(contentPath, 'utf8'));

        if (!data.apiLogs) data.apiLogs = [];
        data.apiLogs.push(logEntry);

        // Keep only last 1000 logs
        if (data.apiLogs.length > 1000) {
            data.apiLogs = data.apiLogs.slice(-1000);
        }

        await fs.writeFile(contentPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Logging error:', error);
    }

    next();
}

module.exports = requestLogger;
```

**Apply in server.js:**
```javascript
const requestLogger = require('./middleware/logger');
app.use(requestLogger);
```

**5. Protected Routes Middleware**
- [ ] Create `backend/middleware/auth.js` authentication middleware
- [ ] Check if user session exists
- [ ] Return 401 if not authenticated
- [ ] Apply to protected routes (profiles, content)

**Auth middleware:**
```javascript
// backend/middleware/auth.js
function requireAuth(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required',
            message: 'Please log in to access this resource'
        });
    }
    next();
}

module.exports = requireAuth;
```

**Apply to routes:**
```javascript
// backend/routes/ProfileRoutes.js
const requireAuth = require('../middleware/auth');

router.get('/', requireAuth, (req, res) => profileController.getAllProfiles(req, res));
router.post('/', requireAuth, (req, res) => profileController.createProfile(req, res));
```

**6. Enhanced Logout**
- [ ] Clear session on server side
- [ ] Return confirmation message
- [ ] Frontend should clear localStorage

**Logout implementation:**
```javascript
// In backend/controllers/AuthController.js
async logout(req, res) {
    try {
        if (req.session) {
            req.session.destroy((err) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        error: 'Logout failed'
                    });
                }

                res.clearCookie('connect.sid');  // Clear session cookie
                res.json({
                    success: true,
                    message: 'Logged out successfully'
                });
            });
        } else {
            res.json({
                success: true,
                message: 'No active session'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Logout failed'
        });
    }
}
```

**7. Rate Limiting for Login Attempts**
- [ ] Install express-rate-limit: `npm install express-rate-limit`
- [ ] Limit login attempts to 5 per 15 minutes
- [ ] Return helpful error message when rate limited

**Rate limiting:**
```javascript
// In backend/routes/AuthRoutes.js
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 5,  // 5 attempts
    message: {
        success: false,
        error: 'Too many login attempts',
        message: 'Please try again after 15 minutes'
    }
});

router.post('/login', loginLimiter, (req, res) => authController.login(req, res));
```

**Files to create/modify:**
- `backend/models/User.js` (add bcrypt)
- `backend/controllers/AuthController.js` (password validation, session)
- `backend/middleware/logger.js` (create new)
- `backend/middleware/auth.js` (create new)
- `backend/server.js` (add express-session)
- `backend/routes/AuthRoutes.js` (add rate limiting)
- `backend/routes/ProfileRoutes.js` (add auth middleware)
- `backend/routes/ContentRoutes.js` (add auth middleware)

---

### 👨‍💻 Developer #2: Yaron - Profile & Content Management

#### ✅ Already Implemented:
- Profile model with full CRUD
- Profile controller and routes
- Profile creation, update, delete APIs
- Frontend profile selection UI
- Profile avatar system
- Content model with like/progress tracking

#### 🔨 Your Tasks:

**1. Profile Limit Enforcement (5 per user)**
- [ ] Add validation in `ProfileController.createProfile()`
- [ ] Check user's profile count before creating
- [ ] Return error if user already has 5 profiles
- [ ] Create endpoint: `GET /api/profiles/user/:userId/count`

**Implementation:**
```javascript
// In backend/controllers/ProfileController.js
async createProfile(req, res) {
    try {
        const { userId, name, avatar, isChild } = req.body;

        // Check profile count
        const userProfiles = await this.profileModel.getProfilesByUserId(userId);

        if (userProfiles.length >= 5) {
            return res.status(400).json({
                success: false,
                error: 'Profile limit reached',
                message: 'Maximum 5 profiles allowed per user'
            });
        }

        // Create profile...
    }
}

// Add profile count endpoint
async getUserProfileCount(req, res) {
    try {
        const { userId } = req.params;
        const profiles = await this.profileModel.getProfilesByUserId(userId);

        res.json({
            success: true,
            data: {
                count: profiles.length,
                max: 5,
                remaining: 5 - profiles.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
```

**2. Settings Page UI**
- [ ] Create `frontend/settings.html` page
- [ ] Add form to create new profiles
- [ ] Add avatar selection (dropdown with image previews)
- [ ] Add profile list with edit/delete buttons
- [ ] Show profile count: "3/5 profiles used"
- [ ] Add confirmation dialog for delete
- [ ] Create `frontend/js/settings.js` for functionality

**Settings page structure:**
```html
<!-- frontend/settings.html -->
<div class="settings-container">
    <h2>Manage Profiles</h2>
    <p class="profile-count">
        <span id="profileCount">3</span>/5 profiles used
    </p>

    <!-- Create Profile Form -->
    <div class="create-profile-section">
        <h3>Create New Profile</h3>
        <form id="createProfileForm">
            <input type="text" name="name" placeholder="Profile Name" required>
            <select name="avatar">
                <option value="https://i.pravatar.cc/150?img=1">Avatar 1</option>
                <option value="https://i.pravatar.cc/150?img=2">Avatar 2</option>
                <!-- ... more avatars ... -->
            </select>
            <label>
                <input type="checkbox" name="isChild"> Kids Profile
            </label>
            <button type="submit">Create Profile</button>
        </form>
    </div>

    <!-- Profile List -->
    <div id="profilesList">
        <!-- Profiles rendered here -->
    </div>
</div>
```

**3. "My List" Functionality**
- [ ] Add `myList` array to profile data in `content.json`
- [ ] Create `POST /api/content/:id/mylist` endpoint (add/remove)
- [ ] Create `GET /api/content/profile/:profileId/mylist` endpoint
- [ ] Add "My List" button to frontend movie cards
- [ ] Create "My List" section in main feed

**My List endpoints:**
```javascript
// In backend/controllers/ContentController.js
async toggleMyList(req, res) {
    try {
        const { id } = req.params;  // contentId
        const { profileId, add } = req.body;

        const result = await this.contentModel.toggleMyList(id, profileId, add);

        res.json({
            success: true,
            data: result,
            message: add ? 'Added to My List' : 'Removed from My List'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

async getMyList(req, res) {
    try {
        const { profileId } = req.params;
        const myList = await this.contentModel.getMyList(profileId);

        res.json({
            success: true,
            data: myList
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
```

**In backend/models/Content.js:**
```javascript
async toggleMyList(contentId, profileId, add) {
    const data = await this.getAllContent();

    if (!data.profileData[profileId]) {
        data.profileData[profileId] = {
            likedContent: [],
            myList: [],
            watchProgress: {},
            activityLog: []
        };
    }

    const myList = data.profileData[profileId].myList || [];

    if (add) {
        if (!myList.includes(contentId)) {
            myList.push(contentId);
        }
    } else {
        const index = myList.indexOf(contentId);
        if (index > -1) {
            myList.splice(index, 1);
        }
    }

    data.profileData[profileId].myList = myList;
    await this.saveContent(data);

    return { myList };
}
```

**4. Continue Watching Enhancements**
- [ ] Add `lastWatched` timestamp to watch progress
- [ ] Sort "Continue Watching" by most recent
- [ ] Remove items with 100% progress after 24 hours

**Files to work on:**
- `backend/controllers/ProfileController.js` (limits, count endpoint)
- `backend/controllers/ContentController.js` (My List)
- `backend/models/Content.js` (My List methods)
- `frontend/settings.html` (create new)
- `frontend/js/settings.js` (create new)
- `backend/routes/ContentRoutes.js` (add My List routes)

---

### 👨‍💻 Developer #3: Alon - Feed Features & Recommendations

#### ✅ Already Implemented:
- Content feed with sections
- Like/unlike functionality
- Search via TMDB API
- Frontend feed rendering
- Profile-specific tracking
- Watch progress

#### 🔨 Your Tasks:

**1. Personalized Recommendations Engine**
- [ ] Create `backend/services/RecommendationEngine.js`
- [ ] Implement algorithm based on liked content genres
- [ ] Use TMDB API to find similar movies/shows
- [ ] Create endpoint: `GET /api/content/recommendations/:profileId?limit=20`
- [ ] Integrate into frontend feed as new section

**Recommendation engine:**
```javascript
// backend/services/RecommendationEngine.js
const Content = require('../models/Content');

class RecommendationEngine {
    static async getRecommendations(profileId, limit = 20) {
        try {
            // 1. Get profile's liked content
            const content = new Content();
            const likedContent = await content.getLikedContent(profileId);

            if (likedContent.length === 0) {
                // No likes yet, return popular content
                return await this.getPopularContent(limit);
            }

            // 2. Extract genres from liked content
            const genres = this.extractGenres(likedContent);

            // 3. Find similar content using TMDB
            const recommendations = await this.findSimilarByGenres(genres, limit);

            // 4. Filter out already liked content
            const likedIds = likedContent.map(c => c.id);
            const filtered = recommendations.filter(r => !likedIds.includes(r.id));

            return filtered.slice(0, limit);
        } catch (error) {
            console.error('Recommendation error:', error);
            return [];
        }
    }

    static extractGenres(content) {
        const genreMap = {};
        content.forEach(item => {
            if (item.genre) {
                item.genre.split(',').forEach(g => {
                    const genre = g.trim();
                    genreMap[genre] = (genreMap[genre] || 0) + 1;
                });
            }
        });

        // Return top 3 genres
        return Object.entries(genreMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([genre]) => genre);
    }

    static async findSimilarByGenres(genres, limit) {
        // Use TMDB discover API to find content by genres
        // This is a simplified version - you'll need to implement TMDB API calls
        return [];
    }

    static async getPopularContent(limit) {
        // Return trending/popular content from TMDB
        return [];
    }
}

module.exports = RecommendationEngine;
```

**2. Advanced Search with Filters**
- [ ] Enhance `GET /api/content/search` to accept multiple filters
- [ ] Add filters: genre, year, minRating, maxRating, type (movie/tv)
- [ ] Implement search result ranking
- [ ] Track search history in `content.json`

**Enhanced search:**
```javascript
// In backend/controllers/ContentController.js
async searchContent(req, res) {
    try {
        const { q, genre, year, minRating, type, limit = 20 } = req.query;
        const { profileId } = req.query;

        let results = await this.tmdbSearch(q, type);

        // Apply filters
        if (genre) {
            results = results.filter(r =>
                r.genre && r.genre.toLowerCase().includes(genre.toLowerCase())
            );
        }

        if (year) {
            results = results.filter(r => r.year == year);
        }

        if (minRating) {
            results = results.filter(r =>
                parseFloat(r.rating) >= parseFloat(minRating)
            );
        }

        // Save search to history
        if (profileId && q) {
            await this.contentModel.addSearchHistory(profileId, q);
        }

        res.json({
            success: true,
            data: results.slice(0, limit)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
```

**3. Content Sections**
- [ ] Create "Trending Now" (most liked in last 7 days)
- [ ] Create "New Releases" (content added recently)
- [ ] Create "Top Rated" (highest TMDB ratings)
- [ ] Add genre-based categories

**Trending endpoint:**
```javascript
async getTrending(req, res) {
    try {
        const data = await this.contentModel.getAllContent();
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // Get content with recent activity
        const trending = [];
        for (const [profileId, profileData] of Object.entries(data.profileData)) {
            profileData.activityLog?.forEach(log => {
                if (new Date(log.timestamp) > sevenDaysAgo && log.action === 'like') {
                    trending.push(log.contentId);
                }
            });
        }

        // Count occurrences and get top items
        const counts = {};
        trending.forEach(id => counts[id] = (counts[id] || 0) + 1);

        const topTrending = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([id]) => id);

        res.json({
            success: true,
            data: topTrending
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
```

**4. Frontend Integration**
- [ ] Add loading spinners to all async operations
- [ ] Add error messages with retry buttons
- [ ] Create advanced search UI with filter controls
- [ ] Add empty states ("No results found", etc.)

**Loading state example:**
```javascript
// In frontend/js/netflix-ui.js
static showLoadingSpinner(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading...</p>
        </div>
    `;
}

static showError(containerId, message) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div class="error-state">
            <p>${message}</p>
            <button onclick="location.reload()">Retry</button>
        </div>
    `;
}
```

**Files to work on:**
- `backend/services/RecommendationEngine.js` (create new)
- `backend/controllers/ContentController.js` (search, trending, recommendations)
- `backend/models/Content.js` (search history)
- `frontend/js/main.js` (recommendations integration)
- `frontend/js/netflix-ui.js` (loading/error states)
- `frontend/js/search.js` (create new - advanced search UI)

---

## 🚀 Quick Start

```bash
# Install dependencies
cd backend
npm install

# David: Install additional packages
npm install bcrypt express-session express-rate-limit

# Start server
npm start

# Test API
curl http://localhost:5000/api/health
```

## 🧪 Testing APIs

```bash
# Test registration with strong password
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!@#","firstName":"Test","lastName":"User"}'

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!@#"}'
```

---

**Team:**
- **David** - Dev #1: Authentication & Security (bcrypt, sessions, logging, auth middleware)
- **Yaron** - Dev #2: Profile & Content Management (profile limits, settings UI, My List)
- **Alon** - Dev #3: Feed Features & Recommendations (recommendations engine, advanced search, trending)
