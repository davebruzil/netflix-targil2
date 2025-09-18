// Netflix Clone - External API Integrations
// IMDB, Wikipedia, and other external service integrations

class NetflixAPIManager {
    constructor() {
        // API endpoints and keys would go here in a real implementation
        this.endpoints = {
            imdb: 'https://api.example.com/imdb', // Replace with actual IMDB API
            wikipedia: 'https://en.wikipedia.org/api/rest_v1',
            omdb: 'https://www.omdbapi.com' // Alternative movie database
        };
        
        // Rate limiting
        this.requestCounts = new Map();
        this.rateLimits = {
            imdb: { requests: 100, perHour: true },
            wikipedia: { requests: 200, perHour: true }
        };
    }
    
    // IMDB API Integration
    async fetchIMDBData(imdbId) {
        try {
            if (!imdbId || !imdbId.startsWith('tt')) {
                throw new Error('Invalid IMDB ID format. Must start with "tt"');
            }
            
            // Check rate limiting
            if (!this.checkRateLimit('imdb')) {
                throw new Error('Rate limit exceeded for IMDB API');
            }
            
            // In a real implementation, this would make an actual API call
            // For now, return mock data with realistic structure
            const mockResponse = await this.simulateApiCall(2000);
            
            const movieData = {
                imdbId: imdbId,
                title: this.generateMockTitle(),
                year: Math.floor(Math.random() * (2024 - 1990) + 1990),
                genre: this.generateMockGenre(),
                director: this.generateMockDirector(),
                actors: this.generateMockActors(),
                plot: this.generateMockPlot(),
                rating: (Math.random() * 4 + 6).toFixed(1), // 6.0-10.0
                runtime: Math.floor(Math.random() * 120 + 80) + ' min',
                poster: `https://picsum.photos/400/600?random=${Math.floor(Math.random() * 1000)}`,
                language: 'English',
                country: 'USA',
                awards: 'N/A',
                boxOffice: '$' + (Math.random() * 200).toFixed(1) + 'M'
            };
            
            this.incrementRateLimit('imdb');
            return movieData;
            
        } catch (error) {
            console.error('IMDB API Error:', error);
            throw error;
        }
    }
    
    // Wikipedia API Integration for actor information
    async fetchActorInfo(actorName) {
        try {
            if (!actorName || actorName.trim().length === 0) {
                throw new Error('Actor name is required');
            }
            
            if (!this.checkRateLimit('wikipedia')) {
                throw new Error('Rate limit exceeded for Wikipedia API');
            }
            
            // Clean actor name for URL
            const cleanName = actorName.trim().replace(/\s+/g, '_');
            
            // Simulate Wikipedia API call
            await this.simulateApiCall(1500);
            
            const actorInfo = {
                name: actorName,
                wikipediaUrl: `https://en.wikipedia.org/wiki/${cleanName}`,
                summary: this.generateMockBiography(actorName),
                birthYear: Math.floor(Math.random() * (2000 - 1950) + 1950),
                nationality: this.generateMockNationality(),
                knownFor: this.generateMockFilmography(),
                imageUrl: `https://i.pravatar.cc/300?name=${encodeURIComponent(actorName)}`
            };
            
            this.incrementRateLimit('wikipedia');
            return actorInfo;
            
        } catch (error) {
            console.error('Wikipedia API Error:', error);
            throw error;
        }
    }
    
    // Rotten Tomatoes / Alternative Rating Service
    async fetchExternalRatings(title, year) {
        try {
            await this.simulateApiCall(1000);
            
            return {
                rottenTomatoes: {
                    tomatometer: Math.floor(Math.random() * 100),
                    audienceScore: Math.floor(Math.random() * 100),
                    consensus: 'Critics and audiences agree this is a solid film.'
                },
                metacritic: Math.floor(Math.random() * 100),
                imdb: (Math.random() * 4 + 6).toFixed(1),
                letterboxd: (Math.random() * 2 + 3).toFixed(1)
            };
        } catch (error) {
            console.error('External Ratings Error:', error);
            throw error;
        }
    }
    
    // Auto-complete for content search
    async searchContentSuggestions(query) {
        try {
            if (!query || query.length < 2) {
                return [];
            }
            
            await this.simulateApiCall(500);
            
            // Mock suggestions based on query
            const suggestions = [];
            const mockTitles = [
                'The Matrix', 'Inception', 'Interstellar', 'The Dark Knight',
                'Pulp Fiction', 'Fight Club', 'The Godfather', 'Goodfellas',
                'Breaking Bad', 'Game of Thrones', 'Stranger Things', 'The Office'
            ];
            
            mockTitles.forEach(title => {
                if (title.toLowerCase().includes(query.toLowerCase())) {
                    suggestions.push({
                        title: title,
                        year: Math.floor(Math.random() * (2024 - 1990) + 1990),
                        type: Math.random() > 0.5 ? 'movie' : 'series',
                        poster: `https://picsum.photos/150/225?random=${Math.floor(Math.random() * 1000)}`
                    });
                }
            });
            
            return suggestions.slice(0, 5);
            
        } catch (error) {
            console.error('Search Suggestions Error:', error);
            return [];
        }
    }
    
