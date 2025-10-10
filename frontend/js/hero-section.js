// Hero Section Functions
// This file handles all hero section functionality including content loading and button actions

class HeroSection {
    static currentMovie = null;
    static watchProgress = 0;
    static isPlaying = false;
    static playbackInterval = null;

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

        // Store current movie
        this.currentMovie = movie;

        // Load watch progress for this movie
        this.loadWatchProgress(movie.id);

        // Set background image with gradient overlay
        if (movie.backdrop) {
            heroSection.style.backgroundImage = `linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.3) 40%, rgba(0, 0, 0, 0.8) 80%, rgba(0, 0, 0, 0.95) 100%), url('${movie.backdrop}')`;
        }

        // Set title and description
        heroTitle.textContent = movie.title;
        heroDescription.textContent = movie.description;

        // Store movie ID for buttons
        heroSection.setAttribute('data-movie-id', movie.id);

        // Update play button text
        this.updatePlayButton();
    }

    /**
     * Handle play button click
     */
    static playFeaturedMovie() {
        if (!this.currentMovie) {
            console.warn('No movie loaded in hero section');
            return;
        }

        // Redirect to player with movie ID
        window.location.href = `player.html?id=${this.currentMovie.id}`;
    }

    static loadWatchProgress(movieId) {
        try {
            const progressData = localStorage.getItem(`netflix:progress:${movieId}`);
            if (progressData) {
                const data = JSON.parse(progressData);
                this.watchProgress = data.progress || 0;
            } else {
                this.watchProgress = 0;
            }
        } catch (error) {
            console.warn('Failed to load watch progress:', error);
            this.watchProgress = 0;
        }
    }

    static async saveWatchProgress() {
        if (!this.currentMovie) return;

        try {
            const movieId = this.currentMovie.id;
            localStorage.setItem(`netflix:progress:${movieId}`, JSON.stringify({
                progress: this.watchProgress,
                lastWatched: new Date().toISOString()
            }));

            await NetflixAPI.updateProgress(movieId, this.watchProgress);
        } catch (error) {
            console.warn('Failed to save watch progress:', error);
        }
    }

    static updatePlayButton() {
        const playBtn = document.querySelector('.hero-buttons .btn-light');
        if (!playBtn) return;

        const playText = playBtn.childNodes[playBtn.childNodes.length - 1];

        if (this.isPlaying) {
            playBtn.innerHTML = '<span>⏸</span> Pause';
        } else if (this.watchProgress > 0 && this.watchProgress < 95) {
            playBtn.innerHTML = '<span>▶</span> Continue';
        } else {
            playBtn.innerHTML = '<span>▶</span> Play';
        }
    }

    static startPlayback() {
        this.isPlaying = true;
        this.updatePlayButton();
        this.showPlaybackModal();

        this.playbackInterval = setInterval(() => {
            if (this.watchProgress < 100) {
                this.watchProgress += 1;
                this.updateProgressDisplay();

                if (this.watchProgress % 5 === 0) {
                    this.saveWatchProgress();
                }
            } else {
                this.stopPlayback();
            }
        }, 1000);
    }

    static pausePlayback() {
        this.isPlaying = false;
        this.updatePlayButton();

        if (this.playbackInterval) {
            clearInterval(this.playbackInterval);
            this.playbackInterval = null;
        }

        this.saveWatchProgress();
    }

    static stopPlayback() {
        this.pausePlayback();
        this.closePlaybackModal();

        if (this.watchProgress >= 95) {
            this.watchProgress = 0;
            this.saveWatchProgress();
        }
    }

    static showPlaybackModal() {
        const modal = document.createElement('div');
        modal.id = 'heroPlaybackModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: black;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        `;

        modal.innerHTML = `
            <div style="text-align: center; color: white;">
                <h2>${this.currentMovie.title}</h2>
                <p style="font-size: 24px; margin-top: 40px;">▶ Playing...</p>
                <div style="margin-top: 20px;">
                    <div style="width: 600px; height: 8px; background: #333; border-radius: 4px; margin: 0 auto;">
                        <div id="heroPlaybackProgress" style="width: ${this.watchProgress}%; height: 100%; background: #e50914; border-radius: 4px; transition: width 0.3s;"></div>
                    </div>
                    <p style="margin-top: 10px; font-size: 14px; color: #999;" id="heroProgressText">${this.watchProgress}% complete</p>
                </div>
                <div style="margin-top: 40px;">
                    <button onclick="HeroSection.pausePlayback()" class="btn btn-light btn-lg" style="margin-right: 10px;">
                        ⏸ Pause
                    </button>
                    <button onclick="HeroSection.stopPlayback()" class="btn btn-outline-light btn-lg">
                        ⏹ Stop
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        window.addEventListener('beforeunload', () => {
            if (this.isPlaying) {
                this.saveWatchProgress();
            }
        });
    }

    static closePlaybackModal() {
        const modal = document.getElementById('heroPlaybackModal');
        if (modal) {
            modal.remove();
        }
    }

    static updateProgressDisplay() {
        const progressBar = document.getElementById('heroPlaybackProgress');
        const progressText = document.getElementById('heroProgressText');

        if (progressBar) {
            progressBar.style.width = `${this.watchProgress}%`;
        }

        if (progressText) {
            progressText.textContent = `${this.watchProgress}% complete`;
        }
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