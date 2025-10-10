// Movie Profile Page JavaScript
class MovieProfile {
    constructor() {
        this.movieData = null;
        this.movieId = this.getMovieIdFromURL();
        this.likedItems = this.getLikedFromStorage();
        this.myListItems = this.getMyListFromStorage();
        this.watchProgress = 0;
        this.isPlaying = false;
        this.playbackInterval = null;

        this.init();
    }

    getMovieIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    async init() {
        if (!this.movieId) {
            this.showError('Movie not found');
            return;
        }

        this.loadProfile();
        await this.loadMovieData();
        await this.loadWatchProgress();
        this.setupEventListeners();
        this.updatePlayButton();
    }

    loadProfile() {
        const profileImage = document.getElementById('profileImage');
        const profileAvatar = localStorage.getItem('netflix:profileAvatar');

        if (profileAvatar && profileImage) {
            profileImage.src = profileAvatar;
            profileImage.style.display = 'block';
            profileImage.onerror = function() {
                // Fallback to a random avatar if the image fails to load
                this.src = `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 20) + 1}`;
            };
        }
    }

    async loadMovieData() {
        try {
            // Check if this is an uploaded content ID (MongoDB ObjectId format)
            if (this.movieId.length === 24 && !this.movieId.includes('_')) {
                // This is uploaded content
                const uploadedData = await NetflixAPI.getUploadedContent(this.movieId);
                if (uploadedData) {
                    this.movieData = uploadedData;
                    this.renderMovieProfile();
                    return;
                }
            }

            // Parse movie ID to get type and TMDB ID
            const [type, tmdbId] = this.movieId.split('_');

            // Fetch detailed movie data from TMDB
            const movieData = await this.fetchTMDBMovieDetails(tmdbId, type);

            if (movieData) {
                this.movieData = movieData;
                this.renderMovieProfile();
                await this.loadAdditionalData(tmdbId, type);
            } else {
                this.showError('Failed to load movie data');
            }
        } catch (error) {
            console.error('Error loading movie data:', error);
            this.showError('Error loading movie');
        }
    }

    async fetchTMDBMovieDetails(id, type = 'movie') {
        try {
            const API_KEY = window.AppConfig?.get('TMDB_API_KEY') || '';
            const BASE_URL = window.AppConfig?.get('TMDB_BASE_URL') || 'https://api.themoviedb.org/3';

            const url = `${BASE_URL}/${type}/${id}?api_key=${API_KEY}&append_to_response=credits,similar`;
            console.log(`Fetching TMDB data: ${type}/${id}`);
            const response = await fetch(url);

            if (!response.ok) {
                console.error(`TMDB API Error: ${response.status} for ${type}/${id}`);
                throw new Error(`HTTP error! status: ${response.status} - Movie/TV show not found`);
            }

            const data = await response.json();

            return {
                id: `${type}_${data.id}`,
                title: data.title || data.name,
                description: data.overview || 'No description available.',
                category: type === 'movie' ? 'Movie' : 'Series',
                image: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
                backdrop: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : null,
                year: data.release_date ? new Date(data.release_date).getFullYear() :
                      data.first_air_date ? new Date(data.first_air_date).getFullYear() : null,
                rating: data.vote_average ? data.vote_average.toFixed(1) : null,
                genre: data.genres ? data.genres.map(g => g.name).join(', ') : null,
                runtime: data.runtime ? `${data.runtime} min` :
                        (data.episode_run_time && data.episode_run_time.length > 0) ? `${data.episode_run_time[0]} min` : null,
                popularity: data.popularity || 0,
                likes: Math.floor(Math.random() * 3000) + 500,
                credits: data.credits,
                similar: data.similar ? data.similar.results.slice(0, 6) : [],
                director: this.extractDirector(data.credits),
                writer: this.extractWriter(data.credits),
                production: data.production_companies ? data.production_companies.slice(0, 2).map(c => c.name).join(', ') : null
            };
        } catch (error) {
            console.error('Error fetching movie details:', error);
            return null;
        }
    }

