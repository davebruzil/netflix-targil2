// Environment Configuration
// This file loads environment variables for the application

class Config {
    constructor() {
        // In a real production environment, you would use proper environment variable loading
        // For this demo, we'll create a simple config that can be easily updated
        this.loadConfig();
    }

    loadConfig() {
        // Default configuration
        this.config = {
            TMDB_API_KEY: '09ffc701098b3d13d471b9a2d5890be0', // TMDB API key
            TMDB_BASE_URL: 'https://api.themoviedb.org/3',
            IMAGE_BASE_URL: 'https://image.tmdb.org/t/p/w500',
            BACKDROP_BASE_URL: 'https://image.tmdb.org/t/p/w1280',
            BACKEND_URL: 'http://localhost:5000/api',
            NODE_ENV: 'development'
        };
    }

    get(key) {
        return this.config[key];
    }

    // Method to update API key (for development purposes)
    setApiKey(apiKey) {
        this.config.TMDB_API_KEY = apiKey;
    }
}

// Create global config instance
window.AppConfig = new Config();