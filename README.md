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

#### 🔨 Your Tasks:

**1. Profile Settings Page**
- Implement profile management UI in `frontend/settings.html`
- Add form to create/edit/delete profiles
- Show profile count: "3/5 profiles used"
- Implement avatar selection dropdown
- Add confirmation dialog for profile deletion
- Implement functionality in `frontend/js/settings.js`

**2. "My List" Feature**
- Update MongoDB `ProfileInteractionSchema` to include `myList` array
- Implement endpoints in `ContentController.js`:
  - `POST /api/content/:id/mylist` (add/remove from My List)
  - `GET /api/content/profile/:profileId/mylist` (get all My List items)
- Add "My List" button to movie cards in frontend
- Add "My List" section in main feed
- Implement `toggleMyList()` and `getMyList()` methods in `Content.js` model

**3. Continue Watching Enhancements**
- Add `lastWatched` timestamp to watch progress in MongoDB
- Sort "Continue Watching" by most recent
- Auto-remove completed items (100% progress) after 24 hours

**Files to work on:**
- `backend/controllers/ProfileController.js`
- `backend/controllers/ContentController.js`
- `backend/models/Content.js`
- `backend/schemas/ProfileInteractionSchema.js`
- `frontend/settings.html`
- `frontend/js/settings.js`

---

### 👨‍💻 Developer #3: Alon - Feed Features & Recommendations

#### 🔨 Your Tasks:

**1. Personalized Recommendations Engine**
- Implement recommendation algorithm in `backend/services/RecommendationEngine.js`
- Algorithm should analyze liked content genres from MongoDB
- Use TMDB API to find similar movies/shows
- Implement endpoint: `GET /api/content/recommendations/:profileId?limit=20`
- Add recommendations section to frontend feed

**2. Advanced Search with Filters**
- Enhance search in `ContentController.js` to accept filters
- Add filters: genre, year, minRating, type (movie/tv)
- Track search history in MongoDB `ProfileInteractionSchema`
- Update frontend search UI with filter controls

**3. Content Sections**
- Implement "Trending Now" (most liked in last 7 days from MongoDB activity logs)
- Implement "New Releases" (recently added content)
- Implement "Top Rated" (highest TMDB ratings)
- Add genre-based categories

**4. Frontend Enhancements**
- Add loading spinners to async operations
- Add error messages with retry buttons
- Add empty states ("No results found", etc.)
- Improve overall UX

**Files to work on:**
- `backend/services/RecommendationEngine.js`
- `backend/controllers/ContentController.js`
- `backend/models/Content.js`
- `backend/schemas/ProfileInteractionSchema.js`
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