    // Rate limiting helper
    checkRateLimit(service) {
        const now = Date.now();
        const hourAgo = now - (60 * 60 * 1000);
        
        if (!this.requestCounts.has(service)) {
            this.requestCounts.set(service, []);
        }
        
        const requests = this.requestCounts.get(service);
        
        // Remove old requests
        const recentRequests = requests.filter(timestamp => timestamp > hourAgo);
        this.requestCounts.set(service, recentRequests);
        
        // Check if under limit
        const limit = this.rateLimits[service];
        return recentRequests.length < limit.requests;
    }
    
    incrementRateLimit(service) {
        if (!this.requestCounts.has(service)) {
            this.requestCounts.set(service, []);
        }
        
        const requests = this.requestCounts.get(service);
        requests.push(Date.now());
    }
    
    // Utility: Simulate API call delay
    simulateApiCall(delay = 1000) {
        return new Promise((resolve) => {
            setTimeout(resolve, delay);
        });
    }
    
    // Mock data generators for demonstration
    generateMockTitle() {
        const adjectives = ['Amazing', 'Incredible', 'Fantastic', 'Epic', 'Legendary', 'Ultimate'];
        const nouns = ['Adventure', 'Journey', 'Story', 'Mystery', 'Chronicles', 'Tales'];
        return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
    }
    
    generateMockGenre() {
        const genres = ['Action', 'Drama', 'Comedy', 'Thriller', 'Sci-Fi', 'Romance', 'Horror', 'Documentary'];
        const primary = genres[Math.floor(Math.random() * genres.length)];
        const secondary = genres[Math.floor(Math.random() * genres.length)];
        return primary === secondary ? primary : `${primary}, ${secondary}`;
    }
    
    generateMockDirector() {
        const directors = [
            'Christopher Nolan', 'Steven Spielberg', 'Martin Scorsese', 'Quentin Tarantino',
            'David Fincher', 'Ridley Scott', 'Denis Villeneuve', 'Jordan Peele'
        ];
        return directors[Math.floor(Math.random() * directors.length)];
    }
    
    generateMockActors() {
        const actors = [
            'Leonardo DiCaprio', 'Scarlett Johansson', 'Robert Downey Jr.', 'Emma Stone',
            'Ryan Gosling', 'Margot Robbie', 'Christian Bale', 'Natalie Portman',
            'Matthew McConaughey', 'Jennifer Lawrence', 'Brad Pitt', 'Cate Blanchett'
        ];
        
        const shuffled = actors.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3 + Math.floor(Math.random() * 3));
    }
    
    generateMockPlot() {
        const plots = [
            'A thrilling adventure that takes viewers on an unforgettable journey through time and space.',
            'An intimate character study that explores the depths of human emotion and resilience.',
            'A fast-paced action thriller that keeps audiences on the edge of their seats.',
            'A heartwarming story about family, love, and the power of human connection.',
            'A mind-bending sci-fi epic that challenges our understanding of reality.',
            'A gripping drama that examines the complexities of modern life.'
        ];
        return plots[Math.floor(Math.random() * plots.length)];
    }
    
    generateMockBiography(name) {
        return `${name} is a renowned actor known for their versatile performances across multiple genres. With a career spanning over two decades, they have become one of the most respected figures in the entertainment industry.`;
    }
    
    generateMockNationality() {
        const countries = ['American', 'British', 'Canadian', 'Australian', 'French', 'German', 'Italian'];
        return countries[Math.floor(Math.random() * countries.length)];
    }
    
    generateMockFilmography() {
        const films = [
            'The Great Adventure', 'City Lights', 'Ocean\'s Mystery', 'Mountain High',
            'Desert Storm', 'Forest Deep', 'River Wild', 'Sky High'
        ];
        return films.sort(() => 0.5 - Math.random()).slice(0, 3);
    }
}

// Global API manager instance
window.NetflixAPI = new NetflixAPIManager();

// Utility functions for easy access
window.fetchMovieData = async function(imdbId) {
    try {
        return await NetflixAPI.fetchIMDBData(imdbId);
    } catch (error) {
        console.error('Failed to fetch movie data:', error);
        throw error;
    }
};

window.fetchActorData = async function(actorName) {
    try {
        return await NetflixAPI.fetchActorInfo(actorName);
    } catch (error) {
        console.error('Failed to fetch actor data:', error);
        throw error;
    }
};

window.searchMovies = async function(query) {
    try {
        return await NetflixAPI.searchContentSuggestions(query);
    } catch (error) {
        console.error('Failed to search movies:', error);
        return [];
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NetflixAPIManager;
}