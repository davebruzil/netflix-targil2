# 🎬 Netflix Clone - Full Stack Application

## 📋 Project Overview
A full-stack Netflix clone with user authentication, content management, video streaming, and personalized recommendations. Built with MongoDB Atlas, Express.js, and vanilla JavaScript.

---

## 🎨 UI/UX TODO LIST

### 🔴 HIGH PRIORITY - Navigation & Core Functionality

#### 1. **Menu Navigation System**
- [ ] Add main navigation menu to all pages (index, main, profiles, player, admin, content-manager)
- [ ] Ensure menu redirects work correctly between:
  - Main feed → Profile selection
  - Profile selection → Main feed
  - Main feed → Admin panel (for admin users)
  - Main feed → Content Manager
  - Player → Main feed (back button)
  - Any page → Logout (redirect to index)
- [ ] Add user avatar/profile icon in top-right corner with dropdown menu
- [ ] Implement breadcrumb navigation where appropriate

#### 2. **Remove Mock/Irrelevant Buttons**
- [ ] Review all pages for unused/mock buttons
- [ ] Remove any non-functional UI elements
- [ ] Ensure every button has a working click handler
- [ ] Remove duplicate functionality (e.g., redundant Like buttons)

#### 3. **Database Functionality Verification**
- [ ] **Like System**:
  - [ ] Fix stuck like button in recommended movies section
  - [ ] Ensure like button toggles ON and OFF properly
  - [ ] Verify likes persist in MongoDB
  - [ ] Test like functionality across all content sections
- [ ] **My List System**:
  - [ ] Verify Add/Remove from My List works
  - [ ] Ensure My List persists in database
  - [ ] Test My List section displays correctly
  - [ ] Verify My List count updates in real-time

#### 4. **Video Player Improvements**
- [ ] **Play/Pause Icon**: Ensure icon changes from play (▶) to pause (⏸) correctly
- [ ] **Progress Bar**: Verify it updates smoothly during playback
- [ ] **Volume Control**: Test volume slider and mute button
- [ ] **Fullscreen**: Ensure fullscreen toggle works (F key and button)
- [ ] **Time Display**: Verify current time and total duration show correctly
- [ ] **Controls Visibility**: Ensure controls show on hover and hide when idle

---

### 🟡 MEDIUM PRIORITY - User Experience

#### 5. **Loading States & Feedback**
- [ ] Add loading spinners for all async operations
- [ ] Add success messages for actions (liked, added to list, etc.)
- [ ] Add error messages with retry buttons
- [ ] Implement skeleton screens for content loading

#### 6. **Empty States**
- [ ] "No content found" when search has no results
- [ ] "No recommendations yet" when user is new
- [ ] "My List is empty" when list is empty
- [ ] "No uploads yet" in uploaded content section

#### 7. **Form Validation & Error Handling**
- [ ] Show inline validation errors on forms
- [ ] Prevent empty submissions
- [ ] Add character limits to text inputs
- [ ] Show password strength indicator

---

### 🟢 LOW PRIORITY - Polish & Enhancement

#### 8. **Responsive Design**
- [ ] Test all pages on mobile devices
- [ ] Ensure touch controls work on mobile
- [ ] Optimize slider controls for touch
- [ ] Test landscape/portrait orientations

#### 9. **Accessibility**
- [ ] Add proper ARIA labels to all interactive elements
- [ ] Ensure keyboard navigation works everywhere
- [ ] Add focus indicators for keyboard users
- [ ] Test with screen readers

#### 10. **Performance Optimization**
- [ ] Lazy load images below the fold
- [ ] Implement virtual scrolling for long lists
- [ ] Optimize video loading (preload metadata only)
- [ ] Cache API responses where appropriate

---

## 🔧 Technical Implementation Guide

### Like Button Fix (Recommended Section)
**File**: `frontend/js/main.js`
**Issue**: Like button gets stuck in "liked" state
**Fix**: Ensure `toggleLike()` method properly updates state and UI for all sections

### Video Player Icon States
**File**: `frontend/js/player.js`
**Current**: Play/pause icon doesn't change
**Fix**: Update `updatePlayPauseButton()` method to change icon based on playing state

### Navigation Implementation
**Files**:
- `frontend/main.html` (add nav bar)
- `frontend/player.html` (add back button)
- `frontend/admin.html` (add nav bar)
- `frontend/content-manager.html` (add nav bar)

**Add this to all pages**:
```html
<nav class="navbar">
  <a href="main.html">Home</a>
  <a href="profiles.html">Profiles</a>
  <a href="content-manager.html">Library</a>
  <a href="admin.html">Admin</a>
  <a href="#" onclick="netflixLogout()">Logout</a>
</nav>
```

---

## 🚀 Quick Start

```bash
# Install dependencies
cd backend
npm install

# Start server
node server.js

# Access application
http://localhost:5000
```

## 📁 Project Structure

```
netflix-clone/
├── backend/
│   ├── controllers/      # Business logic
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth & upload
│   └── server.js        # Entry point
├── frontend/
│   ├── index.html       # Login page
│   ├── main.html        # Main feed
│   ├── player.html      # Video player
│   ├── admin.html       # Content upload
│   ├── content-manager.html  # Content library
│   ├── js/              # Frontend logic
│   ├── css/             # Styles
│   └── api/             # API client
└── README.md
```

## 🗄️ Database Schema

### MongoDB Collections:
- **users**: User accounts with encrypted passwords
- **profiles**: User profiles (up to 5 per user)
- **content**: Movies/TV shows metadata
- **sessions**: Session management
- **activitylogs**: User activity tracking

## 🔐 Authentication Flow

1. User registers → Encrypted password stored in MongoDB
2. User logs in → Session created in MongoDB
3. User selects profile → Profile ID stored in localStorage
4. All API requests → Authenticated via session cookies

---

## 📝 Notes for Team

- All backend APIs are already implemented and working
- Database (MongoDB Atlas) is connected and functional
- Focus on UI/UX improvements and fixing frontend bugs
- Test thoroughly before marking tasks as complete
- Use browser DevTools to debug issues
- Check server logs for backend errors

---

## 🐛 Known Issues to Fix

1. ✅ Like button stuck in recommended movies section
2. ✅ Video player play/pause icon doesn't change
3. ❌ Missing navigation between pages
4. ❌ Some mock buttons still present
5. ❌ Loading states missing

---

**Last Updated**: January 2025
**Repository**: https://github.com/davebruzil/netflix-targil2