    extractDirector(credits) {
        if (!credits || !credits.crew) return null;
        const director = credits.crew.find(person => person.job === 'Director');
        return director ? director.name : null;
    }

    extractWriter(credits) {
        if (!credits || !credits.crew) return null;
        const writers = credits.crew.filter(person =>
            person.job === 'Writer' || person.job === 'Screenplay' || person.job === 'Story'
        );
        return writers.length > 0 ? writers.slice(0, 2).map(w => w.name).join(', ') : null;
    }

    renderMovieProfile() {
        if (!this.movieData) return;

        // Set movie title
        document.getElementById('movieTitle').textContent = this.movieData.title;

        // Set backdrop
        if (this.movieData.backdrop) {
            document.getElementById('movieBackdrop').style.backgroundImage =
                `url('${this.movieData.backdrop}')`;
        }

        // Poster removed - only using hero backdrop

        // Set metadata in metadata section
        document.getElementById('movieYear').textContent = this.movieData.year || 'N/A';
        document.getElementById('movieRating').textContent = this.movieData.rating || 'N/A';
        document.getElementById('movieRuntime').textContent = this.movieData.runtime || 'N/A';
        document.getElementById('movieCategory').textContent = this.movieData.category;
        document.getElementById('movieGenres').textContent = this.movieData.genre || 'N/A';

        // Set description
        document.getElementById('movieDescription').textContent = this.movieData.description;

        // Set cast
        this.renderCast();

        // Set additional info
        this.renderAdditionalInfo();

        // Update like button
        this.updateLikeButton();

        // Update My List button
        this.updateMyListButton();
    }

    renderCast() {
        const castContainer = document.getElementById('movieCast');

        if (this.movieData.credits && this.movieData.credits.cast) {
            const cast = this.movieData.credits.cast.slice(0, 10);
            castContainer.innerHTML = cast.map(actor => {
                const wikiLink = `https://en.wikipedia.org/wiki/${encodeURIComponent(actor.name.replace(/ /g, '_'))}`;
                return `<a href="${wikiLink}" target="_blank" rel="noopener noreferrer" class="cast-member" style="color: white; text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='#e50914'" onmouseout="this.style.color='white'">${actor.name}</a>`;
            }).join('');
        } else {
            castContainer.innerHTML = '<span class="cast-member">Cast information not available</span>';
        }
    }

    renderAdditionalInfo() {
        // Director
        const directorEl = document.getElementById('movieDirector');
        directorEl.textContent = this.movieData.director || 'Not available';

        // Writer
        const writerEl = document.getElementById('movieWriter');
        writerEl.textContent = this.movieData.writer || 'Not available';

        // Production
        const productionEl = document.getElementById('movieProduction');
        productionEl.textContent = this.movieData.production || 'Not available';
    }

    async loadAdditionalData(tmdbId, type) {
        // Load similar movies in the background
        this.renderSimilarMovies();
    }

    renderSimilarMovies() {
        const similarContainer = document.getElementById('similarMovies');

        if (this.movieData.similar && this.movieData.similar.length > 0) {
            similarContainer.innerHTML = this.movieData.similar.map(movie => `
                <div class="similar-movie-card" onclick="movieProfile.navigateToMovie('${movie.media_type || 'movie'}_${movie.id}')">
                    <img src="https://image.tmdb.org/t/p/w300${movie.poster_path}"
                         alt="${movie.title || movie.name}"
                         style="width: 100%; height: 280px; object-fit: cover; border-radius: 6px; cursor: pointer;">
                    <div style="padding: 8px 0; font-size: 13px; font-weight: 500;">
                        ${movie.title || movie.name}
                    </div>
                </div>
            `).join('');
        } else {
            similarContainer.innerHTML = '<p style="color: #999;">No similar movies found</p>';
        }
    }

