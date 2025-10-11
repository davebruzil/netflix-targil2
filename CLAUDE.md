# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack Netflix clone with MongoDB Atlas backend, Express.js API, and vanilla JavaScript frontend. Features include user authentication with bcrypt, session management, profile system, content streaming, personalized recommendations, and video playback.

## Development Commands

### Backend
```bash
# Start backend server (production)
cd backend
node server.js

# Start backend with auto-reload (development)
cd backend
npm run dev

# Install backend dependencies
cd backend
npm install
```

### Access Points
- Frontend: http://localhost:5000
- API: http://localhost:5000/api
- Health Check: http://localhost:5000/api/health

### Testing
- No test suite currently implemented
- Manual testing required for all features

## Architecture Overview

### Backend Architecture (MVC Pattern)

**Entry Point**: `backend/server.js`
- Express server with CORS, body-parser, session management
- MongoDB connection via Mongoose
- Static file serving for frontend
- Session storage in MongoDB using connect-mongo
- Request logging middleware
- Rate limiting on authentication endpoints

**Data Flow**:
1. Request → Express middleware (CORS, body-parser, session)
2. Request logger captures all API calls
3. Router matches endpoint to controller
4. Controller validates input and calls Model
5. Model interacts with MongoDB via Mongoose Schema
6. Response sent back through controller

**Key Patterns**:
- **Models** (backend/models/): Business logic classes that wrap Mongoose schemas
  - `User.js`: User management, password validation (uses bcrypt via schema hooks)
  - `Profile.js`: Profile CRUD, watch history, continue watching
  - `Content.js`: Content management, likes, My List, watch progress

- **Schemas** (backend/schemas/): Mongoose schemas with validation and hooks
  - `UserSchema.js`: bcrypt pre-save hook for password hashing, comparePassword method
  - `ProfileSchema.js`: Profile data with watchHistory subdocuments
  - `ContentSchema.js`: Content metadata with likes, views counters
  - `ProfileInteractionSchema.js`: Tracks likes, My List, watch progress per profile

- **Controllers** (backend/controllers/): Request handlers, validation, response formatting
  - `AuthController.js`: Registration (with password regex validation), login, logout, admin auth
  - `ProfileController.js`: Profile CRUD, watch progress tracking
  - `ContentController.js`: Content CRUD, search, recommendations, likes, My List

- **Routes** (backend/routes/): Express routers mapping endpoints to controllers
  - `AuthRoutes.js`: Auth endpoints with rate limiting (5 attempts per 15 min)
  - `ProfileRoutes.js`: Profile management endpoints with auth middleware
  - `ContentRoutes.js`: Content endpoints, some require authentication

- **Middleware** (backend/middleware/):
  - `auth.js`: Session-based authentication checker
  - `logger.js`: Request logging to console and MongoDB
  - `upload.js`: Multer configuration for video/image uploads

### Frontend Architecture (Modular JavaScript)

**Entry Points**:
- `frontend/index.html`: Login/register page
- `frontend/main.html`: Main feed with content sections
- `frontend/player.html`: Video player
- `frontend/profiles.html`: Profile selection
- `frontend/admin.html`: Content upload interface

**Core Modules**:
- `frontend/api/netflix-api.js`: API client with all backend integration
  - Authentication methods (register, login, logout)
  - Content loading (TMDB integration + backend uploaded content)
  - Profile management
  - Like/My List toggle
  - Watch progress tracking
  - Recommendations and dynamic sections
  - Caching layer (1-hour localStorage cache)

- `frontend/js/main.js`: Main feed controller
  - Progressive content loading (TMDB → Backend → Recommendations)
  - Search functionality (backend + local fallback)
  - Like/My List management with optimistic UI updates
  - Dynamic section rendering (continue watching, recommendations, genre sections)
  - Keyboard navigation for sliders

- `frontend/js/netflix-ui.js`: UI rendering and DOM manipulation
  - Section rendering with content cards
  - Search results display
  - Loading states and error handling
  - Slider navigation with arrow controls

- `frontend/js/player.js`: Video player functionality
  - Custom controls (play/pause, seek, volume, fullscreen)
  - Watch progress auto-save to backend
  - Keyboard shortcuts (Space, F, Left/Right arrows)

- `frontend/js/profiles.js`: Profile management UI
  - Profile selection/creation/deletion
  - Avatar management
  - Profile switching

### MongoDB Collections

- **users**: User accounts (bcrypt-hashed passwords)
- **profiles**: User profiles (up to 5 per user) with watch history subdocuments
- **contents**: Movie/TV show metadata (uploaded content)
- **profileinteractions**: Likes, My List, watch progress per profile
- **sessions**: Session data (managed by connect-mongo)

### Authentication Flow

