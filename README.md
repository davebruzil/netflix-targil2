# 🎬 Netflix Clone - Team Project

## 📋 Mission
Build a full-stack Netflix clone with user authentication, personalized profiles, content management, and smart recommendations. The app uses MongoDB Atlas for cloud database storage, Express.js backend with secure session-based authentication, and a responsive frontend.

## 🔄 Recent Changes (MongoDB Migration)
**Status**: ✅ Complete

The application has been **fully migrated from JSON file storage to MongoDB Atlas**:

- **Database**: All data now stored in cloud MongoDB (users, profiles, content, sessions, activity logs)
- **Authentication**: Implemented bcrypt password encryption with strong validation rules
- **Sessions**: MongoDB-backed session management with 24-hour secure cookies
- **Security**: Added request logging, rate limiting (5 login attempts/15 min), and protected routes
- **Middleware**: Authentication middleware protects all profile and content operations

**What works now**:
- ✅ User registration with encrypted passwords
- ✅ User login with session creation
- ✅ Profile creation (up to 5 per user)
- ✅ All data persisted in MongoDB Atlas
- ✅ Request logging to database
- ✅ Protected API routes

---

## 👥 Team Assignments

### 👨‍💻 Developer #2: Yaron - Profile & Content Management

**Responsibility**: Everything related to profiles and content catalog

#### ✅ Already Implemented:
- Profile creation/deletion APIs (MongoDB-backed)
- Profile routes and controller with full CRUD
- 5 profile limit per user (enforced in ProfileController)
- Authentication middleware protecting all routes
- Profile selection UI on `profiles.html`
- Profile data model in MongoDB (`ProfileSchema`)

#### 🔨 Your Tasks:

**1. Profiles Page - Session Management**
- Implement active profile selection in `frontend/js/profiles.js`
- When user selects a profile, save to localStorage and redirect to feed
- API endpoint already exists: `GET /api/profiles/user/:userId`

**2. Settings Page - Profile Management UI**
- Implement full profile management interface in `frontend/settings.html`
- Show profile count: "X/5 profiles used"
- Add profile creation form with avatar selection
- Add edit/delete buttons for each profile
- Add confirmation dialog for profile deletion
- Wire up to existing APIs in `frontend/js/settings.js`

**3. Feed Page - Part 1: Content Catalog**
- Fetch content from MongoDB in `frontend/js/main.js`
- API already exists: `GET /api/content` returns all content from MongoDB
- Display content in feed sections (Continue Watching, Trending, Movies, Series)
- Implement "Like" system at profile level
  - API already exists: `POST /api/content/:id/like`
  - Update UI to show liked state
  - Save to MongoDB `ProfileInteractionSchema`

**4. "My List" Feature**
- Implement endpoints in `ContentController.js`:
  - `POST /api/content/:id/mylist` (add/remove)
  - `GET /api/content/profile/:profileId/mylist` (get all)
- Add "My List" button to movie cards
- Add "My List" section in main feed
- Update `Content.js` model with `toggleMyList()` and `getMyList()` methods
- Store in MongoDB `ProfileInteractionSchema.likedContent` array

**Files to work on:**
- `backend/controllers/ProfileController.js`
- `backend/controllers/ContentController.js`
- `backend/models/Content.js`
- `backend/schemas/ProfileInteractionSchema.js`
- `frontend/profiles.html`
- `frontend/settings.html`
- `frontend/js/profiles.js`
- `frontend/js/settings.js`
- `frontend/js/main.js`

---

### 👨‍💻 Developer #3: Alon - Feed Features & Recommendations

**Responsibility**: Feed functionality and recommendation engine

#### ✅ Already Implemented:
- Basic search functionality with TMDB API
- Content model with MongoDB queries
- Like/progress tracking in MongoDB
- Authentication middleware (routes already protected)
- Frontend search component in `main.html`

#### 🔨 Your Tasks:

**1. Feed Page - Part 2: Personalized Recommendations**
- Implement recommendation algorithm in `backend/services/RecommendationEngine.js`
- Analyze viewing habits and "liked" content from MongoDB `ProfileInteractionSchema`
- Extract favorite genres and use TMDB API to find similar content
- Create endpoint: `GET /api/content/recommendations/:profileId?limit=20`
- Add "Recommended For You" section to frontend feed
- Update `ContentController.js` with `getRecommendations()` method

**2. Search Functionality - Advanced Filters**
- Enhance search endpoint in `ContentController.js`
- Add query parameters: `genre`, `year`, `minRating`, `type` (movie/tv)
- Implement MongoDB queries for filtering
- Track search history in `ProfileInteractionSchema.searchHistory`
- Update search UI in `main.html` with filter controls
- Add method `addSearchHistory()` to `Content.js` model

**3. Content Sections - Dynamic Categories**
- Implement "Trending Now" endpoint (most liked in last 7 days from activity logs)
- Implement "New Releases" endpoint (recently added to MongoDB)
- Implement "Top Rated" endpoint (highest TMDB ratings)
- Add genre-based categories (Action, Drama, Comedy, etc.)
- Sort and filter content logic in `ContentController.js`

**4. Protected Routes Middleware** ✅ (Already done, but verify)
- Middleware already applied to all routes
- Check `backend/middleware/auth.js` - should verify session
- Verify Feed and Settings pages redirect to login if not authenticated

**5. Frontend Integration**
- Connect all pages to backend APIs
- Handle localStorage for client-side state (profileId, userId)
- Add loading spinners to async operations
- Add error messages with retry buttons
- Add empty states ("No results found", "No recommendations yet", etc.)
- Update `frontend/js/main.js` and `frontend/js/netflix-ui.js`

**Files to work on:**
- `backend/services/RecommendationEngine.js`
- `backend/controllers/ContentController.js`
- `backend/models/Content.js`
- `backend/schemas/ProfileInteractionSchema.js`
- `backend/middleware/auth.js` (verify protection)
- `frontend/main.html`
- `frontend/js/main.js`
- `frontend/js/netflix-ui.js`

---

## 🚀 Quick Start

```bash
# Install dependencies
cd backend
npm install

# Start server
npm start

# Frontend
Open index.html in browser
```

---

**Team:**
- **Yaron** - Dev #2: Profile Settings & My List
- **Alon** - Dev #3: Recommendations & Advanced Search
