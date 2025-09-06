# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Server

This is a static HTML/CSS/JavaScript Netflix clone that requires an HTTP server to run properly (cannot be opened directly in browser due to CORS and localStorage restrictions).

**Start development server:**
```bash
python -m http.server 8080
```
Access at: http://localhost:8080

Note: Port 3000 may be restricted on Windows. Use port 8080 or 8000 as alternatives.

## Architecture Overview

### Page Structure
Three-page application with client-side routing via JavaScript:

- **index.html** - Sign-in/landing page with authentication form
- **profiles.html** - Profile selection page (post-authentication)  
- **main.html** - Main Netflix browsing interface

### Authentication Flow
The application uses localStorage-based authentication managed by `js/login.js`:

1. User signs in on `index.html` 
2. Authentication state stored in localStorage (`netflix:isAuthenticated`, `netflix:email`)
3. Auth guards automatically redirect:
   - Authenticated users on index.html → profiles.html
   - Unauthenticated users on protected pages → index.html

### Key Components

**Authentication System (`js/login.js`):**
- Form validation (email format, password length)
- localStorage-based session management  
- Automatic page redirects based on auth state
- Route protection for main.html and profiles.html

**Styling (`css/style.css`):**
- CSS custom properties for Netflix brand colors (--netflix-red, --netflix-black, etc.)
- Responsive design with mobile breakpoints
- Component-based styling (login forms, profile cards, movie grids)
- Bootstrap 5.3.0 integration for base components

**Profile Management:**
- Static profile avatars using pravatar.cc
- Profile selection links to main browsing interface
- Profile cards with hover effects

**Content Display:**
- Movie/show cards with hover animations
- Hero section with background images
- Responsive grid layouts for content sections

## File Structure

```
├── index.html          # Sign-in page
├── profiles.html       # Profile selection  
├── main.html          # Browse interface
├── css/style.css      # All custom styles
├── js/login.js        # Authentication logic
└── images/            # Logo and assets
```

## Development Notes

- Uses Bootstrap 5.3.0 CDN for base styling
- External dependencies: pravatar.cc for profile avatars, Netflix CDN for hero images
- All JavaScript is vanilla ES6+ in IIFE pattern
- CSS uses modern features (custom properties, flexbox, grid)
- Mobile-responsive with specific breakpoints at 768px and 576px