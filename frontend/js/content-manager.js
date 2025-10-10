class ContentManager {
    constructor() {
        this.allContent = [];
        this.filteredContent = [];
        this.genres = new Set();

        this.contentGrid = document.getElementById('contentGrid');
        this.loadingState = document.getElementById('loadingState');
        this.emptyState = document.getElementById('emptyState');

        this.typeFilter = document.getElementById('typeFilter');
        this.genreFilter = document.getElementById('genreFilter');
        this.sortBy = document.getElementById('sortBy');
        this.searchInput = document.getElementById('searchInput');

        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadContent();
    }

    setupEventListeners() {
        this.typeFilter.addEventListener('change', () => this.applyFilters());
        this.genreFilter.addEventListener('change', () => this.applyFilters());
        this.sortBy.addEventListener('change', () => this.applyFilters());
        this.searchInput.addEventListener('input', () => this.applyFilters());
    }

    async loadContent() {
        try {
            this.showLoading();

            const response = await fetch('/api/content');
            const data = await response.json();

            if (data.success && data.data) {
                this.allContent = data.data;
                this.processContent();
                this.updateStats();
                this.populateGenreFilter();
                this.applyFilters();
            } else {
                this.showEmpty();
            }
        } catch (error) {
            console.error('Error loading content:', error);
            this.showEmpty();
        }
    }

    processContent() {
        // Extract unique genres
        this.allContent.forEach(item => {
            if (item.genre) {
                const genreList = item.genre.split(',').map(g => g.trim());
                genreList.forEach(g => this.genres.add(g));
            }
        });
    }

    updateStats() {
        const totalContent = this.allContent.length;
        const totalMovies = this.allContent.filter(c => c.type === 'movie').length;
        const totalShows = this.allContent.filter(c => c.type === 'series').length;
        const totalGenres = this.genres.size;

        document.getElementById('totalContent').textContent = totalContent;
        document.getElementById('totalMovies').textContent = totalMovies;
        document.getElementById('totalShows').textContent = totalShows;
        document.getElementById('totalGenres').textContent = totalGenres;
    }

    populateGenreFilter() {
        const sortedGenres = Array.from(this.genres).sort();
        sortedGenres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre;
            option.textContent = genre;
            this.genreFilter.appendChild(option);
        });
    }

    applyFilters() {
        let filtered = [...this.allContent];

        // Type filter
        const typeValue = this.typeFilter.value;
        if (typeValue) {
            filtered = filtered.filter(c => c.type === typeValue);
        }

        // Genre filter
        const genreValue = this.genreFilter.value;
        if (genreValue) {
            filtered = filtered.filter(c => {
                const genres = c.genre.split(',').map(g => g.trim());
                return genres.includes(genreValue);
            });
        }

        // Search filter
        const searchValue = this.searchInput.value.toLowerCase();
        if (searchValue) {
            filtered = filtered.filter(c =>
                c.title.toLowerCase().includes(searchValue) ||
                (c.description && c.description.toLowerCase().includes(searchValue)) ||
                (c.cast && c.cast.toLowerCase().includes(searchValue)) ||
                (c.director && c.director.toLowerCase().includes(searchValue))
            );
        }

        // Sort
        const sortValue = this.sortBy.value;
        filtered.sort((a, b) => {
            switch (sortValue) {
                case 'newest':
                    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                case 'oldest':
                    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0);
                default:
                    return 0;
            }
        });

        this.filteredContent = filtered;
        this.renderContent();
    }

    renderContent() {
        if (this.filteredContent.length === 0) {
            this.showEmpty();
            return;
        }

        this.hideLoading();
        this.hideEmpty();
        this.contentGrid.style.display = 'grid';
        this.contentGrid.innerHTML = '';

        this.filteredContent.forEach(content => {
            const card = this.createContentCard(content);
            this.contentGrid.appendChild(card);
        });
    }

    createContentCard(content) {
        const card = document.createElement('div');
        card.className = 'content-card';

        const imageUrl = content.image || 'images/better.png';
        const typeIcon = content.type === 'movie' ? 'fa-film' : 'fa-tv';
        const year = content.year || 'N/A';
        const rating = content.rating || 'N/A';
        const runtime = content.runtime || 'N/A';

        card.innerHTML = `
            <img src="${imageUrl}" alt="${content.title}" onerror="this.src='images/better.png'">
            <div class="content-card-body">
                <div class="content-card-title">
                    <i class="fas ${typeIcon} me-2"></i>${content.title}
                </div>
                <div class="content-card-meta">
                    ${year} • ${rating} • ${runtime}
                </div>
                <div class="content-card-description">
                    ${content.description || 'No description available'}
                </div>
                <div class="content-card-actions">
                    <button class="btn-play" onclick="contentManager.playContent('${content._id}')">
                        <i class="fas fa-play me-2"></i>Play
                    </button>
                    <button class="btn-info" onclick="contentManager.viewDetails('${content._id}')">
                        <i class="fas fa-info-circle me-2"></i>Info
                    </button>
                </div>
            </div>
        `;

        return card;
    }

    playContent(contentId) {
        window.location.href = `/player.html?id=${contentId}`;
    }

    viewDetails(contentId) {
        const content = this.allContent.find(c => c._id === contentId);
        if (content) {
            this.showDetailsModal(content);
        }
    }

    showDetailsModal(content) {
        const modal = `
            <div class="modal fade" id="detailsModal" tabindex="-1">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content" style="background: #2f2f2f; color: white;">
                        <div class="modal-header" style="border-bottom: 1px solid #444;">
                            <h5 class="modal-title">${content.title}</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-4">
                                    <img src="${content.image || 'images/better.png'}"
                                         class="img-fluid rounded"
                                         alt="${content.title}"
                                         onerror="this.src='images/better.png'">
                                </div>
                                <div class="col-md-8">
                                    <p><strong>Type:</strong> ${content.type === 'movie' ? 'Movie' : 'TV Show'}</p>
                                    <p><strong>Year:</strong> ${content.year || 'N/A'}</p>
                                    <p><strong>Rating:</strong> ${content.rating || 'N/A'}</p>
                                    <p><strong>Runtime:</strong> ${content.runtime || 'N/A'}</p>
                                    <p><strong>Genre:</strong> ${content.genre || 'N/A'}</p>
                                    <p><strong>Director:</strong> ${content.director || 'N/A'}</p>
                                    <p><strong>Cast:</strong> ${content.cast || 'N/A'}</p>
                                    <p><strong>Description:</strong></p>
                                    <p>${content.description || 'No description available'}</p>
                                    ${content.videoFile ? `<p><strong>Video File:</strong> ${content.videoFile}</p>` : ''}
                                    <p><strong>Added:</strong> ${new Date(content.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer" style="border-top: 1px solid #444;">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-play" onclick="contentManager.playContent('${content._id}')">
                                <i class="fas fa-play me-2"></i>Play
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('detailsModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modal);

        // Show modal
        const bsModal = new bootstrap.Modal(document.getElementById('detailsModal'));
        bsModal.show();

        // Cleanup on close
        document.getElementById('detailsModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
    }

    showLoading() {
        this.loadingState.style.display = 'block';
        this.contentGrid.style.display = 'none';
        this.emptyState.style.display = 'none';
    }

    hideLoading() {
        this.loadingState.style.display = 'none';
    }

    showEmpty() {
        this.loadingState.style.display = 'none';
        this.contentGrid.style.display = 'none';
        this.emptyState.style.display = 'block';
    }

    hideEmpty() {
        this.emptyState.style.display = 'none';
    }
}

// Initialize content manager
let contentManager;
document.addEventListener('DOMContentLoaded', () => {
    contentManager = new ContentManager();
});
