// TMDB API Configuration - Using environment config
const API_CONFIG = {
    get TMDB_BASE_URL() { return window.AppConfig?.get('TMDB_BASE_URL') || 'https://api.themoviedb.org/3'; },
    get API_KEY() { return window.AppConfig?.get('TMDB_API_KEY') || ''; },
    get IMAGE_BASE_URL() { return window.AppConfig?.get('IMAGE_BASE_URL') || 'https://image.tmdb.org/t/p/w500'; },
    get BACKDROP_BASE_URL() { return window.AppConfig?.get('BACKDROP_BASE_URL') || 'https://image.tmdb.org/t/p/w1280'; }
};

// Popular movie/TV show IDs from TMDB
const CONTENT_QUERIES = {
    continue: {
        movies: [550, 680, 155], // Fight Club, Pulp Fiction, The Dark Knight
        tv: [66732, 1399, 1396] // Stranger Things, Game of Thrones, Breaking Bad
    },
    trending: {
        movies: [438631, 634649, 505642], // Dune, Spider-Man No Way Home, Black Panther
        tv: [119051, 85552, 82856] // Wednesday, Euphoria, The Boys
    },
    movies: {
        movies: [361743, 791373, 460465, 581389] // Top Gun Maverick, Don't Look Up, Red Notice, Space Jam
    },
    series: {
        tv: [71912, 69050, 87108, 103768] // The Witcher, Ozark, Squid Game, House of the Dragon
    }
};

// Global content data storage
let CONTENT_DATA = [];

