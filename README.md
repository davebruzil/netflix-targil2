# Netflix Clone - Backend Development Guide

## Server Information
- **Backend Server**: http://localhost:5000
- **API Base URL**: http://localhost:5000/api
- **Existing API**: http://localhost:5000/api/content (already working)

## Developer Tasks

### Developer 1: Registration & Authentication
Create authentication system at `/api/auth`

**Files to create:**
- `backend/models/User.js`
- `backend/controllers/AuthController.js`
- `backend/routes/AuthRoutes.js`
- `backend/data/users.json`

**Update:** Add auth routes to `server.js`

### Developer 2: Profile Management
Create profile system at `/api/profiles`

**Files to create:**
- `backend/models/Profile.js`
- `backend/controllers/ProfileController.js`
- `backend/routes/ProfileRoutes.js`

**Update:** Add profile routes to `server.js`

## Important Rules
1. Follow the existing `Content.js` pattern exactly
2. Always use try-catch in controllers
3. Return JSON responses: `{ success: true, data: ... }`
4. Models handle file operations only
5. Controllers handle HTTP logic
6. Routes delegate to controllers

## Testing
Test with curl:
```
curl -X POST http://localhost:5000/api/auth/register -d '{"email":"test@test.com","password":"123","firstName":"John","lastName":"Doe"}' -H "Content-Type: application/json"
```

## Do NOT Touch
- NetflixAPI (frontend)
- Content.js, ContentController.js, ContentRoutes.js
- Any existing functionality