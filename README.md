# 🎬 Netflix Clone - Local Development Setup

A full-stack Netflix clone with user authentication, profile management, content browsing, video streaming, and personalized recommendations. Built with MongoDB, Express.js, Node.js, and vanilla JavaScript.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.x or higher) - [Download here](https://nodejs.org/)
- **MongoDB Atlas Account** (free tier works) - [Sign up here](https://www.mongodb.com/cloud/atlas)
- **TMDB API Key** (free) - [Get your key here](https://www.themoviedb.org/settings/api)
- **Git** - [Download here](https://git-scm.com/)

---

## 🚀 Local Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/davebruzil/netflix-targil2.git
cd netflix-targil2
```

### Step 2: Install Dependencies

```bash
cd backend
npm install
```

### Step 3: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster (if you haven't already)
3. Create a database user:
   - Go to "Database Access" → "Add New Database User"
   - Choose "Password" authentication
   - Save username and password
4. Whitelist your IP address:
   - Go to "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0) for development
5. Get your connection string:
   - Go to "Database" → "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `netflix`

### Step 4: Get TMDB API Key

1. Create an account at [TMDB](https://www.themoviedb.org/)
2. Go to Settings → API
3. Request an API key (choose "Developer" option)
4. Copy your API Key (v3 auth)

### Step 5: Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cd backend
touch .env  # On Windows use: echo. > .env
```

Add the following to your `.env` file:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/netflix?retryWrites=true&w=majority

# TMDB API Configuration
TMDB_API_KEY=your_tmdb_api_key_here
TMDB_BASE_URL=https://api.themoviedb.org/3
IMAGE_BASE_URL=https://image.tmdb.org/t/p/w500
BACKDROP_BASE_URL=https://image.tmdb.org/t/p/w1280

# Session Secret (change this to a random string)
SESSION_SECRET=your-super-secret-session-key-change-this-to-random-string

# Server Configuration
PORT=5000
NODE_ENV=development
```

**Replace:**
- `username:password@cluster.mongodb.net` with your actual MongoDB connection string
- `your_tmdb_api_key_here` with your actual TMDB API key
- `your-super-secret-session-key-change-this-to-random-string` with a random string

### Step 6: Start the Development Server

```bash
# From the backend directory
npm start

# Or use nodemon for auto-restart on file changes
npm run dev
```

You should see:
```
🚀 Netflix Backend Server running on port 5000
📱 Frontend: http://localhost:5000
🔌 API: http://localhost:5000/api
❤️  Health Check: http://localhost:5000/api/health
```

### Step 7: Access the Application

Open your browser and navigate to:
```
http://localhost:5000
```

You should see the Netflix login page!

---

## 📁 Project Structure

```
netflix-clone/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   ├── AuthController.js    # User authentication
│   │   ├── ContentController.js # Content management
│   │   └── ProfileController.js # Profile management
│   ├── models/
│   │   ├── User.js             # User model
│   │   ├── Profile.js          # Profile model
│   │   └── Content.js          # Content model
│   ├── schemas/
│   │   ├── UserSchema.js       # User database schema
│   │   ├── ProfileSchema.js    # Profile database schema
│   │   ├── ContentSchema.js    # Content database schema
│   │   └── ProfileInteractionSchema.js  # User interactions
│   ├── routes/
│   │   ├── AuthRoutes.js       # Authentication routes
│   │   ├── ContentRoutes.js    # Content routes
│   │   └── ProfileRoutes.js    # Profile routes
│   ├── middleware/
│   │   ├── auth.js             # Authentication middleware
│   │   └── upload.js           # File upload middleware
│   ├── services/
│   │   └── RecommendationEngine.js  # Content recommendations
│   ├── uploads/                # Uploaded videos/images
│   ├── server.js               # Express server entry point
│   ├── package.json
│   └── .env                    # Environment variables
├── frontend/
│   ├── index.html              # Login/Register page
│   ├── main.html               # Main feed with content
│   ├── profiles.html           # Profile selection
│   ├── settings.html           # Profile management & statistics
│   ├── genre.html              # Browse by genre
│   ├── movie-profile.html      # Individual movie details
│   ├── player.html             # Video player
│   ├── admin.html              # Admin panel
│   ├── content-manager.html    # Content library
│   ├── js/
│   │   ├── main.js             # Main feed logic
│   │   ├── login.js            # Authentication
│   │   ├── settings.js         # Profile settings
│   │   ├── genre-browser.js    # Genre browsing
│   │   ├── movie-profile.js    # Movie details
│   │   ├── player.js           # Video player controls
│   │   └── netflix-ui.js       # Shared UI components
│   ├── api/
│   │   ├── api-config.js       # API configuration
│   │   └── netflix-api.js      # API client
│   ├── css/
│   │   └── style.css           # Main styles
│   └── images/
└── README.md
```

---

## 🔑 First-Time Setup

### 1. Register a New Account

1. Go to `http://localhost:5000`
2. Click "Sign Up"
3. Enter your details (email, password, first name, last name)
4. Click "Sign Up"

### 2. Create Your First Profile

1. After registration, you'll be redirected to the profile creation page
2. Enter a profile name
3. Select an avatar
4. Click "Create Profile"

### 3. Start Browsing Content

- The main feed will load with trending movies and shows from TMDB
- Browse by genre
- Search for content
- Like content and add to your list
- View statistics in the settings page

---

## 🛠️ Available Scripts

```bash
# Start the server
npm start

# Start with auto-reload (development)
npm run dev

# Run tests (if configured)
npm test
```

---

## 🔐 Authentication Flow

1. **Register**: User creates an account → Password encrypted with bcrypt → Stored in MongoDB
2. **Login**: User logs in → Session created in MongoDB → Cookie sent to browser
3. **Profile Selection**: User selects a profile → Profile ID stored in localStorage
4. **Authenticated Requests**: All API calls include session cookie for authentication

---

## 📊 Database Collections

- **users**: User accounts with encrypted passwords
- **profiles**: User profiles (max 5 per user)
- **content**: Movies/TV shows metadata
- **profileinteractions**: User likes, my list, watch history
- **sessions**: Express session storage

---

## 🎯 Features

### User Management
- User registration and login
- Profile creation (up to 5 profiles per user)
- Profile editing and deletion
- Session-based authentication

### Content Features
- Browse trending movies and TV shows (from TMDB API)
- Search content by title, genre, or description
- Filter by genre
- View detailed movie information
- Watch trailers and videos

### Personalization
- Like/unlike content
- Add content to "My List"
- Continue watching tracking
- Personalized recommendations based on viewing history
- Watch progress tracking

### Statistics & Analytics
- Daily viewing activity by profile
- Genre popularity charts
- Watch history tracking
- Real-time statistics dashboard

### Admin Features
- Upload custom content
- Manage content library
- User analytics

---

## 🐛 Troubleshooting

### MongoDB Connection Issues

**Error**: `MongoServerError: Authentication failed`

**Solution**:
1. Check your `.env` file has the correct MongoDB connection string
2. Verify your database username and password are correct
3. Ensure your IP is whitelisted in MongoDB Atlas Network Access

### Port Already in Use

**Error**: `Error: listen EADDRINUSE: address already in use :::5000`

**Solution**:
```bash
# Find process using port 5000
netstat -ano | findstr :5000  # Windows
lsof -i :5000                 # Mac/Linux

# Kill the process
taskkill /PID <PID> /F        # Windows
kill -9 <PID>                 # Mac/Linux
```

Or change the port in `.env`:
```env
PORT=3000
```

### TMDB API Not Working

**Error**: Content not loading, API errors in console

**Solution**:
1. Verify your TMDB API key is correct in `.env`
2. Check you're using the API Key (v3 auth), not the API Read Access Token
3. Test your API key at: `https://api.themoviedb.org/3/movie/550?api_key=YOUR_KEY`

### Static Files Not Loading

**Error**: 404 errors for CSS/JS files

**Solution**:
1. Ensure you're accessing the app via `http://localhost:5000` (not file://)
2. Check the `backend/server.js` static file middleware is configured correctly
3. Verify files exist in the `frontend/` directory

---

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/netflix` |
| `TMDB_API_KEY` | TMDB API key for fetching movies | `abc123def456...` |
| `TMDB_BASE_URL` | TMDB API base URL | `https://api.themoviedb.org/3` |
| `IMAGE_BASE_URL` | TMDB image base URL | `https://image.tmdb.org/t/p/w500` |
| `BACKDROP_BASE_URL` | TMDB backdrop image URL | `https://image.tmdb.org/t/p/w1280` |
| `SESSION_SECRET` | Secret for session encryption | Any random string |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` or `production` |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🔗 Useful Links

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [TMDB API Documentation](https://developers.themoviedb.org/3)
- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)

---

**Last Updated**: January 2025
**Repository**: https://github.com/davebruzil/netflix-targil2
