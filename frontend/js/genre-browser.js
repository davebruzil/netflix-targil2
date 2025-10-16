// Genre Browser with Infinite Scroll, Sorting, and Filtering

class GenreBrowser {
    constructor() {
        this.currentGenre = '';
        this.currentPage = 1;
        this.currentSort = 'popularity';
        this.currentWatchStatus = 'all';
        this.profileId = localStorage.getItem('netflix:profileId');
        this.isLoading = false;
        this.hasMore = true;
        this.allContent = [];
        this.genres = [];

        this.init();
    }

    async init() {
        // Check authentication
        this.checkAuth();

        // Load profile photo
        this.loadProfile();

        // Load genres
        await this.loadGenres();

        // Get genre from URL or default to first genre
        const urlParams = new URLSearchParams(window.location.search);
        this.currentGenre = urlParams.get('genre') || this.genres[0] || 'Action';

        // Setup UI
        this.setupUI();
        this.setupEventListeners();

        // Load initial content
        await this.loadContent(true);

        // Setup infinite scroll
        this.setupInfiniteScroll();
    }

    loadProfile() {
        const profileId = localStorage.getItem('netflix:profileId');
        const profileName = localStorage.getItem('netflix:profileName') || 'User';
        NetflixUI.loadProfile(profileId, profileName);
    }

    checkAuth() {
        const isLoggedIn = localStorage.getItem('netflix:isAuthenticated');
        if (!isLoggedIn) {
            window.location.href = 'index.html';
            return;
        }
    }

    async loadGenres() {
        try {
            const response = await fetch(`${API_BASE}/api/content/sections/genres`, {
                credentials: 'include'
            });
            const result = await response.json();

            if (result.success && result.data.genres && result.data.genres.length > 0) {
                this.genres = result.data.genres;
                console.log('✅ Loaded genres from API:', this.genres.length, 'genres');
            } else {
                console.warn('⚠️ API returned no genres, using comprehensive fallback list');
                this.genres = [
                    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
                    'Documentary', 'Drama', 'Family', 'Fantasy', 'History',
                    'Horror', 'Music', 'Mystery', 'Romance', 'Science Fiction',
                    'Thriller', 'War', 'Western', 'TV Movie'
                ];
            }
        } catch (error) {
            console.error('❌ Failed to load genres:', error);
            this.genres = [
                'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
                'Documentary', 'Drama', 'Family', 'Fantasy', 'History',
                'Horror', 'Music', 'Mystery', 'Romance', 'Science Fiction',
                'Thriller', 'War', 'Western', 'TV Movie'
            ];
        }
    }

    setupUI() {
        // Update genre title
        document.getElementById('genreTitle').textContent = this.currentGenre;
        document.getElementById('genreDescription').textContent = `Explore ${this.currentGenre} content`;

        // Update genre selector - ONLY set the selected value, don't overwrite HTML options
        const genreSelect = document.getElementById('genreSelect');

        // Check if the HTML dropdown already has options (hardcoded in HTML)
        const existingOptions = genreSelect.querySelectorAll('option');

        if (existingOptions.length === 0 && this.genres && this.genres.length > 0) {
            // Only populate if HTML has no options (shouldn't happen with current HTML)
            genreSelect.innerHTML = this.genres.map(genre =>
                `<option value="${genre}" ${genre === this.currentGenre ? 'selected' : ''}>${genre}</option>`
            ).join('');
            console.log('📋 Populated genre dropdown with', this.genres.length, 'genres');
        } else {
            // HTML already has options, just set the selected value
            genreSelect.value = this.currentGenre;
            console.log('📋 Using HTML dropdown options (' + existingOptions.length + ' genres), selected:', this.currentGenre);
        }

        // Set initial sort value
        document.getElementById('sortSelect').value = this.currentSort;
        document.getElementById('watchStatusFilter').value = this.currentWatchStatus;

        // Update active filters display
        this.updateActiveFilters();
    }