    setupEventListeners() {
        // Like button
        const likeBtn = document.getElementById('movieLikeBtn');
        if (likeBtn) {
            likeBtn.addEventListener('click', () => this.toggleLike());
        }

        // My List button
        const listBtn = document.getElementById('movieListBtn');
        if (listBtn) {
            listBtn.addEventListener('click', () => this.toggleMyList());
        }

        // Play button with continue watching support
        const playBtn = document.querySelector('.movie-play-btn');
        if (playBtn) {
            playBtn.addEventListener('click', () => this.handlePlay());
        }
    }

    async toggleLike() {
        if (!this.movieData) return;

        const likeBtn = document.getElementById('movieLikeBtn');
        const heartIcon = likeBtn.querySelector('span');

        // Add animation class
        likeBtn.classList.add('netflix-like-animation');
        setTimeout(() => {
            likeBtn.classList.remove('netflix-like-animation');
        }, 300);

        const wasLiked = this.likedItems.has(this.movieData.id);
        const newLikedState = !wasLiked;

        // Optimistic UI update
        if (newLikedState) {
            this.likedItems.add(this.movieData.id);
            heartIcon.textContent = '♥';
            likeBtn.classList.add('liked');
            likeBtn.classList.add('btn-danger');
        } else {
            this.likedItems.delete(this.movieData.id);
            heartIcon.textContent = '♡';
            likeBtn.classList.remove('liked');
            likeBtn.classList.remove('btn-danger');
        }

        // Update backend
        try {
            const result = await NetflixAPI.toggleLike(this.movieData.id, newLikedState);
            if (result) {
                // Backend success - keep UI changes
                console.log('Like updated successfully:', result);
            } else {
                // Revert UI on backend failure
                if (wasLiked) {
                    this.likedItems.add(this.movieData.id);
                    heartIcon.textContent = '♥';
                    likeBtn.classList.add('liked');
                    likeBtn.classList.add('btn-danger');
                } else {
                    this.likedItems.delete(this.movieData.id);
                    heartIcon.textContent = '♡';
                    likeBtn.classList.remove('liked');
                    likeBtn.classList.remove('btn-danger');
                }
            }
        } catch (error) {
            console.warn('Like toggle failed, reverting:', error);
            // Revert UI on error
            if (wasLiked) {
                this.likedItems.add(this.movieData.id);
                heartIcon.textContent = '♥';
                likeBtn.classList.add('liked');
                likeBtn.classList.add('btn-danger');
            } else {
                this.likedItems.delete(this.movieData.id);
                heartIcon.textContent = '♡';
                likeBtn.classList.remove('liked');
                likeBtn.classList.remove('btn-danger');
            }
        }

        this.saveLikesToStorage();
    }

    updateLikeButton() {
        if (!this.movieData) return;

        const likeBtn = document.getElementById('movieLikeBtn');
        const heartIcon = likeBtn.querySelector('span');

        if (this.likedItems.has(this.movieData.id)) {
            heartIcon.textContent = '♥';
            likeBtn.classList.add('btn-danger');
        } else {
            heartIcon.textContent = '♡';
            likeBtn.classList.remove('btn-danger');
        }
    }

