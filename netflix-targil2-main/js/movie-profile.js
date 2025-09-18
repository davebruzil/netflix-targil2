// Movie Profile Page JavaScript
class MovieProfile {
    constructor() {
        this.movieData = null;
        this.movieId = this.getMovieIdFromURL();
        this.likedItems = this.getLikedFromStorage();

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
        this.setupEventListeners();
    }

    loadProfile() {
        const profileAvatars = {
            'paul': 'https://i.pravatar.cc/150?img=1',
            'alon': 'https://i.pravatar.cc/150?img=8',
            'ronni': 'https://i.pravatar.cc/150?img=9',
            'anna': 'https://i.pravatar.cc/150?img=5',
            'noa': 'https://i.pravatar.cc/150?img=10'
        };

        const profileId = localStorage.getItem('netflix:profileId');
        const profileImage = document.getElementById('profileImage');

        if (profileId && profileAvatars[profileId] && profileImage) {
            profileImage.src = profileAvatars[profileId];
            profileImage.style.display = 'block';
        }
    }

    async loadMovieData() {
        try {
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
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
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
    }

    renderCast() {
        const castContainer = document.getElementById('movieCast');

        if (this.movieData.credits && this.movieData.credits.cast) {
            const cast = this.movieData.credits.cast.slice(0, 10);
            castContainer.innerHTML = cast.map(actor =>
                `<span class="cast-member">${actor.name}</span>`
            ).join('');
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
        likeBtn.addEventListener('click', () => this.toggleLike());

        // My List button
        const listBtn = document.getElementById('movieListBtn');
        listBtn.addEventListener('click', () => this.toggleMyList());

        // Play button (placeholder)
        const playBtn = document.querySelector('.movie-play-btn');
        playBtn.addEventListener('click', () => {
            alert('Play functionality would be implemented here');
        });
    }

    toggleLike() {
        if (!this.movieData) return;

        const likeBtn = document.getElementById('movieLikeBtn');
        const heartIcon = likeBtn.querySelector('span');

        if (this.likedItems.has(this.movieData.id)) {
            this.likedItems.delete(this.movieData.id);
            heartIcon.textContent = '♡';
            likeBtn.classList.remove('btn-danger');
        } else {
            this.likedItems.add(this.movieData.id);
            heartIcon.textContent = '♥';
            likeBtn.classList.add('btn-danger');
        }

        this.saveLikesToStorage();
    }

    toggleMyList() {
        // Placeholder for My List functionality
        const listBtn = document.getElementById('movieListBtn');
        const text = listBtn.textContent.includes('✓') ? '+ My List' : '✓ Added';
        listBtn.innerHTML = `<span>${text.charAt(0)}</span> ${text.slice(2)}`;
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

    showError(message) {
        const heroContent = document.querySelector('.movie-hero-content');
        heroContent.innerHTML = `
            <div class="error-container" style="text-align: center; color: white; padding: 60px;">
                <h1 style="font-size: 3rem; margin-bottom: 2rem;">Oops!</h1>
                <p style="font-size: 1.5rem; margin-bottom: 2rem;">${message}</p>
                <button onclick="window.location.href='main.html'" class="btn btn-light btn-lg">
                    Back to Home
                </button>
            </div>
        `;
    }
}

// Logout function
function netflixLogout() {
    localStorage.removeItem('netflix:isLoggedIn');
    localStorage.removeItem('netflix:profileId');
    localStorage.removeItem('netflix:profileName');
    window.location.href = 'index.html';
}

// Initialize movie profile when page loads
let movieProfile;
document.addEventListener('DOMContentLoaded', function() {
    movieProfile = new MovieProfile();
});