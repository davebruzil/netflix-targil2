// Main Netflix Feed Application - Refactored with Modular Architecture
// This file now uses dedicated modules for better organization and maintainability

// Global content data storage
let CONTENT_DATA = [];

// Netflix Feed Application - Main Controller Class
class NetflixFeed {
    constructor() {
        this.allContent = [];
        this.likedItems = this.getLikedFromStorage();
        this.myListItems = new Set(); // Dev #2 - Yaron: My List tracking
        this.myListContent = []; // Dev #2 - Yaron: My List content array
        this.searchTerm = '';
        this.isAlphaSorted = false;
        this.sections = {
            continue: [],
            trending: [],
            movies: [],
            series: []
        };
        this.isLoading = false;

        this.init();
    }

    async init() {
        // Initialize authentication and profile
        this.checkAuth();
        this.loadProfile();
        this.setupEventListeners();

        // Load content with progressive loading
        await this.loadContentProgressively();
    }

    checkAuth() {
        const isLoggedIn = localStorage.getItem('netflix:isAuthenticated');
        if (!isLoggedIn) {
            window.location.href = 'index.html';
            return;
        }
    }

    loadProfile() {
        const profileId = localStorage.getItem('netflix:profileId');
        const profileName = localStorage.getItem('netflix:profileName') || 'User';
        NetflixUI.loadProfile(profileId, profileName);
    }

    async loadContentProgressively() {
        this.isLoading = true;
        NetflixUI.showLoadingState(this.sections);

        try {
            // Step 1: Load all content (with caching and parallel loading)
            await NetflixAPI.loadAllContent(this.sections, this.allContent);
            CONTENT_DATA = [...this.allContent];

            // Step 2: Load hero section immediately for better UX
            this.loadFeaturedHero();

            // Step 3: Load liked items and My List from backend (parallel)
            await Promise.all([
                this.loadLikedItemsFromBackend(),
                this.loadMyList() // Dev #2 - Yaron: Load My List
            ]);

            // Step 4: Render all sections
            this.renderAllSections();

            console.log('✅ Progressive loading completed');
        } catch (error) {
            console.error('❌ Error loading content:', error);
            NetflixUI.showErrorState();
        } finally {
            this.isLoading = false;
            NetflixUI.hideLoadingState();
        }
    }

    async loadAllContent() {
        this.isLoading = true;
        NetflixUI.showLoadingState(this.sections);

        try {
            await NetflixAPI.loadAllContent(this.sections, this.allContent);
            CONTENT_DATA = [...this.allContent];

            // Load liked items from backend
            await this.loadLikedItemsFromBackend();

            this.renderAllSections();
        } catch (error) {
            console.error('Error loading content:', error);
            NetflixUI.showErrorState();
        } finally {
            this.isLoading = false;
            NetflixUI.hideLoadingState();
        }
    }

    async loadLikedItemsFromBackend() {
        try {
            const likedContent = await NetflixAPI.getLikedContent();
            const likedIds = likedContent.map(item => item.id);
            this.likedItems = new Set(likedIds);

            // Also save to localStorage for offline access
            this.saveLikesToStorage();
        } catch (error) {
            console.warn('Failed to load likes from backend, using localStorage:', error);
            // Keep existing localStorage data if backend fails
        }
    }

    // ===== MY LIST FUNCTIONALITY (Dev #2 - Yaron) =====

    /**
     * Load My List from backend
     */
    async loadMyList() {
        try {
            console.log('📋 Loading My List...');
            this.myListContent = await NetflixAPI.getMyList();
            this.myListItems = new Set(this.myListContent.map(item => item.id));

            // Render My List section
            this.renderMyListSection();

            console.log(`✅ My List loaded: ${this.myListContent.length} items`);
        } catch (error) {
            console.warn('Failed to load My List:', error);
            this.myListContent = [];
            this.myListItems = new Set();
        }
    }

    /**
     * Render My List section
     */
    renderMyListSection() {
        const myListSection = document.getElementById('myListSection');
        if (!myListSection) return;

        if (this.myListContent.length > 0) {
            myListSection.style.display = 'block';
            NetflixUI.renderSection('myListSlider', this.myListContent, this.likedItems, this.myListItems);
        } else {
            myListSection.style.display = 'none';
        }
    }