    async toggleMyList() {
        if (!this.movieData) return;

        const listBtn = document.getElementById('movieListBtn');
        const icon = listBtn.querySelector('span');

        // Add animation class
        listBtn.classList.add('netflix-like-animation');
        setTimeout(() => {
            listBtn.classList.remove('netflix-like-animation');
        }, 300);

        const wasInList = this.myListItems.has(this.movieData.id);
        const newListState = !wasInList;

        // Optimistic UI update
        if (newListState) {
            this.myListItems.add(this.movieData.id);
            icon.textContent = '✓';
            listBtn.classList.add('btn-success');
            listBtn.classList.remove('btn-outline-light');
        } else {
            this.myListItems.delete(this.movieData.id);
            icon.textContent = '+';
            listBtn.classList.remove('btn-success');
            listBtn.classList.add('btn-outline-light');
        }

        // Update backend
        try {
            const result = await NetflixAPI.toggleMyList(this.movieData.id, newListState);
            if (result) {
                console.log('My List updated successfully:', result);
            } else {
                // Revert UI on backend failure
                if (wasInList) {
                    this.myListItems.add(this.movieData.id);
                    icon.textContent = '✓';
                    listBtn.classList.add('btn-success');
                    listBtn.classList.remove('btn-outline-light');
                } else {
                    this.myListItems.delete(this.movieData.id);
                    icon.textContent = '+';
                    listBtn.classList.remove('btn-success');
                    listBtn.classList.add('btn-outline-light');
                }
            }
        } catch (error) {
            console.warn('My List toggle failed, reverting:', error);
            // Revert UI on error
            if (wasInList) {
                this.myListItems.add(this.movieData.id);
                icon.textContent = '✓';
                listBtn.classList.add('btn-success');
                listBtn.classList.remove('btn-outline-light');
            } else {
                this.myListItems.delete(this.movieData.id);
                icon.textContent = '+';
                listBtn.classList.remove('btn-success');
                listBtn.classList.add('btn-outline-light');
            }
        }

        this.saveMyListToStorage();
    }

    updateMyListButton() {
        if (!this.movieData) return;

        const listBtn = document.getElementById('movieListBtn');
        if (!listBtn) return;

        const icon = listBtn.querySelector('span');

        if (this.myListItems.has(this.movieData.id)) {
            icon.textContent = '✓';
            listBtn.classList.add('btn-success');
            listBtn.classList.remove('btn-outline-light');
        } else {
            icon.textContent = '+';
            listBtn.classList.remove('btn-success');
            listBtn.classList.add('btn-outline-light');
        }
    }

    navigateToMovie(movieId) {
        window.location.href = `movie-profile.html?id=${movieId}`;
    }

    getLikedFromStorage() {
        const stored = localStorage.getItem('netflix:likedItems');
        return stored ? new Set(JSON.parse(stored)) : new Set();
    }

    saveLikesToStorage() {
        localStorage.setItem('netflix:likedItems', JSON.stringify([...this.likedItems]));
    }

    getMyListFromStorage() {
        const stored = localStorage.getItem('netflix:myListItems');
        return stored ? new Set(JSON.parse(stored)) : new Set();
    }

    saveMyListToStorage() {
        localStorage.setItem('netflix:myListItems', JSON.stringify([...this.myListItems]));
    }

    async loadWatchProgress() {
        try {
            // Load progress from localStorage
            const progressData = localStorage.getItem(`netflix:progress:${this.movieId}`);
            if (progressData) {
                const data = JSON.parse(progressData);
                this.watchProgress = data.progress || 0;
            }
        } catch (error) {
            console.warn('Failed to load watch progress:', error);
            this.watchProgress = 0;
        }
    }

    async saveWatchProgress() {
        try {
            // Save to localStorage
            localStorage.setItem(`netflix:progress:${this.movieId}`, JSON.stringify({
                progress: this.watchProgress,
                lastWatched: new Date().toISOString()
            }));

            // Save to backend
            await NetflixAPI.updateProgress(this.movieId, this.watchProgress);
        } catch (error) {
            console.warn('Failed to save watch progress:', error);
        }
    }

    updatePlayButton() {
        const playBtn = document.querySelector('.movie-play-btn');
        if (!playBtn) return;

        const playIcon = playBtn.querySelector('span');
        const playText = playBtn.childNodes[playBtn.childNodes.length - 1];

        if (this.isPlaying) {
            playIcon.textContent = '⏸';
            playText.textContent = ' Pause';
        } else if (this.watchProgress > 0 && this.watchProgress < 95) {
            playIcon.textContent = '▶';
            playText.textContent = ' Continue';
        } else {
            playIcon.textContent = '▶';
            playText.textContent = ' Play';
        }
    }

    async handlePlay() {
        if (!this.movieData) return;

        // Redirect to player with movie ID
        window.location.href = `player.html?id=${this.movieId}`;
    }

