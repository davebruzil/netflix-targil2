// Netflix UI Functions
// This file contains all UI rendering, DOM manipulation, and interaction functions

class NetflixUI {
    /**
     * Create a Netflix movie/show card HTML
     * @param {Object} item - Content item
     * @param {Set} likedItems - Set of liked item IDs
     * @returns {string} HTML string for the card
     */
    static createNetflixCard(item, likedItems) {
        const isLiked = likedItems.has(item.id);
        const likeCount = item.likes + (isLiked ? 1 : 0);
        const progress = item.progress || 0;
        const rating = item.rating && item.rating !== 'N/A' ? item.rating : '';
        const year = item.year ? item.year : '';
        const runtime = item.runtime || (item.category === 'Movie' ? '120 min' : '45 min');

        return `
            <div class="netflix-card" data-id="${item.id}" onclick="netflixFeed.navigateToMovie('${item.id}')">
                <div class="netflix-card-container">
                    <div class="netflix-card-image" style="background-image: url('${item.image}')">
                        ${progress > 0 ? `<div style="position: absolute; bottom: 0; left: 0; height: 4px; background: var(--netflix-red); width: ${progress}%; z-index: 2;"></div>` : ''}

                        <div class="netflix-card-overlay"></div>

                        <button class="netflix-like-btn ${isLiked ? 'liked' : ''}" onclick="netflixFeed.toggleLike('${item.id}', event)">
                            <span style="font-size: 16px;">
                                ${isLiked ? '♥' : '♡'}
                            </span>
                        </button>


                        <div class="netflix-card-info-overlay">
                            <div class="netflix-card-description">${item.description}</div>
                        </div>
                    </div>

                    <div class="netflix-card-info">
                        <div class="netflix-card-title">${item.title}</div>
                        <div class="netflix-card-meta">
                            <div class="netflix-card-details">
                                ${year ? `<span class="year">${year}</span>` : ''}
                                ${rating ? `<span class="rating">★ ${rating}</span>` : ''}
                                <span class="runtime">${runtime}</span>
                            </div>
                            <div class="netflix-card-genre">${item.genre || item.category}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render content for a specific section
     * @param {string} sliderId - ID of the slider element
     * @param {Array} sectionContent - Content array for the section
     * @param {Set} likedItems - Set of liked item IDs
     * @param {Set} myListItems - Set of My List item IDs (Dev #2 - Yaron)
     */
    static renderSection(sliderId, sectionContent, likedItems) {
        const slider = document.getElementById(sliderId);
        if (!slider) return;

        if (!sectionContent || sectionContent.length === 0) {
            slider.innerHTML = `
                <div style="color: #666; text-align: center; width: 100%; padding: 40px;">
                    <p>No content available</p>
                </div>
            `;
            return;
        }

        slider.innerHTML = sectionContent.map(item => this.createNetflixCard(item, likedItems)).join('');
    }

    /**
     * Show loading state for sections with progress
     * @param {Object} sections - Sections object
     * @param {number} progress - Loading progress (0-100)
     */
    static showLoadingState(sections, progress = 0) {
        Object.keys(sections).forEach(section => {
            const slider = document.getElementById(`${section}Slider`) || document.getElementById(`${section}WatchingSlider`);
            if (slider) {
                slider.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; color: #999;">
                        <div style="border: 3px solid #333; border-top: 3px solid var(--netflix-red); border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin-bottom: 15px;"></div>
                        <div style="margin-bottom: 10px;">Loading ${section} content...</div>
                        <div style="width: 200px; height: 4px; background: #333; border-radius: 2px; overflow: hidden;">
                            <div style="width: ${progress}%; height: 100%; background: var(--netflix-red); transition: width 0.3s ease;"></div>
                        </div>
                    </div>
                `;
            }
        });

        // Add loading animation CSS if not exists
        if (!document.getElementById('loadingStyles')) {
            const style = document.createElement('style');
            style.id = 'loadingStyles';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Hide loading state and show content
     */
    static hideLoadingState() {
        // Loading states are replaced by actual content in renderSection
    }

    /**
     * Show error state
     */
    static showErrorState() {
        console.error('Error loading Netflix content');
        const sections = document.querySelectorAll('.netflix-slider');
        sections.forEach(slider => {
            slider.innerHTML = `
                <div style="color: #e50914; text-align: center; width: 100%; padding: 40px;">
                    <h4>Oops! Something went wrong</h4>
                    <p>Please try refreshing the page</p>
                </div>
            `;
        });
    }

    /**
     * Handle search results rendering
     * @param {Array} allContent - All content to search through
     * @param {string} searchTerm - Search term
     * @param {boolean} isAlphaSorted - Whether content is alphabetically sorted
     * @param {Set} likedItems - Set of liked item IDs
     */
    static renderSearchResults(allContent, searchTerm, isAlphaSorted, likedItems) {
        let filtered = allContent.filter(item => {
            const titleMatch = item.title.toLowerCase().includes(searchTerm);
            const genreMatch = item.genre && item.genre.toLowerCase().includes(searchTerm);
            const descriptionMatch = item.description && item.description.toLowerCase().includes(searchTerm);
            const categoryMatch = item.category && item.category.toLowerCase().includes(searchTerm);

            return titleMatch || genreMatch || descriptionMatch || categoryMatch;
        });

        if (isAlphaSorted) {
            filtered.sort((a, b) => a.title.localeCompare(b.title));
        }

        const searchSlider = document.getElementById('searchResultsSlider');

        if (filtered.length === 0) {
            searchSlider.innerHTML = `
                <div style="color: #666; text-align: center; width: 100%; padding: 40px;">
                    <h4>No results found</h4>
                    <p>Try searching by title, genre, or description</p>
                </div>
            `;
            return;
        }

        searchSlider.innerHTML = filtered.map(item => this.createNetflixCard(item, likedItems)).join('');
    }

    /**
     * Toggle sort button state
     * @param {boolean} isAlphaSorted - Current sort state
     */
    static updateSortButton(isAlphaSorted) {
        const sortButton = document.getElementById('sortButton');
        if (!sortButton) return;

        if (isAlphaSorted) {
            sortButton.textContent = 'Sorted A-Z';
            sortButton.classList.add('active');
        } else {
            sortButton.textContent = 'Sort A-Z';
            sortButton.classList.remove('active');
        }
    }

    /**
     * Handle search visibility toggle
     * @param {string} searchTerm - Current search term
     */
    static toggleSearchVisibility(searchTerm) {
        const searchResultsSection = document.getElementById('searchResultsSection');
        const allSections = document.querySelectorAll('.netflix-row:not(#searchResultsSection)');

        if (searchTerm) {
            // Hide all normal sections
            allSections.forEach(section => {
                section.style.display = 'none';
            });

            // Show search results
            searchResultsSection.style.display = 'block';
        } else {
            // Show all normal sections
            allSections.forEach(section => {
                section.style.display = 'block';
            });

            // Hide search results
            searchResultsSection.style.display = 'none';
        }
    }

    /**
     * Calculate Netflix card width for scrolling
     * @returns {number} Card width including gap
     */
    static calculateCardWidth() {
        // Get actual card width from first visible card
        const firstCard = document.querySelector('.netflix-card');
        if (firstCard) {
            return firstCard.getBoundingClientRect().width + 8; // Include gap
        }
        return 308; // Fallback
    }

    /**
     * Update slider arrow states based on scroll position
     * @param {HTMLElement} slider - Slider element
     */
    static updateArrowStates(slider) {
        const container = slider.closest('.netflix-slider-container');
        if (!container) return;

        const prevArrow = container.querySelector('.slider-nav.prev');
        const nextArrow = container.querySelector('.slider-nav.next');

        if (!prevArrow || !nextArrow) return;

        // Check scroll boundaries
        const isAtStart = slider.scrollLeft <= 10; // Small threshold for precision
        const isAtEnd = slider.scrollLeft >= (slider.scrollWidth - slider.clientWidth - 10);

        // Update arrow visibility
        prevArrow.style.opacity = isAtStart ? '0.5' : '1';
        nextArrow.style.opacity = isAtEnd ? '0.5' : '1';
        prevArrow.style.pointerEvents = isAtStart ? 'none' : 'auto';
        nextArrow.style.pointerEvents = isAtEnd ? 'none' : 'auto';
    }

    /**
     * Smooth scroll to search input
     */
    static scrollToSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });

            // Focus on the search input after scrolling
            setTimeout(() => {
                searchInput.focus();
            }, 500);
        }
    }

    /**
     * Load and display user profile information
     * @param {string} profileId - Profile ID
     * @param {string} profileName - Profile name
     */
    static loadProfile(profileId, profileName) {
        const profileImage = document.getElementById('profileImage');
        const profileNameDisplay = document.getElementById('profileNameDisplay');

        // Get avatar from localStorage
        const profileAvatar = localStorage.getItem('netflix:profileAvatar');

        if (profileAvatar && profileImage) {
            profileImage.src = profileAvatar;
            profileImage.style.display = 'block';
            profileImage.onerror = function() {
                // Fallback to a random avatar if the image fails to load
                this.src = `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 20) + 1}`;
            };
        }

        if (profileNameDisplay) {
            profileNameDisplay.textContent = profileName;
        }
    }
}

// Export for global use
window.NetflixUI = NetflixUI;