    /**
     * Toggle My List for an item
     */
    async toggleMyList(itemId, event) {
        event.stopPropagation();

        const myListButton = event.currentTarget;
        const checkIcon = myListButton.querySelector('span');

        // Add animation class
        myListButton.classList.add('netflix-like-animation');
        setTimeout(() => {
            myListButton.classList.remove('netflix-like-animation');
        }, 300);

        const wasInList = this.myListItems.has(itemId);
        const newState = !wasInList;

        // Optimistic UI update
        if (newState) {
            this.myListItems.add(itemId);
            checkIcon.textContent = '✓';
            myListButton.classList.add('in-list');
            myListButton.title = 'Remove from My List';
        } else {
            this.myListItems.delete(itemId);
            checkIcon.textContent = '+';
            myListButton.classList.remove('in-list');
            myListButton.title = 'Add to My List';
        }

        // Update backend
        try {
            const result = await NetflixAPI.toggleMyList(itemId, newState);
            if (result) {
                // Reload My List from backend to get latest state
                await this.loadMyList();

                // Update all cards to reflect new state
                this.renderAllSections();

                console.log(`✅ ${newState ? 'Added to' : 'Removed from'} My List: ${itemId}`);
            } else {
                // Revert UI on backend failure
                if (wasInList) {
                    this.myListItems.add(itemId);
                    checkIcon.textContent = '✓';
                    myListButton.classList.add('in-list');
                } else {
                    this.myListItems.delete(itemId);
                    checkIcon.textContent = '+';
                    myListButton.classList.remove('in-list');
                }
            }
        } catch (error) {
            console.warn('My List toggle failed, reverting:', error);
            // Revert UI on error
            if (wasInList) {
                this.myListItems.add(itemId);
                checkIcon.textContent = '✓';
                myListButton.classList.add('in-list');
            } else {
                this.myListItems.delete(itemId);
                checkIcon.textContent = '+';
                myListButton.classList.remove('in-list');
            }
        }
    }

    loadFeaturedHero() {
        HeroSection.loadFeaturedHero(this.allContent);
    }

