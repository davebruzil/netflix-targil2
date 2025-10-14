// TMDB API Configuration and Content Queries
// This file contains all API configuration and predefined content IDs

// TMDB API Configuration - Using environment config
const API_CONFIG = {
    get TMDB_BASE_URL() { return window.AppConfig?.get('TMDB_BASE_URL') || 'https://api.themoviedb.org/3'; },
    get API_KEY() { return window.AppConfig?.get('TMDB_API_KEY') || ''; },
    get IMAGE_BASE_URL() { return window.AppConfig?.get('IMAGE_BASE_URL') || 'https://image.tmdb.org/t/p/w500'; },
    get BACKDROP_BASE_URL() { return window.AppConfig?.get('BACKDROP_BASE_URL') || 'https://image.tmdb.org/t/p/w1280'; },
    get BASE_URL() { return window.AppConfig?.get('BACKEND_URL') || 'http://localhost:5000/api'; }
};

// Popular movie/TV show IDs from TMDB
// These are curated content IDs for different sections
const CONTENT_QUERIES = {
    continue: {
        movies: [550, 680, 155], // Fight Club, Pulp Fiction, The Dark Knight
        tv: [66732, 1399, 1396] // Stranger Things, Game of Thrones, Breaking Bad
    },
    trending: {
        movies: [438631, 634649, 505642], // Dune, Spider-Man No Way Home, Black Panther
        tv: [119051, 85552, 82856] // Wednesday, Euphoria, The Boys
    },
    movies: {
        movies: [361743, 791373, 460465, 581389] // Top Gun Maverick, Don't Look Up, Red Notice, Space Jam
    },
    series: {
        tv: [71912, 69050, 87108, 103768] // The Witcher, Ozark, Squid Game, House of the Dragon
    }
};

// Export for use in other modules
window.API_CONFIG = API_CONFIG;
window.CONTENT_QUERIES = CONTENT_QUERIES;