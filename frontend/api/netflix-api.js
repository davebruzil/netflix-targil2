// Netflix API Functions
// This file contains all TMDB API fetching and data processing functions
// Now with backend integration for likes, progress, and search

class NetflixAPI {
    static BACKEND_URL = window.AppConfig?.get('BACKEND_URL') || 'http://localhost:5000/api';
    /**
     * Fetch movie/TV show data from TMDB API
     * @param {number|string} id - TMDB ID
     * @param {string} type - 'movie' or 'tv'
     * @returns {Object|null} Formatted content object
     */
    static async fetchTMDBData(id, type = 'movie') {
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
                // Use smaller images for faster loading
                image: data.poster_path ? `https://image.tmdb.org/t/p/w300${data.poster_path}` : 'https://via.placeholder.com/300x450/333/fff?text=No+Image',
                imageLarge: data.poster_path ? `${API_CONFIG.IMAGE_BASE_URL}${data.poster_path}` : null,
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

    /**
     * Load all content for different sections with optimizations
     * @param {Object} sections - Sections object to populate
     * @param {Array} allContent - Array to store all content
     * @returns {Promise<void>}
     */
    static async loadAllContent(sections, allContent) {
        try {
            console.log('🚀 Loading content with optimizations...');
            
            // Check for cached content first
            const cachedContent = this.getCachedContent();
            if (cachedContent && this.isCacheValid(cachedContent)) {
                console.log('📦 Using cached content');
                this.populateSectionsFromCache(sections, allContent, cachedContent);
                return;
            }

            // Load content in parallel for better performance
            const loadPromises = [];
            
            for (const [section, queries] of Object.entries(CONTENT_QUERIES)) {
                // Create promises for all content in this section
                const sectionPromises = [];
                
                // Handle movies
                if (queries.movies) {
                    queries.movies.forEach(movieId => {
                        sectionPromises.push(
                            this.fetchTMDBData(movieId, 'movie').then(movieData => {
                                if (movieData) {
                                    movieData.section = section;
                                    if (section === 'continue') {
                                        movieData.progress = Math.floor(Math.random() * 90) + 10;
                                    }
                                    return { type: 'movie', data: movieData, section };
                                }
                                return null;
                            })
                        );
                    });
                }

                // Handle TV shows
                if (queries.tv) {
                    queries.tv.forEach(tvId => {
                        sectionPromises.push(
                            this.fetchTMDBData(tvId, 'tv').then(tvData => {
                                if (tvData) {
                                    tvData.section = section;
                                    if (section === 'continue') {
                                        tvData.progress = Math.floor(Math.random() * 90) + 10;
                                    }
                                    return { type: 'tv', data: tvData, section };
                                }
                                return null;
                            })
                        );
                    });
                }
                
                loadPromises.push(...sectionPromises);
            }

            // Wait for all content to load in parallel
            console.log(`⏳ Loading ${loadPromises.length} items in parallel...`);
            const results = await Promise.all(loadPromises);
            
            // Process results and organize by section
            const sectionContent = {};
            results.forEach(result => {
                if (result && result.data) {
                    const section = result.section;
                    if (!sectionContent[section]) {
                        sectionContent[section] = [];
                    }
                    sectionContent[section].push(result.data);
                    allContent.push(result.data);
                }
            });

            // Populate sections
            Object.keys(CONTENT_QUERIES).forEach(section => {
                sections[section] = sectionContent[section] || [];
            });

            // Cache the content for future use
            this.cacheContent(allContent);

            // Update global content data
            window.CONTENT_DATA = [...allContent];
            
            console.log('✅ Content loaded successfully');

        } catch (error) {
            console.error('❌ Error loading content:', error);
            throw error;
        }
    }

    /**
     * Search content by title
     * @param {Array} content - Content array to search
     * @param {string} searchTerm - Search term
     * @returns {Array} Filtered content
     */
    static searchContent(content, searchTerm) {
        if (!searchTerm.trim()) return content;

        return content.filter(item =>
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.genre?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    /**
     * Sort content alphabetically
     * @param {Array} content - Content array to sort
     * @param {boolean} isAlphaSorted - Current sort state
     * @returns {Array} Sorted content
     */
    static sortContent(content, isAlphaSorted) {
        if (isAlphaSorted) {
            return [...content].sort((a, b) => a.title.localeCompare(b.title));
        }
        return content;
    }

    // ===== BACKEND INTEGRATION METHODS =====

    // ===== AUTHENTICATION METHODS =====

    /**
     * Register a new user
     * @param {Object} userData - User registration data
     * @param {string} userData.email - User email
     * @param {string} userData.password - User password
     * @param {string} userData.firstName - User first name
     * @param {string} userData.lastName - User last name
     * @returns {Promise<Object|null>} Registration result
     */
    static async register(userData) {
        try {
            const response = await fetch(`${this.BACKEND_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (data.success) {
                // Store user data in localStorage
                localStorage.setItem('netflix:isAuthenticated', 'true');
                localStorage.setItem('netflix:user', JSON.stringify(data.data.user));
                localStorage.setItem('netflix:email', data.data.user.email);
                
                console.log('✅ User registered successfully:', data.data.user);
                return data.data;
            } else {
                console.error('❌ Registration failed:', data.error);
                return null;
            }
        } catch (error) {
            console.error('❌ Registration error:', error);
            return null;
        }
    }

    /**
     * Login user
     * @param {Object} credentials - Login credentials
     * @param {string} credentials.email - User email
     * @param {string} credentials.password - User password
     * @returns {Promise<Object|null>} Login result
     */
    static async login(credentials) {
        try {
            const response = await fetch(`${this.BACKEND_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();

            if (data.success) {
                // Store user data in localStorage
                localStorage.setItem('netflix:isAuthenticated', 'true');
                localStorage.setItem('netflix:user', JSON.stringify(data.data.user));
                localStorage.setItem('netflix:email', data.data.user.email);
                
                console.log('✅ User logged in successfully:', data.data.user);
                return data.data;
            } else {
                console.error('❌ Login failed:', data.error);
                return null;
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            return null;
        }
    }

    /**
     * Logout user
     * @returns {Promise<boolean>} Logout success
     */
    static async logout() {
        try {
            // Clear all authentication data from localStorage
            localStorage.removeItem('netflix:isAuthenticated');
            localStorage.removeItem('netflix:user');
            localStorage.removeItem('netflix:email');
            localStorage.removeItem('netflix:profileId');
            localStorage.removeItem('netflix:profileName');
            localStorage.removeItem('netflix:likedItems');
            
            console.log('✅ User logged out successfully');
            return true;
        } catch (error) {
            console.error('❌ Logout error:', error);
            return false;
        }
    }

    /**
     * Get current authenticated user
     * @returns {Object|null} Current user data
     */
    static getCurrentUser() {
        try {
            const isAuthenticated = localStorage.getItem('netflix:isAuthenticated');
            if (!isAuthenticated) {
                return null;
            }

            const userData = localStorage.getItem('netflix:user');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('❌ Error getting current user:', error);
            return null;
        }
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} Authentication status
     */
    static isAuthenticated() {
        return localStorage.getItem('netflix:isAuthenticated') === 'true';
    }

    /**
     * Get current profile ID from localStorage
     * @returns {string} Profile ID
     */
    static getCurrentProfileId() {
        return localStorage.getItem('netflix:profileId') || 'default_user';
    }

    /**
     * Search content using backend API
     * @param {string} query - Search query
     * @param {number} limit - Result limit
     * @returns {Promise<Array>} Search results
     */
    static async searchContentBackend(query, limit = 20) {
        try {
            const profileId = this.getCurrentProfileId();
            const url = `${this.BACKEND_URL}/content/search?q=${encodeURIComponent(query)}&limit=${limit}${profileId ? `&profileId=${profileId}` : ''}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                return data.data;
            } else {
                console.warn('Backend search failed:', data.error);
                return [];
            }
        } catch (error) {
            console.error('Error searching backend:', error);
            return [];
        }
    }

    /**
     * Toggle like status for content
     * @param {string} contentId - Content ID
     * @param {boolean} liked - Like status
     * @returns {Promise<Object|null>} Updated like data
     */
    static async toggleLike(contentId, liked) {
        try {
            const profileId = this.getCurrentProfileId();
            const response = await fetch(`${this.BACKEND_URL}/content/${contentId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    profileId: profileId,
                    liked: liked
                })
            });

            const data = await response.json();

            if (data.success) {
                return data.data;
            } else {
                console.warn('Backend like toggle failed:', data.error);
                return null;
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            return null;
        }
    }

    /**
     * Update watch progress for content
     * @param {string} contentId - Content ID
     * @param {number} progress - Progress percentage (0-100)
     * @returns {Promise<Object|null>} Updated progress data
     */
    static async updateProgress(contentId, progress) {
        try {
            const profileId = this.getCurrentProfileId();
            const response = await fetch(`${this.BACKEND_URL}/content/${contentId}/progress`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    profileId: profileId,
                    progress: progress
                })
            });

            const data = await response.json();

            if (data.success) {
                return data.data;
            } else {
                console.warn('Backend progress update failed:', data.error);
                return null;
            }
        } catch (error) {
            console.error('Error updating progress:', error);
            return null;
        }
    }

    /**
     * Get liked content for current profile
     * @returns {Promise<Array>} Liked content array
     */
    static async getLikedContent() {
        try {
            const profileId = this.getCurrentProfileId();
            const response = await fetch(`${this.BACKEND_URL}/content/profile/${profileId}/likes`);
            const data = await response.json();

            if (data.success) {
                return data.data;
            } else {
                console.warn('Backend get likes failed:', data.error);
                return [];
            }
        } catch (error) {
            console.error('Error getting liked content:', error);
            return [];
        }
    }

    /**
     * Sync TMDB content with backend (optional - for future use)
     * @param {Array} content - Content array to sync
     * @returns {Promise<boolean>} Success status
     */
    static async syncContentWithBackend(content) {
        try {
            // This could be used to populate backend with TMDB data
            // For now, we'll just use the existing backend data
            console.log('Content sync not implemented - using existing backend data');
            return true;
        } catch (error) {
            console.error('Error syncing content:', error);
            return false;
        }
    }

    // ===== CACHING METHODS =====

    /**
     * Get cached content from localStorage
     * @returns {Object|null} Cached content data
     */
    static getCachedContent() {
        try {
            const cached = localStorage.getItem('netflix:cachedContent');
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.warn('Error reading cached content:', error);
            return null;
        }
    }

    /**
     * Check if cached content is still valid (less than 1 hour old)
     * @param {Object} cachedContent - Cached content data
     * @returns {boolean} Whether cache is valid
     */
    static isCacheValid(cachedContent) {
        if (!cachedContent || !cachedContent.timestamp) return false;
        
        const cacheAge = Date.now() - cachedContent.timestamp;
        const maxAge = 60 * 60 * 1000; // 1 hour in milliseconds
        
        return cacheAge < maxAge;
    }

    /**
     * Cache content to localStorage
     * @param {Array} content - Content array to cache
     */
    static cacheContent(content) {
        try {
            const cacheData = {
                content: content,
                timestamp: Date.now()
            };
            localStorage.setItem('netflix:cachedContent', JSON.stringify(cacheData));
            console.log('📦 Content cached successfully');
        } catch (error) {
            console.warn('Error caching content:', error);
        }
    }

    /**
     * Populate sections from cached content
     * @param {Object} sections - Sections object to populate
     * @param {Array} allContent - Array to store all content
     * @param {Object} cachedContent - Cached content data
     */
    static populateSectionsFromCache(sections, allContent, cachedContent) {
        const content = cachedContent.content || [];
        
        // Clear existing content
        allContent.length = 0;
        Object.keys(sections).forEach(section => {
            sections[section] = [];
        });
        
        // Populate sections from cache
        content.forEach(item => {
            if (item.section && sections[item.section]) {
                sections[item.section].push(item);
            }
            allContent.push(item);
        });
        
        // Update global content data
        window.CONTENT_DATA = [...allContent];
    }

    /**
     * Clear content cache
     */
    static clearContentCache() {
        localStorage.removeItem('netflix:cachedContent');
        console.log('🗑️ Content cache cleared');
    }
}

// Export for global use
window.NetflixAPI = NetflixAPI;