    setupEventListeners() {
        // Main search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase().trim();
                this.handleSearch();
            });
        }

        // Header search icon redirect
        const headerSearchIcon = document.getElementById('headerSearchIcon');
        if (headerSearchIcon) {
            headerSearchIcon.addEventListener('click', () => {
                NetflixUI.scrollToSearch();
            });
        }

        // Sort functionality
        const sortButton = document.getElementById('sortButton');
        if (sortButton) {
            sortButton.addEventListener('click', () => {
                this.toggleAlphaSort();
            });
        }

        // Global keyboard navigation for sliders on hover
        this.setupGlobalKeyboardNavigation();
    }

    setupGlobalKeyboardNavigation() {
        let currentHoveredSlider = null;

        // Track which slider container is being hovered
        document.addEventListener('mouseover', (e) => {
            const sliderContainer = e.target.closest('.netflix-slider-container');
            if (sliderContainer) {
                const slider = sliderContainer.querySelector('.netflix-slider');
                if (slider) {
                    currentHoveredSlider = slider.id;
                }
            }
        });

        // Clear hover state when mouse leaves slider area
        document.addEventListener('mouseout', (e) => {
            const sliderContainer = e.target.closest('.netflix-slider-container');
            if (sliderContainer) {
                const rect = sliderContainer.getBoundingClientRect();
                const mouseX = e.clientX;
                const mouseY = e.clientY;

                if (mouseX < rect.left || mouseX > rect.right ||
                    mouseY < rect.top || mouseY > rect.bottom) {
                    currentHoveredSlider = null;
                }
            }
        });

        // Global keyboard listener for arrow keys
        document.addEventListener('keydown', (e) => {
            if (currentHoveredSlider &&
                document.activeElement.tagName !== 'INPUT' &&
                document.activeElement.tagName !== 'TEXTAREA') {

                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    this.scrollSlider(currentHoveredSlider, 'left');
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    this.scrollSlider(currentHoveredSlider, 'right');
                }
            }
        });
    }

    scrollSlider(sliderId, direction) {
        const slider = document.getElementById(sliderId);
        if (!slider) return;

        const containerWidth = slider.clientWidth;
        const cardWidth = NetflixUI.calculateCardWidth();
        const cardsVisible = Math.floor(containerWidth / cardWidth);
        const scrollAmount = cardWidth * Math.max(1, cardsVisible - 1);

        NetflixUI.updateArrowStates(slider);

        const startPos = slider.scrollLeft;
        const targetPos = direction === 'left'
            ? Math.max(0, startPos - scrollAmount)
            : Math.min(slider.scrollWidth - slider.clientWidth, startPos + scrollAmount);

        slider.scrollTo({
            left: targetPos,
            behavior: 'smooth'
        });

        setTimeout(() => {
            NetflixUI.updateArrowStates(slider);
        }, 100);
    }

    async handleSearch() {
        NetflixUI.toggleSearchVisibility(this.searchTerm);

        if (this.searchTerm) {
            // Use backend search for better results
            try {
                const backendResults = await NetflixAPI.searchContentBackend(this.searchTerm, 20);
                if (backendResults.length > 0) {
                    // Use backend search results
                    NetflixUI.renderSearchResults(backendResults, this.searchTerm, this.isAlphaSorted, this.likedItems, this.myListItems);
                } else {
                    // Fallback to local TMDB search
                    NetflixUI.renderSearchResults(this.allContent, this.searchTerm, this.isAlphaSorted, this.likedItems, this.myListItems);
                }
            } catch (error) {
                console.warn('Backend search failed, using local search:', error);
                NetflixUI.renderSearchResults(this.allContent, this.searchTerm, this.isAlphaSorted, this.likedItems, this.myListItems);
            }
        } else {
            this.renderAllSections();
        }
    }

    toggleAlphaSort() {
        this.isAlphaSorted = !this.isAlphaSorted;
        NetflixUI.updateSortButton(this.isAlphaSorted);

        // Re-render current view
        if (this.searchTerm) {
            NetflixUI.renderSearchResults(this.allContent, this.searchTerm, this.isAlphaSorted, this.likedItems, this.myListItems);
        } else {
            this.renderAllSections();
        }
    }

    renderAllSections() {
        // Render My List section (Dev #2 - Yaron)
        this.renderMyListSection();

        // Apply sorting if enabled
        Object.keys(this.sections).forEach(section => {
            let content = this.sections[section];
            if (this.isAlphaSorted) {
                content = NetflixAPI.sortContent(content, this.isAlphaSorted);
            }
            NetflixUI.renderSection(`${section}Slider`, content, this.likedItems, this.myListItems);
        });

        // Handle continue watching section with different ID
        if (this.sections.continue) {
            let content = this.sections.continue;
            if (this.isAlphaSorted) {
                content = NetflixAPI.sortContent(content, this.isAlphaSorted);
            }
            NetflixUI.renderSection('continueWatchingSlider', content, this.likedItems, this.myListItems);
        }
    }

    async toggleLike(itemId, event) {
        event.stopPropagation();

        const likeButton = event.currentTarget;
        const heartIcon = likeButton.querySelector('span');

        // Add animation class
        likeButton.classList.add('netflix-like-animation');
        setTimeout(() => {
            likeButton.classList.remove('netflix-like-animation');
        }, 300);

        const wasLiked = this.likedItems.has(itemId);
        const newLikedState = !wasLiked;

        // Optimistic UI update
        if (newLikedState) {
            this.likedItems.add(itemId);
            heartIcon.textContent = '♥';
            likeButton.classList.add('liked');
        } else {
            this.likedItems.delete(itemId);
            heartIcon.textContent = '♡';
            likeButton.classList.remove('liked');
        }

        // Update backend
        try {
            const result = await NetflixAPI.toggleLike(itemId, newLikedState);
            if (result) {
                // Update like count from backend response
                const likeCountElements = document.querySelectorAll(`.like-count-${CSS.escape(itemId)}`);
                likeCountElements.forEach(el => {
                    el.textContent = result.totalLikes;
                });

                // Update local content data
                const item = this.allContent.find(item => item.id === itemId);
                if (item) {
                    item.likes = result.totalLikes;
                }
            } else {
                // Revert UI on backend failure
                if (wasLiked) {
                    this.likedItems.add(itemId);
                    heartIcon.textContent = '♥';
                    likeButton.classList.add('liked');
                } else {
                    this.likedItems.delete(itemId);
                    heartIcon.textContent = '♡';
                    likeButton.classList.remove('liked');
                }
            }
        } catch (error) {
            console.warn('Like toggle failed, reverting:', error);
            // Revert UI on error
            if (wasLiked) {
                this.likedItems.add(itemId);
                heartIcon.textContent = '♥';
                likeButton.classList.add('liked');
            } else {
                this.likedItems.delete(itemId);
                heartIcon.textContent = '♡';
                likeButton.classList.remove('liked');
            }
        }

        this.saveLikesToStorage();
    }

    navigateToMovie(movieId) {
        window.location.href = `movie-profile.html?id=${movieId}`;
    }

    // Method to simulate watching and update progress
    async simulateWatching(itemId, progressPercentage) {
        try {
            const result = await NetflixAPI.updateProgress(itemId, progressPercentage);
            if (result) {
                // Update local content data
                const item = this.allContent.find(item => item.id === itemId);
                if (item) {
                    item.progress = progressPercentage;
                }

                // Update UI progress bar
                this.updateProgressBar(itemId, progressPercentage);

                console.log(`Progress updated for ${itemId}: ${progressPercentage}%`);
            }
        } catch (error) {
            console.error('Failed to update progress:', error);
        }
    }

    updateProgressBar(itemId, progress) {
        const progressBars = document.querySelectorAll(`[data-content-id="${itemId}"] .netflix-progress-bar`);
        progressBars.forEach(bar => {
            if (bar) {
                bar.style.width = `${progress}%`;
            }
        });
    }

    getLikedFromStorage() {
        const stored = localStorage.getItem('netflix:likedItems');
        return stored ? new Set(JSON.parse(stored)) : new Set();
    }

    saveLikesToStorage() {
        localStorage.setItem('netflix:likedItems', JSON.stringify([...this.likedItems]));
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

// Initialize the feed when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.netflixFeed = new NetflixFeed();
});