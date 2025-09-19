// Hero Section Functions
// This file handles all hero section functionality including content loading and button actions

class HeroSection {
    /**
     * Load and set featured hero content
     * @param {Array} allContent - All available content
     */
    static loadFeaturedHero(allContent) {
        // Wait a bit to ensure content is loaded
        setTimeout(() => {
            if (allContent.length > 0) {
                // Get a random movie from all content
                const randomIndex = Math.floor(Math.random() * allContent.length);
                const featuredMovie = allContent[randomIndex];
                this.setHeroContent(featuredMovie);
            }
        }, 1000);
    }

    /**
     * Set hero section content with movie data
     * @param {Object} movie - Movie object with title, description, backdrop, etc.
     */
    static setHeroContent(movie) {
        const heroSection = document.getElementById('heroSection');
        const heroTitle = document.getElementById('heroTitle');
        const heroDescription = document.getElementById('heroDescription');
        const heroMoreInfoBtn = document.getElementById('heroMoreInfoBtn');

        if (!heroSection || !heroTitle || !heroDescription) {
            console.warn('Hero section elements not found');
            return;
        }

        // Set background image with gradient overlay
        if (movie.backdrop) {
            heroSection.style.backgroundImage = `linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.3) 40%, rgba(0, 0, 0, 0.8) 80%, rgba(0, 0, 0, 0.95) 100%), url('${movie.backdrop}')`;
        }

        // Set title and description
        heroTitle.textContent = movie.title;
        heroDescription.textContent = movie.description;

        // Store movie ID for buttons
        heroSection.setAttribute('data-movie-id', movie.id);
    }

    /**
     * Handle play button click
     */
    static playFeaturedMovie() {
        // Placeholder for play functionality
        // In a real app, this would open a video player
        alert('Play functionality would be implemented here');
    }

    /**
     * Handle more info button click
     */
    static openFeaturedMovieProfile() {
        const heroSection = document.getElementById('heroSection');
        const movieId = heroSection?.getAttribute('data-movie-id');

        if (movieId) {
            window.location.href = `movie-profile.html?id=${movieId}`;
        } else {
            console.warn('No movie ID found for hero section');
        }
    }

    /**
     * Initialize hero section with default content if no movie data available
     */
    static initializeDefaultHero() {
        const heroSection = document.getElementById('heroSection');
        const heroTitle = document.getElementById('heroTitle');
        const heroDescription = document.getElementById('heroDescription');

        if (!heroSection || !heroTitle || !heroDescription) return;

        // Set default content while loading
        heroTitle.textContent = 'Welcome to Netflix';
        heroDescription.textContent = 'Discover amazing movies and TV shows. Your next binge-watch is just a click away.';

        // Set a default background if needed
        heroSection.style.backgroundImage = `linear-gradient(to bottom, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.8) 100%), url('https://via.placeholder.com/1920x1080/141414/ffffff?text=Netflix')`;
    }

    /**
     * Update hero section with new content
     * @param {Object} movie - New movie object
     */
    static updateHeroContent(movie) {
        this.setHeroContent(movie);
    }

    /**
     * Get current hero movie ID
     * @returns {string|null} Current movie ID or null
     */
    static getCurrentMovieId() {
        const heroSection = document.getElementById('heroSection');
        return heroSection?.getAttribute('data-movie-id') || null;
    }
}

// Export for global use and make functions available globally
window.HeroSection = HeroSection;

// Global functions for backward compatibility
window.playFeaturedMovie = () => HeroSection.playFeaturedMovie();
window.openFeaturedMovieProfile = () => HeroSection.openFeaturedMovieProfile();