    setupEventListeners() {
        // Genre selector
        document.getElementById('genreSelect').addEventListener('change', (e) => {
            this.currentGenre = e.target.value;
            this.resetAndReload();
        });

        // Sort selector
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.resetAndReload();
        });

        // Watch status filter
        document.getElementById('watchStatusFilter').addEventListener('change', (e) => {
            this.currentWatchStatus = e.target.value;
            this.resetAndReload();
        });
    }

    setupInfiniteScroll() {
        window.addEventListener('scroll', () => {
            if (this.isLoading || !this.hasMore) return;

            const scrollHeight = document.documentElement.scrollHeight;
            const scrollTop = document.documentElement.scrollTop;
            const clientHeight = document.documentElement.clientHeight;

            // Load more when user scrolls near bottom (300px from bottom)
            if (scrollTop + clientHeight >= scrollHeight - 300) {
                this.loadContent(false);
            }
        });
    }

    async resetAndReload() {
        // Clear current content
        this.allContent = [];
        this.currentPage = 1;
        this.hasMore = true;
        document.getElementById('contentGrid').innerHTML = '';

        // Update UI
        document.getElementById('genreTitle').textContent = this.currentGenre;
        document.getElementById('genreDescription').textContent = `Explore ${this.currentGenre} content`;
        this.updateActiveFilters();

        // Update URL
        const url = new URL(window.location);
        url.searchParams.set('genre', this.currentGenre);
        window.history.pushState({}, '', url);

        // Load content
        await this.loadContent(true);
    }

    async loadContent(reset = false) {
        if (this.isLoading) return;

        this.isLoading = true;
        this.showLoading();

        try {
            // Always include profileId for watch status filtering
            const profileId = localStorage.getItem('netflix:profileId');

            const url = `${API_BASE}/api/content/browse/genre/${encodeURIComponent(this.currentGenre)}?` +
                `page=${this.currentPage}&` +
                `limit=20&` +
                `sort=${this.currentSort}&` +
                `watchStatus=${this.currentWatchStatus}` +
                (profileId ? `&profileId=${profileId}` : '');

            console.log('🎬 Loading genre content:', { genre: this.currentGenre, watchStatus: this.currentWatchStatus, profileId });

            const response = await fetch(url, {
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success && result.data.content) {
                const content = result.data.content;
                const pagination = result.data.pagination;

                // Add to content array
                this.allContent = reset ? content : [...this.allContent, ...content];

                // Render content
                this.renderContent(content, reset);

                // Update pagination state
                this.hasMore = pagination.hasNextPage;
                this.currentPage++;

                // Update results count
                this.updateResultsCount(pagination.totalItems);

                // Show/hide no results message
                if (this.allContent.length === 0) {
                    document.getElementById('noResults').style.display = 'block';
                    document.getElementById('contentGrid').style.display = 'none';
                } else {
                    document.getElementById('noResults').style.display = 'none';
                    document.getElementById('contentGrid').style.display = 'grid';
                }

            } else {
                console.error('Failed to load content:', result.error);
            }

        } catch (error) {
            console.error('Error loading content:', error);
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    renderContent(content, reset = false) {
        const grid = document.getElementById('contentGrid');

        if (reset) {
            grid.innerHTML = '';
        }

        content.forEach(item => {
            const card = this.createContentCard(item);
            grid.appendChild(card);
        });
    }

    createContentCard(item) {
        const card = document.createElement('div');
        card.className = 'content-card';
        card.onclick = () => this.navigateToContent(item._id || item.id);

        const imageUrl = item.image || item.poster || '/images/placeholder.jpg';
        const isWatched = item.watched || false;
        const inContinueWatching = item.inContinueWatching || false;

        // Determine badge to show
        let badge = '';
        if (isWatched) {
            badge = '<div class="watched-badge"><i class="fas fa-check"></i> Watched</div>';
        } else if (inContinueWatching) {
            badge = '<div class="continue-watching-badge"><i class="fas fa-play"></i> Continue Watching</div>';
        }

        card.innerHTML = `
            <img src="${imageUrl}" alt="${item.title || 'Content'}"
                 onerror="this.src='/images/placeholder.jpg'">
            ${badge}
            <div class="content-card-overlay">
                <h4 style="font-size: 14px; margin-bottom: 5px;">${item.title || 'Untitled'}</h4>
                <div style="font-size: 12px; color: #46d369;">
                    ${item.rating ? `⭐ ${item.rating}/10` : ''}
                    ${item.year ? ` • ${item.year}` : ''}
                </div>
            </div>
        `;

        return card;
    }

    navigateToContent(contentId) {
        window.location.href = `movie-profile.html?id=${contentId}`;
    }

    updateResultsCount(total) {
        document.getElementById('resultsCount').textContent = `${total} results`;
    }

    updateActiveFilters() {
        const activeFilters = document.getElementById('activeFilters');
        const filters = [];

        if (this.currentSort !== 'popularity') {
            const sortLabel = {
                'rating': 'By Rating',
                'title': 'A-Z',
                'recent': 'Recently Added'
            }[this.currentSort] || this.currentSort;
            filters.push(`Sort: ${sortLabel}`);
        }

        if (this.currentWatchStatus !== 'all') {
            const statusLabel = this.currentWatchStatus === 'watched' ? 'Watched Only' : 'Unwatched Only';
            filters.push(statusLabel);
        }

        if (filters.length > 0) {
            activeFilters.innerHTML = filters.map(filter =>
                `<span class="filter-badge">${filter}</span>`
            ).join('');
            activeFilters.style.display = 'block';
        } else {
            activeFilters.style.display = 'none';
        }
    }

    showLoading() {
        document.getElementById('loadingIndicator').style.display = 'block';
    }

    hideLoading() {
        document.getElementById('loadingIndicator').style.display = 'none';
    }
}

// Global logout function
function netflixLogout() {
    localStorage.removeItem('netflix:isAuthenticated');
    localStorage.removeItem('netflix:email');
    localStorage.removeItem('netflix:profileId');
    localStorage.removeItem('netflix:profileName');
    window.location.href = 'index.html';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.genreBrowser = new GenreBrowser();
});