1. User registers → Password validated with regex → Hashed by UserSchema pre-save hook → Stored in MongoDB
2. User logs in → Password compared with bcrypt → Session created in MongoDB → Session cookie sent
3. Session cookie included in all API requests (credentials: 'include')
4. Auth middleware checks session for protected routes
5. Logout destroys session on server and clears cookie

### Content Loading Strategy

**Progressive Loading** (frontend/js/main.js):
1. Load TMDB content (parallel fetch with caching)
2. Load backend uploaded content
3. Load hero section
4. Load personalized data in parallel:
   - Liked items
   - Recommendations (based on watch history and likes)
   - Trending content
   - Continue watching (from profile watch history)
   - Dynamic genre sections

**Caching**: 1-hour localStorage cache for TMDB content to reduce API calls

### Important Implementation Details

**Password Security** (backend/schemas/UserSchema.js:38-52):
- Bcrypt hashing via Mongoose pre-save hook
- 10 salt rounds
- Password validation regex in AuthController: min 8 chars, uppercase, lowercase, number, special char

**Session Management** (backend/server.js:51-64):
- MongoDB session store (connect-mongo)
- 24-hour session expiry
- HttpOnly cookies (secure: false for dev, set true for production)

**Like System** (backend/models/Content.js:99-165):
- Tracks likes in ProfileInteraction collection
- Handles both MongoDB ObjectIds and custom string IDs (e.g., "movie_634649" from TMDB)
- Optimistic UI updates on frontend with backend sync
- Increments content.likes counter

**My List Feature** (backend/models/Content.js:232-319):
- Similar to like system but separate array in ProfileInteraction
- Populate full content details when fetching My List

**Watch Progress** (backend/models/Profile.js:108-183):
- Stored in profile.watchHistory subdocuments
- Tracks currentTime, totalDuration, progress percentage
- isCompleted flag set at 90% progress
- Continue watching filters out completed items

**Rate Limiting** (backend/routes/AuthRoutes.js:9-19):
- Login endpoint limited to 5 attempts per 15 minutes per IP
- Applied using express-rate-limit middleware

## Key File Locations

### Backend Core
- Server entry: `backend/server.js`
- Database config: `backend/config/database.js`
- Auth middleware: `backend/middleware/auth.js`
- Request logger: `backend/middleware/logger.js`

### Frontend Core
- API client: `frontend/api/netflix-api.js`
- Main feed: `frontend/js/main.js`
- UI renderer: `frontend/js/netflix-ui.js`
- Video player: `frontend/js/player.js`

### Configuration
- Backend dependencies: `backend/package.json`
- MongoDB URI: `backend/config/database.js` (hardcoded, should use env vars in production)

## Common Development Tasks

### Adding a New API Endpoint

1. Create/update controller in `backend/controllers/`
2. Add route in `backend/routes/`
3. Add auth middleware if needed: `router.get('/endpoint', requireAuth, controller.method)`
4. Add corresponding method in `frontend/api/netflix-api.js`
5. Test with both authenticated and unauthenticated requests

### Adding a New Content Section

1. Add backend endpoint in `ContentController.js` and `ContentRoutes.js`
2. Add API method in `netflix-api.js` (e.g., `static async getNewSection()`)
3. Add section loading in `main.js` `loadContentProgressively()`
4. Add section rendering in `main.js` `renderAllSections()`
5. Add section HTML container in `main.html` or create dynamically

### Modifying Database Schema

1. Update Mongoose schema in `backend/schemas/`
2. Update Model class methods in `backend/models/`
3. Update Controller to handle new fields in `backend/controllers/`
4. No migrations needed (MongoDB is schemaless, but validate carefully)

### Working with Video Upload

- Upload handler: `backend/middleware/upload.js` (Multer configuration)
- Storage location: `backend/uploads/` (videos, images, thumbnails)
- Static serving: `app.use('/uploads', express.static(...))` in server.js
- Content creation: `ContentController.js` `uploadContent()` method

## Known Issues & Technical Debt

1. MongoDB URI hardcoded in `backend/config/database.js` (should use environment variables)
2. Session secret hardcoded in `backend/server.js:52` (should use environment variables)
3. No automated tests
4. Large video uploads may timeout (10-minute limit set in server.js)
5. TMDB API key exposed in frontend (should be proxied through backend)
6. Some content IDs are string-based ("movie_634649") vs MongoDB ObjectIds - Content model handles both but may cause confusion

## Development Notes

- Frontend uses vanilla JavaScript (no framework)
- Backend uses MVC pattern with class-based models (not typical Mongoose approach)
- Session-based authentication (not JWT)
- Mixed content sources: TMDB API + backend-uploaded content
- Profile switching updates localStorage but doesn't require re-login
- Video player uses HTML5 video element with custom controls overlay