    startPlayback() {
        this.isPlaying = true;
        this.updatePlayButton();

        // Show playback modal
        this.showPlaybackModal();

        // Simulate playback progress
        this.playbackInterval = setInterval(() => {
            if (this.watchProgress < 100) {
                this.watchProgress += 1; // Increment by 1% every second (adjust as needed)
                this.updateProgressDisplay();

                // Save progress every 5%
                if (this.watchProgress % 5 === 0) {
                    this.saveWatchProgress();
                }
            } else {
                this.stopPlayback();
            }
        }, 1000); // Update every second
    }

    pausePlayback() {
        this.isPlaying = false;
        this.updatePlayButton();

        if (this.playbackInterval) {
            clearInterval(this.playbackInterval);
            this.playbackInterval = null;
        }

        this.saveWatchProgress();
    }

    stopPlayback() {
        this.pausePlayback();
        this.closePlaybackModal();

        if (this.watchProgress >= 95) {
            this.watchProgress = 0;
            this.saveWatchProgress();
        }
    }

    showPlaybackModal() {
        // Create a simple playback modal overlay
        const modal = document.createElement('div');
        modal.id = 'playbackModal';
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
                <h2>${this.movieData.title}</h2>
                <p style="font-size: 24px; margin-top: 40px;">▶ Playing...</p>
                <div style="margin-top: 20px;">
                    <div style="width: 600px; height: 8px; background: #333; border-radius: 4px; margin: 0 auto;">
                        <div id="playbackProgress" style="width: ${this.watchProgress}%; height: 100%; background: #e50914; border-radius: 4px; transition: width 0.3s;"></div>
                    </div>
                    <p style="margin-top: 10px; font-size: 14px; color: #999;" id="progressText">${this.watchProgress}% complete</p>
                </div>
                <div style="margin-top: 40px;">
                    <button onclick="movieProfile.pausePlayback()" class="btn btn-light btn-lg" style="margin-right: 10px;">
                        ⏸ Pause
                    </button>
                    <button onclick="movieProfile.stopPlayback()" class="btn btn-outline-light btn-lg">
                        ⏹ Stop
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Handle F5 (page refresh) - save progress before unload
        window.addEventListener('beforeunload', () => {
            if (this.isPlaying) {
                this.saveWatchProgress();
            }
        });
    }

    closePlaybackModal() {
        const modal = document.getElementById('playbackModal');
        if (modal) {
            modal.remove();
        }
    }

    updateProgressDisplay() {
        const progressBar = document.getElementById('playbackProgress');
        const progressText = document.getElementById('progressText');

        if (progressBar) {
            progressBar.style.width = `${this.watchProgress}%`;
        }

        if (progressText) {
            progressText.textContent = `${this.watchProgress}% complete`;
        }
    }

    showError(message) {
        const heroContent = document.querySelector('.movie-hero-content');
        if (heroContent) {
            heroContent.innerHTML = `
                <div class="error-container" style="text-align: center; color: white; padding: 60px;">
                    <h1 style="font-size: 3rem; margin-bottom: 2rem;">Oops!</h1>
                    <p style="font-size: 1.5rem; margin-bottom: 2rem;">${message}</p>
                    <p style="font-size: 1rem; color: #999; margin-bottom: 2rem;">Movie ID: ${this.movieId || 'Unknown'}</p>
                    <button onclick="window.location.href='main.html'" class="btn btn-light btn-lg">
                        Back to Home
                    </button>
                </div>
            `;
        }
    }
}

// Logout function
function netflixLogout() {
    localStorage.removeItem('netflix:isAuthenticated');
    localStorage.removeItem('netflix:email');
    localStorage.removeItem('netflix:profileId');
    localStorage.removeItem('netflix:profileName');
    window.location.href = 'index.html';
}

// Initialize movie profile when page loads
let movieProfile;
document.addEventListener('DOMContentLoaded', function() {
    movieProfile = new MovieProfile();
});