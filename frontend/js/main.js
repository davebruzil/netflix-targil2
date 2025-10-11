// Main Netflix Feed Application - Refactored with Modular Architecture
// This file now uses dedicated modules for better organization and maintainability

// Global content data storage
let CONTENT_DATA = [];

// Netflix Feed Application - Main Controller Class
class NetflixFeed {
    constructor() {
        this.allContent = [];
        this.likedItems = this.getLikedFromStorage();
        this.searchTerm = '';
        this.isAlphaSorted = false;
        this.sections = {
            continue: [],
            trending: [],
            movies: [],
            series: []
        };
        this.dynamicSections = {}; // Dev #3 - Alon: Dynamic content sections
        this.genreSections = {}; // Dev #3 - Alon: Genre-based sections
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

            // Step 2: Load uploaded content from backend and merge with TMDB content
            await this.loadUploadedContent();

            // Step 3: Load hero section immediately for better UX
            this.loadFeaturedHero();

            // Step 4: Load liked items, recommendations, continue watching, and dynamic sections from backend (parallel)
            await Promise.all([
                this.loadLikedItemsFromBackend(),
                this.loadRecommendations(), // Dev #3 - Alon: Load personalized recommendations
                this.loadTrendingContent(), // Dev #3 - Alon: Load trending content
                this.loadContinueWatching(), // Load continue watching from backend
                this.loadDynamicSections() // Dev #3 - Alon: Load dynamic content sections
            ]);

            // Step 5: Render all sections
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

    /**
     * Load continue watching content from backend
     */
    async loadContinueWatching() {
        try {
            const profileId = localStorage.getItem('netflix:profileId');
            if (!profileId) {
                console.log('No profile ID found, skipping continue watching');
                return;
            }

            console.log('▶️ Loading continue watching...');
            const continueWatching = await NetflixAPI.getContinueWatching(profileId);

            if (continueWatching.length > 0) {
                // Update continue watching section
                this.sections.continue = continueWatching;
                console.log(`✅ Loaded ${continueWatching.length} items in continue watching`);
            } else {
                console.log('No continue watching content available');
                this.sections.continue = [];
            }
        } catch (error) {
            console.warn('Failed to load continue watching:', error);
            this.sections.continue = [];
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

    /**
     * Load uploaded content from backend and merge with existing content
     */
    async loadUploadedContent() {
        try {
            console.log('📤 Loading uploaded content...');
            const uploadedContent = await NetflixAPI.getAllUploadedContent();

            if (uploadedContent.length > 0) {
                console.log(`✅ Loaded ${uploadedContent.length} uploaded items`);

                // Add uploaded content to allContent array
                uploadedContent.forEach(item => {
                    this.allContent.push(item);
                });

                // Add uploaded content to a dedicated section
                if (!this.sections.uploaded) {
                    this.sections.uploaded = [];
                }
                this.sections.uploaded = uploadedContent;

                // Update global content data
                CONTENT_DATA = [...this.allContent];
            } else {
                console.log('No uploaded content found');
            }
        } catch (error) {
            console.warn('Failed to load uploaded content:', error);
        }
    }

    // ===== RECOMMENDATION FUNCTIONALITY (Dev #3 - Alon) =====

    /**
     * Load personalized recommendations for the current profile
     */
    async loadRecommendations() {
        try {
            const profileId = localStorage.getItem('netflix:profileId');
            if (!profileId) {
                console.log('No profile ID found, skipping recommendations');
                return;
            }

            console.log('🎯 Loading personalized recommendations...');
            const recommendations = await NetflixAPI.getRecommendations(profileId, 10);
            
            if (recommendations.length > 0) {
                // Add recommendations to sections
                this.sections.recommendations = recommendations;
                console.log(`✅ Loaded ${recommendations.length} personalized recommendations`);
            } else {
                console.log('No recommendations available yet');
            }
        } catch (error) {
            console.warn('Failed to load recommendations:', error);
            this.sections.recommendations = [];
        }
    }

    /**
     * Load trending content
     */
    async loadTrendingContent() {
        try {
            console.log('🔥 Loading trending content...');
            const trendingContent = await NetflixAPI.getTrendingContent(10);
            
            if (trendingContent.length > 0) {
                // Update trending section with backend data
                this.sections.trending = trendingContent;
                console.log(`✅ Loaded ${trendingContent.length} trending items`);
            } else {
                console.log('No trending content available');
            }
        } catch (error) {
            console.warn('Failed to load trending content:', error);
        }
    }

    /**
     * Load dynamic content sections (Dev #3 - Alon)
     */
    async loadDynamicSections() {
        try {
            console.log('🎬 Loading dynamic content sections...');
            
            // Load core dynamic sections
            const sectionTypes = ['trending', 'newReleases', 'topRated', 'continueWatching'];
            const dynamicSections = await NetflixAPI.loadDynamicSections(sectionTypes);
            
            // Store dynamic sections
            this.dynamicSections = dynamicSections;
            
            // Load genre-based sections
            await this.loadGenreSections();
            
            console.log('✅ Dynamic sections loaded successfully');
        } catch (error) {
            console.warn('Failed to load dynamic sections:', error);
            this.dynamicSections = {};
        }
    }

    /**
     * Load genre-based sections (Dev #3 - Alon)
     */
    async loadGenreSections() {
        try {
            console.log('🎭 Loading genre-based sections...');
            
            // Get available genres
            const genres = await NetflixAPI.getAvailableGenres();
            
            if (genres.length > 0) {
                // Load top 4 genres for homepage
                const topGenres = genres.slice(0, 4);
                
                const genrePromises = topGenres.map(async (genre) => {
                    const genreData = await NetflixAPI.getGenreSection(genre, 8);
                    return { genre, data: genreData };
                });
                
                const genreSections = await Promise.all(genrePromises);
                
                // Store genre sections
                this.genreSections = {};
                genreSections.forEach(({ genre, data }) => {
                    if (data.content.length > 0) {
                        this.genreSections[genre.toLowerCase()] = data;
                    }
                });
                
                console.log(`✅ Loaded ${Object.keys(this.genreSections).length} genre sections`);
            }
        } catch (error) {
            console.warn('Failed to load genre sections:', error);
            this.genreSections = {};
        }
    }

    /**
     * Render recommendations section (Dev #3 - Alon)
     */
    renderRecommendationsSection() {
        const recommendationsSection = document.getElementById('recommendationsSection');
        if (!recommendationsSection) return;

        if (this.sections.recommendations && this.sections.recommendations.length > 0) {
            recommendationsSection.style.display = 'block';
            NetflixUI.renderSection('recommendationsSlider', this.sections.recommendations, this.likedItems);
        } else {
            recommendationsSection.style.display = 'none';
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
                    NetflixUI.renderSearchResults(backendResults, this.searchTerm, this.isAlphaSorted, this.likedItems);
                } else {
                    // Fallback to local TMDB search
                    NetflixUI.renderSearchResults(this.allContent, this.searchTerm, this.isAlphaSorted, this.likedItems);
                }
            } catch (error) {
                console.warn('Backend search failed, using local search:', error);
                NetflixUI.renderSearchResults(this.allContent, this.searchTerm, this.isAlphaSorted, this.likedItems);
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
            NetflixUI.renderSearchResults(this.allContent, this.searchTerm, this.isAlphaSorted, this.likedItems);
        } else {
            this.renderAllSections();
        }
    }

    renderAllSections() {
        // Render uploaded content section
        this.renderUploadedSection();

        // Render recommendations section (Dev #3 - Alon)
        this.renderRecommendationsSection();

        // Render dynamic sections (Dev #3 - Alon)
        this.renderDynamicSections();

        // Apply sorting if enabled
        Object.keys(this.sections).forEach(section => {
            // Skip recommendations and uploaded as they're handled separately
            if (section === 'recommendations' || section === 'uploaded') return;

            let content = this.sections[section];
            if (this.isAlphaSorted) {
                content = NetflixAPI.sortContent(content, this.isAlphaSorted);
            }
            NetflixUI.renderSection(`${section}Slider`, content, this.likedItems);
        });

        // Handle continue watching section with different ID
        if (this.sections.continue) {
            let content = this.sections.continue;
            if (this.isAlphaSorted) {
                content = NetflixAPI.sortContent(content, this.isAlphaSorted);
            }
            NetflixUI.renderSection('continueWatchingSlider', content, this.likedItems);
        }
    }

    /**
     * Render uploaded content section
     */
    renderUploadedSection() {
        const uploadedSection = document.getElementById('uploadedSection');
        if (!uploadedSection) return;

        if (this.sections.uploaded && this.sections.uploaded.length > 0) {
            uploadedSection.style.display = 'block';
            NetflixUI.renderSection('uploadedSlider', this.sections.uploaded, this.likedItems);
        } else {
            uploadedSection.style.display = 'none';
        }
    }

    /**
     * Render dynamic content sections (Dev #3 - Alon)
     */
    renderDynamicSections() {
        // Render core dynamic sections
        if (this.dynamicSections) {
            Object.keys(this.dynamicSections).forEach(sectionType => {
                const sectionData = this.dynamicSections[sectionType];
                if (sectionData && sectionData.content && sectionData.content.length > 0) {
                    this.renderDynamicSection(sectionType, sectionData);
                }
            });
        }

        // Render genre-based sections
        if (this.genreSections) {
            Object.keys(this.genreSections).forEach(genre => {
                const genreData = this.genreSections[genre];
                if (genreData && genreData.content && genreData.content.length > 0) {
                    this.renderDynamicSection(`genre-${genre}`, genreData);
                }
            });
        }
    }

    /**
     * Render a single dynamic section (Dev #3 - Alon)
     */
    renderDynamicSection(sectionId, sectionData) {
        // Create section container if it doesn't exist
        let sectionContainer = document.getElementById(`${sectionId}Section`);
        if (!sectionContainer) {
            sectionContainer = this.createDynamicSectionContainer(sectionId, sectionData.section);
            // If container creation failed (undefined title), skip this section
            if (!sectionContainer) {
                return;
            }
        }

        // Render the content
        const sliderId = `${sectionId}Slider`;
        NetflixUI.renderSection(sliderId, sectionData.content, this.likedItems);

        // Show the section
        sectionContainer.style.display = 'block';
    }

    /**
     * Create dynamic section container (Dev #3 - Alon)
     */
    createDynamicSectionContainer(sectionId, sectionTitle) {
        // Skip if sectionTitle is undefined/null/empty
        if (!sectionTitle || sectionTitle === 'undefined') {
            console.warn(`Skipping section with undefined title: ${sectionId}`);
            return null;
        }

        const netflixContentContainer = document.querySelector('.netflix-content-container');
        if (!netflixContentContainer) return null;

        const sectionHTML = `
            <div class="netflix-row" id="${sectionId}Section">
                <h3 class="row-title">${sectionTitle}</h3>
                <div class="netflix-slider-container" role="region" aria-label="${sectionTitle}">
                    <button class="slider-nav prev" onclick="netflixFeed.scrollSlider('${sectionId}Slider', 'left')"
                            aria-label="Scroll to previous items" tabindex="0">‹</button>
                    <div class="netflix-slider" id="${sectionId}Slider" role="list" tabindex="0"
                         aria-label="${sectionTitle}">
                        <!-- Content will be loaded here -->
                    </div>
                    <button class="slider-nav next" onclick="netflixFeed.scrollSlider('${sectionId}Slider', 'right')"
                            aria-label="Scroll to next items" tabindex="0">›</button>
                </div>
            </div>
        `;

        netflixContentContainer.insertAdjacentHTML('beforeend', sectionHTML);
        return document.getElementById(`${sectionId}Section`);
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