// Netflix Feed Application with Horizontal Scrolling
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
        this.isLoading = false;

        this.init();
    }

    async fetchTMDBData(id, type = 'movie') {
        try {
            const url = `${API_CONFIG.TMDB_BASE_URL}/${type}/${id}?api_key=${API_CONFIG.API_KEY}`;
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
                image: data.poster_path ? `${API_CONFIG.IMAGE_BASE_URL}${data.poster_path}` : 'https://via.placeholder.com/500x750/333/fff?text=No+Image',
                backdrop: data.backdrop_path ? `${API_CONFIG.BACKDROP_BASE_URL}${data.backdrop_path}` : null,
                year: data.release_date ? new Date(data.release_date).getFullYear() :
                      data.first_air_date ? new Date(data.first_air_date).getFullYear() : null,
                rating: data.vote_average ? data.vote_average.toFixed(1) : null,
                genre: data.genres ? data.genres.map(g => g.name).slice(0, 3).join(', ') : null,
                runtime: data.runtime ? `${data.runtime} min` :
                        (data.episode_run_time && data.episode_run_time.length > 0) ? `${data.episode_run_time[0]} min` :
                        (type === 'movie' ? '120 min' : '45 min'),
                popularity: data.popularity || 0,
                likes: Math.floor(Math.random() * 3000) + 500, // Random likes for demo
                progress: 0 // Default progress
            };
        } catch (error) {
            console.error(`Error fetching TMDB data for ${type} ${id}:`, error);
            return null;
        }
    }

    async loadAllContent() {
        this.isLoading = true;
        this.showLoadingState();

        try {
            // Load content for each section
            for (const [section, queries] of Object.entries(CONTENT_QUERIES)) {
                const sectionContent = [];

                // Handle movies
                if (queries.movies) {
                    for (const movieId of queries.movies) {
                        const movieData = await this.fetchTMDBData(movieId, 'movie');
                        if (movieData) {
                            movieData.section = section;
                            // Add random progress for continue watching section
                            if (section === 'continue') {
                                movieData.progress = Math.floor(Math.random() * 90) + 10;
                            }
                            sectionContent.push(movieData);
                            this.allContent.push(movieData);
                        }
                    }
                }

                // Handle TV shows
                if (queries.tv) {
                    for (const tvId of queries.tv) {
                        const tvData = await this.fetchTMDBData(tvId, 'tv');
                        if (tvData) {
                            tvData.section = section;
                            // Add random progress for continue watching section
                            if (section === 'continue') {
                                tvData.progress = Math.floor(Math.random() * 90) + 10;
                            }
                            sectionContent.push(tvData);
                            this.allContent.push(tvData);
                        }
                    }
                }

                this.sections[section] = sectionContent;
            }

            // Update global content data
            CONTENT_DATA = [...this.allContent];

        } catch (error) {
            console.error('Error loading content:', error);
            this.showErrorState();
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    showLoadingState() {
        // Show loading spinner for each section
        Object.keys(this.sections).forEach(section => {
            const slider = document.getElementById(`${section}Slider`) || document.getElementById(`${section}WatchingSlider`);
            if (slider) {
                slider.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; padding: 40px; color: #999;">
                        <div style="border: 3px solid #333; border-top: 3px solid var(--netflix-red); border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin-right: 15px;"></div>
                        Loading ${section} content...
                    </div>
                `;
            }
        });
    }

    hideLoadingState() {
        this.renderAllSections();
        // Setup enhanced slider functionality after content is loaded
        setTimeout(() => {
            this.setupSliderEnhancements();
        }, 100);
    }

    showErrorState() {
        Object.keys(this.sections).forEach(section => {
            const slider = document.getElementById(`${section}Slider`) || document.getElementById(`${section}WatchingSlider`);
            if (slider) {
                slider.innerHTML = `
                    <div style="color: #999; text-align: center; padding: 40px;">
                        <p>Error loading ${section} content. Please try again later.</p>
                    </div>
                `;
            }
        });
    }

    async init() {
        this.loadProfile();
        this.setupEventListeners();

        // Load content from API
        await this.loadAllContent();

        // Load featured hero movie
        this.loadFeaturedHero();
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
        const profileName = localStorage.getItem('netflix:profileName') || 'User';
        const profileImage = document.getElementById('profileImage');
        const profileNameDisplay = document.getElementById('profileNameDisplay');

        if (profileId && profileAvatars[profileId] && profileImage) {
            profileImage.src = profileAvatars[profileId];
            profileImage.style.display = 'block';
        }

        if (profileNameDisplay) {
            profileNameDisplay.textContent = profileName;
        }
    }

    setupEventListeners() {
        // Main search functionality
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase().trim();
            this.handleSearch();
        });

        // Header search icon redirect
        const headerSearchIcon = document.getElementById('headerSearchIcon');
        if (headerSearchIcon) {
            headerSearchIcon.addEventListener('click', () => {
                this.scrollToSearch();
            });
        }

        // Sort functionality
        const sortButton = document.getElementById('sortButton');
        sortButton.addEventListener('click', () => {
            this.toggleAlphaSort();
        });

        // Global keyboard navigation for sliders on hover
        this.setupGlobalKeyboardNavigation();
    }

    scrollToSearch() {
        // Scroll to the main search input
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
                // Check if mouse is really leaving the container
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
            // Only activate when hovering over a slider and not typing in an input
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

        // Calculate dynamic scroll amount based on visible area
        const containerWidth = slider.clientWidth;
        const cardWidth = this.calculateCardWidth();
        const cardsVisible = Math.floor(containerWidth / cardWidth);
        const scrollAmount = cardWidth * Math.max(1, cardsVisible - 1); // Scroll with 1 card overlap

        // Update arrow states immediately
        this.updateArrowStates(slider);

        // Perform scroll with smooth animation
        const startPos = slider.scrollLeft;
        const targetPos = direction === 'left'
            ? Math.max(0, startPos - scrollAmount)
            : Math.min(slider.scrollWidth - slider.clientWidth, startPos + scrollAmount);

        slider.scrollTo({
            left: targetPos,
            behavior: 'smooth'
        });

        // Update arrow states after scroll
        setTimeout(() => {
            this.updateArrowStates(slider);
        }, 100);
    }

    calculateCardWidth() {
        // Get actual card width from first visible card
        const firstCard = document.querySelector('.netflix-card');
        if (firstCard) {
            return firstCard.getBoundingClientRect().width + 8; // Include gap
        }
        return 308; // Fallback
    }

    updateArrowStates(slider) {
        const container = slider.closest('.netflix-slider-container');
        if (!container) return;

        const prevArrow = container.querySelector('.slider-nav.prev');
        const nextArrow = container.querySelector('.slider-nav.next');

        if (!prevArrow || !nextArrow) return;

        // Check scroll boundaries
        const isAtStart = slider.scrollLeft <= 10; // Small threshold for precision
        const isAtEnd = slider.scrollLeft >= slider.scrollWidth - slider.clientWidth - 10;

        // Update arrow states
        prevArrow.disabled = isAtStart;
        nextArrow.disabled = isAtEnd;

        // Add visual feedback
        if (isAtStart) {
            prevArrow.style.opacity = '0.3';
        } else {
            prevArrow.style.opacity = '';
        }

        if (isAtEnd) {
            nextArrow.style.opacity = '0.3';
        } else {
            nextArrow.style.opacity = '';
        }
    }


    setupSliderEnhancements() {
        // Enhance existing sliders
        const sliders = document.querySelectorAll('.netflix-slider');

        sliders.forEach(slider => {
            // Add scroll event listeners
            slider.addEventListener('scroll', () => {
                this.updateArrowStates(slider);
            });

            // Add keyboard navigation
            slider.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    this.scrollSlider(slider.id, 'left');
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    this.scrollSlider(slider.id, 'right');
                }
            });

            // Initialize arrow states
            this.updateArrowStates(slider);

            // Add resize observer to handle responsive changes
            if (window.ResizeObserver) {
                const resizeObserver = new ResizeObserver(() => {
                    this.updateArrowStates(slider);
                });
                resizeObserver.observe(slider);
            }
        });

        // Add touch gesture support for mobile
        this.addTouchSupport();
    }

    addTouchSupport() {
        const sliders = document.querySelectorAll('.netflix-slider');

        sliders.forEach(slider => {
            let isDown = false;
            let startX;
            let scrollLeft;
            let velocity = 0;
            let lastMove = 0;
            let animationFrame;

            // Mouse events for desktop drag scrolling
            slider.addEventListener('mousedown', (e) => {
                if (e.target.closest('.netflix-card')) return; // Don't interfere with card interactions
                isDown = true;
                slider.style.cursor = 'grabbing';
                startX = e.pageX - slider.offsetLeft;
                scrollLeft = slider.scrollLeft;
                velocity = 0;
                lastMove = Date.now();
            });

            slider.addEventListener('mouseleave', () => {
                isDown = false;
                slider.style.cursor = '';
            });

            slider.addEventListener('mouseup', () => {
                isDown = false;
                slider.style.cursor = '';

                // Add momentum scrolling
                if (Math.abs(velocity) > 1) {
                    const momentum = () => {
                        velocity *= 0.95; // Friction
                        slider.scrollLeft += velocity;

                        if (Math.abs(velocity) > 0.5) {
                            animationFrame = requestAnimationFrame(momentum);
                        }
                    };
                    momentum();
                }
            });

            slider.addEventListener('mousemove', (e) => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - slider.offsetLeft;
                const walk = (x - startX) * 1.5; // Scroll speed multiplier
                const now = Date.now();
                velocity = (walk - (slider.scrollLeft - scrollLeft)) / (now - lastMove);
                lastMove = now;
                slider.scrollLeft = scrollLeft - walk;
            });

            // Touch events for mobile
            let touchStartX = 0;
            let touchScrollLeft = 0;

            slider.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
                touchScrollLeft = slider.scrollLeft;
                // Cancel any ongoing momentum
                if (animationFrame) {
                    cancelAnimationFrame(animationFrame);
                }
            }, { passive: true });

            slider.addEventListener('touchmove', (e) => {
                if (!touchStartX) return;
                const touchX = e.touches[0].clientX;
                const walk = touchStartX - touchX;
                slider.scrollLeft = touchScrollLeft + walk;
            }, { passive: true });

            slider.addEventListener('touchend', () => {
                touchStartX = 0;
            }, { passive: true });
        });
    }

    handleSearch() {
        const searchResultsSection = document.getElementById('searchResultsSection');
        const allSections = document.querySelectorAll('.netflix-row:not(#searchResultsSection)');

        if (this.searchTerm) {
            // Hide all normal sections
            allSections.forEach(section => {
                section.style.display = 'none';
            });

            // Show search results
            searchResultsSection.style.display = 'block';
            this.renderSearchResults();
        } else {
            // Show all normal sections
            allSections.forEach(section => {
                section.style.display = 'block';
            });

            // Hide search results
            searchResultsSection.style.display = 'none';
            this.renderAllSections();
        }
    }

    renderSearchResults() {
        let filtered = this.allContent.filter(item => {
            const titleMatch = item.title.toLowerCase().includes(this.searchTerm);
            const genreMatch = item.genre && item.genre.toLowerCase().includes(this.searchTerm);
            const descriptionMatch = item.description && item.description.toLowerCase().includes(this.searchTerm);
            const categoryMatch = item.category && item.category.toLowerCase().includes(this.searchTerm);

            return titleMatch || genreMatch || descriptionMatch || categoryMatch;
        });

        if (this.isAlphaSorted) {
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

        searchSlider.innerHTML = filtered.map(item => this.createNetflixCard(item)).join('');
    }

    toggleAlphaSort() {
        this.isAlphaSorted = !this.isAlphaSorted;
        const sortButton = document.getElementById('sortButton');

        if (this.isAlphaSorted) {
            sortButton.textContent = 'Sorted A-Z';
            sortButton.classList.add('active');
        } else {
            sortButton.textContent = 'Sort A-Z';
            sortButton.classList.remove('active');
        }

        // Re-render current view
        if (this.searchTerm) {
            this.renderSearchResults();
        } else {
            this.renderAllSections();
        }
    }

    createNetflixCard(item) {
        const isLiked = this.likedItems.has(item.id);
        const likeCount = item.likes + (isLiked ? 1 : 0);
        const progress = item.progress || 0;
        const rating = item.rating && item.rating !== 'N/A' ? item.rating : '';
        const year = item.year ? item.year : '';
        const runtime = item.runtime || (item.category === 'Movie' ? '120 min' : '45 min'); // Default runtime

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
                                ${year ? `<span class="netflix-year">${year}</span>` : ''}
                                ${runtime ? `<span class="netflix-runtime">${runtime}</span>` : ''}
                                ${rating ? `<span class="netflix-rating">${rating}</span>` : ''}
                            </div>
                            ${item.genre ? `<div class="netflix-genres">${item.genre}</div>` : ''}
                            <div class="netflix-card-likes">
                                <span class="like-count-${item.id}">${likeCount} likes</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderSection(sectionId, content) {
        const slider = document.getElementById(sectionId);
        if (!slider) return;

        let sectionContent = [...content];
        if (this.isAlphaSorted) {
            sectionContent.sort((a, b) => a.title.localeCompare(b.title));
        }

        slider.innerHTML = sectionContent.map(item => this.createNetflixCard(item)).join('');
    }

    renderAllSections() {
        this.renderSection('continueWatchingSlider', this.sections.continue);
        this.renderSection('trendingSlider', this.sections.trending);
        this.renderSection('moviesSlider', this.sections.movies);
        this.renderSection('seriesSlider', this.sections.series);
    }

    toggleLike(itemId, event) {
        event.stopPropagation();

        const likeButton = event.currentTarget;
        const heartIcon = likeButton.querySelector('span');

        // Add animation class
        likeButton.classList.add('netflix-like-animation');
        setTimeout(() => {
            likeButton.classList.remove('netflix-like-animation');
        }, 300);

        if (this.likedItems.has(itemId)) {
            this.likedItems.delete(itemId);
            heartIcon.textContent = '♡';
            likeButton.classList.remove('liked');
        } else {
            this.likedItems.add(itemId);
            heartIcon.textContent = '♥';
            likeButton.classList.add('liked');
        }

        // Update like count
        const item = this.allContent.find(item => item.id === itemId);
        if (item) {
            const newCount = item.likes + (this.likedItems.has(itemId) ? 1 : 0);
            const likeCountElements = document.querySelectorAll(`.like-count-${CSS.escape(itemId)}`);
            likeCountElements.forEach(el => {
                el.textContent = newCount;
            });
        }

        // Save to localStorage
        this.saveLikesToStorage();
    }

    getLikedFromStorage() {
        const stored = localStorage.getItem('netflix:likedItems');
        return stored ? new Set(JSON.parse(stored)) : new Set();
    }

    saveLikesToStorage() {
        localStorage.setItem('netflix:likedItems', JSON.stringify([...this.likedItems]));
    }

    navigateToMovie(movieId) {
        window.location.href = `movie-profile.html?id=${movieId}`;
    }

    loadFeaturedHero() {
        // Wait a bit to ensure content is loaded
        setTimeout(() => {
            if (this.allContent.length > 0) {
                // Get a random movie from all content
                const randomIndex = Math.floor(Math.random() * this.allContent.length);
                const featuredMovie = this.allContent[randomIndex];
                this.setHeroContent(featuredMovie);
            }
        }, 1000);
    }

    setHeroContent(movie) {
        const heroSection = document.getElementById('heroSection');
        const heroTitle = document.getElementById('heroTitle');
        const heroDescription = document.getElementById('heroDescription');
        const heroMoreInfoBtn = document.getElementById('heroMoreInfoBtn');

        // Set background image
        if (movie.backdrop) {
            heroSection.style.backgroundImage = `linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.3) 40%, rgba(0, 0, 0, 0.8) 80%, rgba(0, 0, 0, 0.95) 100%), url('${movie.backdrop}')`;
        }

        // Set title and description
        heroTitle.textContent = movie.title;
        heroDescription.textContent = movie.description;

        // Store movie ID for buttons
        heroSection.setAttribute('data-movie-id', movie.id);
    }
}

// Global functions for hero buttons
function playFeaturedMovie() {
    alert('Play functionality would be implemented here');
}

function openFeaturedMovieProfile() {
    const heroSection = document.getElementById('heroSection');
    const movieId = heroSection.getAttribute('data-movie-id');
    if (movieId) {
        window.location.href = `movie-profile.html?id=${movieId}`;
    }
}

// Initialize the feed when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.netflixFeed = new NetflixFeed();
});