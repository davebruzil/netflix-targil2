# Netflix Clone - Developer Guide

> **For developers new to web development** - This guide explains everything step by step!

## 🚀 **Getting Started (Complete Beginner Guide)**

### Step 1: What You Need
- **Node.js** installed on your computer ([Download here](https://nodejs.org/))
- **Any web browser** (Chrome, Firefox, Safari, etc.)
- **Terminal/Command Prompt** access

### Step 2: Start the Application
1. **Open Terminal/Command Prompt**
2. **Navigate to the project folder**:
   ```bash
   cd targil-2-test
   ```
3. **Start the backend server**:
   ```bash
   cd backend
   node server.js
   ```
4. **You should see**:
   ```
   🚀 Netflix Backend Server running on port 5000
   📱 Frontend: http://localhost:5000
   ```

### Step 3: Access the App
- **Open your browser** and go to: `http://localhost:5000`
- **That's it!** The Netflix clone is now running!

---

## 🌐 **Understanding URLs (What Each Page Does)**

### Main Pages (What Users See)
- **`http://localhost:5000/`** → Home page with all movies
- **`http://localhost:5000/index.html`** → Login page (start here)
- **`http://localhost:5000/profiles.html`** → Choose your profile
- **`http://localhost:5000/main.html`** → Main Netflix feed
- **`http://localhost:5000/movie-profile.html?id=movie_155`** → Movie details page

### What is "localhost:5000"?
- **localhost** = Your own computer
- **5000** = The port number (like a door number)
- **Why 5000?** = That's the default port our server uses

---

## 🔧 **For Developers: API Endpoints (Backend Stuff)**

> These are the "behind the scenes" URLs that send and receive data

### Testing if Everything Works
- **`GET http://localhost:5000/api/health`** → Checks if server is alive
- **Response**: `{"status": "OK", "message": "Netflix Backend Server is running"}`

### Getting Movie Data
- **`GET http://localhost:5000/api/content`** → Gets all 20 movies/shows
- **`GET http://localhost:5000/api/content/movie_155`** → Gets specific movie (The Dark Knight)

### Search Feature
- **`GET http://localhost:5000/api/content/search?q=batman`** → Search for "batman"
- **With user tracking**: `?q=batman&profileId=anna` → Also saves search history

### User Actions (Requires POST requests)
- **Like a movie**: `POST http://localhost:5000/api/content/movie_155/like`
- **Update watch progress**: `POST http://localhost:5000/api/content/movie_155/progress`

---

## 👥 **Test Users (For Development)**

You can use these fake profiles to test the app:
- **anna** → Has search history and liked movies
- **alon** → Likes Breaking Bad
- **ronni** → Some activity
- **paul** → Empty profile
- **noa** → Empty profile

---

## 🎬 **Movie & Show IDs (For Testing)**

### Popular Movies
- **movie_155** → The Dark Knight
- **movie_550** → Fight Club
- **movie_634649** → Spider-Man: No Way Home

### Popular TV Shows
- **tv_66732** → Stranger Things
- **tv_1396** → Breaking Bad
- **tv_119051** → Wednesday

---

## 🛠️ **Common Developer Tasks**

### 1. Testing the Search Feature
**In your browser**: Go to `http://localhost:5000` and search for "batman"

**Using command line**:
```bash
curl "http://localhost:5000/api/content/search?q=batman&profileId=anna"
```

### 2. Testing the Like Feature
**In your browser**: Click the ❤️ button on any movie

**Using command line**:
```bash
curl -X POST "http://localhost:5000/api/content/movie_155/like" \
  -H "Content-Type: application/json" \
  -d '{"profileId": "anna", "liked": true}'
```

### 3. Checking User Activity
```bash
curl "http://localhost:5000/api/content/profile/anna/activity"
```

---

## 📁 **Project Structure (What Each Folder Does)**

```
targil-2-test/
├── 📁 backend/                    # Server code (Node.js)
│   ├── 📁 data/
│   │   └── content.json          # Database (stores movies & user data)
│   ├── 📁 routes/
│   │   └── content.js            # API endpoints (search, like, etc.)
│   └── server.js                 # Main server file (START HERE)
├── 📁 frontend/                   # Website code (HTML/CSS/JS)
│   ├── 📁 js/                    # JavaScript functionality
│   ├── 📁 css/                   # Styling/appearance
│   ├── 📁 images/                # Pictures and icons
│   ├── index.html                # Login page
│   ├── main.html                 # Main Netflix page
│   └── movie-profile.html        # Individual movie pages
└── URLS.md                       # This file!
```

---

## 🆘 **Troubleshooting (When Things Break)**

### "Cannot connect" or "Site not loading"
1. **Check if server is running**: Look for "🚀 Netflix Backend Server running on port 5000"
2. **Restart server**: Press `Ctrl+C` in terminal, then run `node server.js` again
3. **Check the URL**: Make sure you're going to `http://localhost:5000`

### "Port 5000 already in use"
- **Someone else is using port 5000**
- **Solution**: Change port in `backend/server.js` from `5000` to `3001` or `8080`

### Changes not showing up
- **Hard refresh browser**: Press `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
- **Clear browser cache**

---

## 🎯 **What This App Does (Netflix Clone Features)**

✅ **User login** (fake authentication)
✅ **Multiple profiles** (anna, alon, etc.)
✅ **Browse movies & TV shows** (20 real titles from TMDB)
✅ **Search functionality** (finds Batman movies)
✅ **Like movies** (saves to your profile)
✅ **Activity tracking** (remembers what you searched/liked)
✅ **Watch progress** (simulated)

---

## 🧪 **For New Developers: Learning Path**

1. **Start with the frontend** → Open `frontend/main.html` and see the HTML
2. **Look at the styling** → Check `frontend/css/` files
3. **Understand JavaScript** → Read `frontend/js/main.js`
4. **Backend basics** → Look at `backend/server.js`
5. **API endpoints** → Study `backend/routes/content.js`
6. **Database** → Open `backend/data/content.json` to see the data

**Remember**: This is a learning project! Break things, experiment, and ask questions! 🚀