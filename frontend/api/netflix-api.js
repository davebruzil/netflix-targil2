// Netflix API - Simple and Clean
// No JSDoc bloat, no redundancy, just clean code

class NetflixAPI {
    static BACKEND_URL = window.AppConfig?.get('BACKEND_URL') || 'http://localhost:5000/api';

    // Helper method to fetch with credentials (for session cookies)
    static async fetchWithCredentials(url, options = {}) {
        return fetch(url, {
            ...options,
            credentials: 'include', // Always include cookies for session management
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }

    // ===== TMDB API =====

    static async fetchTMDBData(id, type = 'movie') {
        try {
            const url = `${API_CONFIG.TMDB_BASE_URL}/${type}/${id}?api_key=${API_CONFIG.API_KEY}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            return this.formatContentData(data, type);
        } catch (error) {
            console.error(`Error fetching TMDB data for ${type} ${id}:`, error);
            return null;
        }
    }

    static formatContentData(data, type) {
        const posterPath = data.poster_path;
        const releaseDate = data.release_date || data.first_air_date;

            return {
                id: `${type}_${data.id}`,
                title: data.title || data.name,
                description: data.overview || 'No description available.',
                category: type === 'movie' ? 'Movie' : 'Series',
            image: posterPath ? `https://image.tmdb.org/t/p/w300${posterPath}` : 'https://via.placeholder.com/300x450/333/fff?text=No+Image',
                backdrop: data.backdrop_path ? `${API_CONFIG.BACKDROP_BASE_URL}${data.backdrop_path}` : null,
            year: releaseDate ? new Date(releaseDate).getFullYear() : null,
                rating: data.vote_average ? data.vote_average.toFixed(1) : null,
                genre: data.genres ? data.genres.map(g => g.name).slice(0, 3).join(', ') : null,
            runtime: this.getRuntime(data, type),
                popularity: data.popularity || 0,
            likes: Math.floor(Math.random() * 3000) + 500,
            progress: 0
        };
    }

    static getRuntime(data, type) {
        if (data.runtime) return `${data.runtime} min`;
        if (data.episode_run_time?.[0]) return `${data.episode_run_time[0]} min`;
        return type === 'movie' ? '120 min' : '45 min';
    }

    // ===== CONTENT LOADING =====

    static async loadAllContent(sections, allContent) {
        try {
            console.log('🚀 Loading content...');
            
            // Check cache first
            const cachedContent = this.getCachedContent();
            if (cachedContent && this.isCacheValid(cachedContent)) {
                console.log('📦 Using cached content');
                this.populateSectionsFromCache(sections, allContent, cachedContent);
                return;
            }

            // Load all content in parallel
            const loadPromises = [];
            
            for (const [section, queries] of Object.entries(CONTENT_QUERIES)) {
                if (queries.movies) {
                    queries.movies.forEach(id => {
                        loadPromises.push(this.loadContentItem(id, 'movie', section));
                    });
                }
                
                if (queries.tv) {
                    queries.tv.forEach(id => {
                        loadPromises.push(this.loadContentItem(id, 'tv', section));
                    });
                }
            }
            
            console.log(`⏳ Loading ${loadPromises.length} items in parallel...`);
            const results = await Promise.all(loadPromises);
            
            // Process results
            const sectionContent = {};
            results.forEach(content => {
                if (content) {
                    const section = content.section;
                    if (!sectionContent[section]) sectionContent[section] = [];
                    sectionContent[section].push(content);
                    allContent.push(content);
                }
            });

            // Populate sections
            Object.keys(CONTENT_QUERIES).forEach(section => {
                sections[section] = sectionContent[section] || [];
            });
            
            this.cacheContent(allContent);
            window.CONTENT_DATA = [...allContent];
            console.log('✅ Content loaded successfully');
        } catch (error) {
            console.error('❌ Error loading content:', error);
            throw error;
        }
    }

    static async loadContentItem(id, type, section) {
        const content = await this.fetchTMDBData(id, type);
        if (!content) return null;
        
        content.section = section;
        if (section === 'continue') {
            content.progress = Math.floor(Math.random() * 90) + 10;
        }
        
        return content;
    }

    // ===== RECOMMENDATION API METHODS =====

    static async getRecommendations(profileId, limit = 10) {
        try {
            const response = await this.fetchWithCredentials(`${this.BACKEND_URL}/content/recommendations/${profileId}?limit=${limit}`);
            const data = await response.json();
            
            if (data.success) {
                return data.data;
            } else {
                console.error('Failed to get recommendations:', data.error);
                return [];
            }
        } catch (error) {
            console.error('Error getting recommendations:', error);
            return [];
        }
    }

    static async getTrendingContent(limit = 10) {
        try {
            const response = await this.fetchWithCredentials(`${this.BACKEND_URL}/content/trending?limit=${limit}`);
            const data = await response.json();
            
            if (data.success) {
                return data.data;
            } else {
                console.error('Failed to get trending content:', data.error);
                return [];
            }
        } catch (error) {
            console.error('Error getting trending content:', error);
            return [];
        }
    }

    static async getRelatedContent(contentId, limit = 6) {
        try {
            const response = await this.fetchWithCredentials(`${this.BACKEND_URL}/content/${contentId}/related?limit=${limit}`);
            const data = await response.json();
            
            if (data.success) {
                return data.data;
            } else {
                console.error('Failed to get related content:', data.error);
                return [];
            }
        } catch (error) {
            console.error('Error getting related content:', error);
            return [];
        }
    }

    static async getSearchHistory(profileId, limit = 20) {
        try {
            const response = await this.fetchWithCredentials(`${this.BACKEND_URL}/content/profile/${profileId}/search-history?limit=${limit}`);
            const data = await response.json();
            
            if (data.success) {
                return data.data;
            } else {
                console.error('Failed to get search history:', data.error);
                return [];
            }
        } catch (error) {
            console.error('Error getting search history:', error);
            return [];
        }
    }

    // ===== AUTHENTICATION =====

    static async register(userData) {
        try {
            const response = await this.fetchWithCredentials(`${this.BACKEND_URL}/auth/register`, {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            const data = await response.json();

            if (data.success) {
                this.saveUserData(data.data.user);
                console.log('✅ User registered successfully');
                return data.data;
            } else {
                console.error('❌ Registration failed:', data.message || data.error);
                // Throw error with the actual backend message
                throw new Error(data.message || data.error || 'Registration failed');
            }
        } catch (error) {
            console.error('❌ Registration error:', error);
            throw error;
        }
    }

    static async login(credentials) {
        try {
            const response = await this.fetchWithCredentials(`${this.BACKEND_URL}/auth/login`, {
                method: 'POST',
                body: JSON.stringify(credentials)
            });
            const data = await response.json();
            
            if (data.success) {
                this.saveUserData(data.data.user);
                console.log('✅ User logged in successfully');
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

    static async logout() {
        try {
            this.clearUserData();
            console.log('✅ User logged out successfully');
            return true;
        } catch (error) {
            console.error('❌ Logout error:', error);
            return false;
        }
    }

    static getCurrentUser() {
        try {
            const isAuthenticated = localStorage.getItem('netflix:isAuthenticated');
            if (!isAuthenticated) return null;
            const userData = localStorage.getItem('netflix:user');
            if (!userData) return null;

            const user = JSON.parse(userData);
            // Handle backward compatibility: transform _id to id if needed
            if (user && !user.id && user._id) {
                user.id = user._id.toString();
            }
            return user;
        } catch (error) {
            console.error('❌ Error getting current user:', error);
            return null;
        }
    }

    static isAuthenticated() {
        return localStorage.getItem('netflix:isAuthenticated') === 'true';
    }

    // ===== BACKEND INTEGRATION =====

    static async searchContent(query, limit = 20) {
        try {
            const profileId = this.getCurrentProfileId();
            const url = `${this.BACKEND_URL}/content/search?q=${encodeURIComponent(query)}&limit=${limit}${profileId ? `&profileId=${profileId}` : ''}`;
            const response = await fetch(url);
            const data = await response.json();
            return data.success ? data.data : [];
        } catch (error) {
            console.error('Error searching backend:', error);
            return [];
        }
    }

    static async toggleLike(contentId, liked) {
        try {
            const profileId = this.getCurrentProfileId();
            const response = await fetch(`${this.BACKEND_URL}/content/${contentId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileId, liked })
            });
            const data = await response.json();
            return data.success ? data.data : null;
        } catch (error) {
            console.error('Error toggling like:', error);
            return null;
        }
    }

    static async updateProgress(contentId, progress) {
        try {
            const profileId = this.getCurrentProfileId();
            const response = await fetch(`${this.BACKEND_URL}/content/${contentId}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileId, progress })
            });
            const data = await response.json();
            return data.success ? data.data : null;
        } catch (error) {
            console.error('Error updating progress:', error);
            return null;
        }
    }

    static async getLikedContent() {
        try {
            const profileId = this.getCurrentProfileId();
            const response = await fetch(`${this.BACKEND_URL}/content/profile/${profileId}/likes`);
            const data = await response.json();
            return data.success ? data.data : [];
        } catch (error) {
            console.error('Error getting liked content:', error);
            return [];
        }
    }

    // ===== UTILITY METHODS =====

    static searchContent(content, searchTerm) {
        if (!searchTerm.trim()) return content;
        return content.filter(item =>
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.genre?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    static sortContent(content, isAlphaSorted) {
        return isAlphaSorted ? [...content].sort((a, b) => a.title.localeCompare(b.title)) : content;
    }

    static getCurrentProfileId() {
        return localStorage.getItem('netflix:profileId') || 'default_user';
    }

    // ===== CACHING =====

    static getCachedContent() {
        try {
            const cached = localStorage.getItem('netflix:cachedContent');
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.warn('Error reading cached content:', error);
            return null;
        }
    }

    static isCacheValid(cachedContent) {
        if (!cachedContent?.timestamp) return false;
        const cacheAge = Date.now() - cachedContent.timestamp;
        return cacheAge < 60 * 60 * 1000; // 1 hour
    }

    static cacheContent(content) {
        try {
            const cacheData = { content, timestamp: Date.now() };
            localStorage.setItem('netflix:cachedContent', JSON.stringify(cacheData));
            console.log('📦 Content cached successfully');
        } catch (error) {
            console.warn('Error caching content:', error);
        }
    }

    static populateSectionsFromCache(sections, allContent, cachedContent) {
        const content = cachedContent.content || [];
        allContent.length = 0;
        Object.keys(sections).forEach(section => sections[section] = []);
        
        content.forEach(item => {
            if (item.section && sections[item.section]) {
                sections[item.section].push(item);
            }
            allContent.push(item);
        });
        
        window.CONTENT_DATA = [...allContent];
    }

    static saveUserData(user) {
        // Ensure user has an id field (handle both id and _id)
        if (user && !user.id && user._id) {
            user.id = user._id.toString();
        }

        localStorage.setItem('netflix:isAuthenticated', 'true');
        localStorage.setItem('netflix:user', JSON.stringify(user));
        localStorage.setItem('netflix:email', user.email);

        console.log('✅ User data saved to localStorage:', { id: user.id, email: user.email });
    }

    static clearUserData() {
        localStorage.removeItem('netflix:isAuthenticated');
        localStorage.removeItem('netflix:user');
        localStorage.removeItem('netflix:email');
        localStorage.removeItem('netflix:profileId');
        localStorage.removeItem('netflix:profileName');
        localStorage.removeItem('netflix:likedItems');
    }

    // ============================================
    // PROFILE MANAGEMENT API FUNCTIONS
    // ============================================

    /**
     * Get all profiles from backend API
     * @returns {Promise<Array>} Array of profile objects
     */
    static async getAllProfiles() {
        try {
            // Get current user ID from localStorage
            const currentUser = this.getCurrentUser();
            if (!currentUser || !currentUser.id) {
                console.error('No current user found');
                return [];
            }

            const response = await this.fetchWithCredentials(`${this.BACKEND_URL}/profiles/user/${currentUser.id}`);
            const data = await response.json();

            if (data.success) {
                return data.data.profiles || [];
            } else {
                console.error('Failed to fetch profiles:', data.error);
                return [];
            }
        } catch (error) {
            console.error('Error fetching profiles:', error);
            return [];
        }
    }

    /**
     * Get specific profile by ID
     * @param {string} profileId - Profile ID
     * @returns {Promise<Object|null>} Profile object or null
     */
    static async getProfile(profileId) {
        try {
            const response = await fetch(`${this.BACKEND_URL}/profiles/${profileId}`);
            const data = await response.json();

            if (data.success) {
                return data.data.profile;
            } else {
                console.error('Failed to fetch profile:', data.error);
                return null;
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
    }

    /**
     * Create new profile
     * @param {Object} profileData - Profile data {id, name, avatar, preferences}
     * @returns {Promise<Object|null>} Created profile object or null
     */
    static async createProfile(profileData) {
        try {
            // Get current user ID from localStorage
            const currentUser = this.getCurrentUser();
            // MongoDB uses _id, not id
            const userId = currentUser?._id || currentUser?.id;
            if (!currentUser || !userId) {
                console.error('No current user found');
                return null;
            }

            // Transform profile data to match backend expectations
            const backendProfileData = {
                userId: userId,
                name: profileData.name,
                avatar: profileData.avatar,
                isChild: profileData.isChild || false
            };

            const response = await this.fetchWithCredentials(`${this.BACKEND_URL}/profiles`, {
                method: 'POST',
                body: JSON.stringify(backendProfileData)
            });

            const data = await response.json();
            
            if (data.success) {
                return data.data.profile;
            } else {
                console.error('Failed to create profile:', data.error);
                return null;
            }
        } catch (error) {
            console.error('Error creating profile:', error);
            return null;
        }
    }

    /**
     * Update existing profile
     * @param {string} profileId - Profile ID
     * @param {Object} updates - Updates to apply
     * @returns {Promise<Object|null>} Updated profile object or null
     */
    static async updateProfile(profileId, updates) {
        try {
            const response = await fetch(`${this.BACKEND_URL}/profiles/${profileId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });
            
            const data = await response.json();

            if (data.success) {
                return data.data.profile;
            } else {
                console.error('Failed to update profile:', data.error);
                return null;
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            return null;
        }
    }

    /**
     * Delete profile
     * @param {string} profileId - Profile ID
     * @returns {Promise<boolean>} Success status
     */
    static async deleteProfile(profileId) {
        try {
            const response = await this.fetchWithCredentials(`${this.BACKEND_URL}/profiles/${profileId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                console.log('✅ Profile deleted successfully');
                return true;
            } else {
                console.error('Failed to delete profile:', data.error);
                return false;
            }
        } catch (error) {
            console.error('Error deleting profile:', error);
            return false;
        }
    }

    // ===== MY LIST FEATURE (Dev #2 - Yaron) =====

    /**
     * Toggle My List status for content
     * @param {string} contentId - Content ID
     * @param {boolean} addToList - true to add, false to remove
     * @returns {Promise<object|null>} Result with myList status
     */
    static async toggleMyList(contentId, addToList) {
        try {
            const profileId = localStorage.getItem('netflix:profileId');
            if (!profileId) {
                console.error('No profile ID found');
                return null;
            }

            const response = await fetch(`${this.BACKEND_URL}/content/${contentId}/mylist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileId, addToList })
            });

            const data = await response.json();

            if (data.success) {
                console.log('✅ My List updated:', data.data);
                return data.data;
            } else {
                console.error('Failed to update My List:', data.error);
                return null;
            }
        } catch (error) {
            console.error('Error updating My List:', error);
            return null;
        }
    }

    /**
     * Get My List for current profile
     * @returns {Promise<Array>} Array of content in My List
     */
    static async getMyList() {
        try {
            const profileId = localStorage.getItem('netflix:profileId');
            if (!profileId) {
                console.error('No profile ID found');
                return [];
            }

            const response = await fetch(`${this.BACKEND_URL}/content/profile/${profileId}/mylist`);
            const data = await response.json();

            if (data.success) {
                console.log('✅ My List loaded:', data.count, 'items');
                return data.data;
            } else {
                console.error('Failed to fetch My List:', data.error);
                return [];
            }
        } catch (error) {
            console.error('Error fetching My List:', error);
            return [];
        }
    }

    // =============================================================================
    // DYNAMIC CONTENT SECTIONS API METHODS
    // =============================================================================

    // Helper method to reduce code duplication
    static async fetchSection(endpoint, sectionName, limit = 10) {
        try {
            const response = await fetch(`${this.BACKEND_URL}/content/sections/${endpoint}?limit=${limit}`);
            const data = await response.json();
            return data.success ? data.data : { content: [], section: sectionName, total: 0 };
        } catch (error) {
            console.error(`Error fetching ${sectionName.toLowerCase()}:`, error);
            return { content: [], section: sectionName, total: 0 };
        }
    }

    static async getTrendingSection(limit = 10) {
        return this.fetchSection('trending', 'Trending Now', limit);
    }

    static async getNewReleasesSection(limit = 10) {
        return this.fetchSection('new-releases', 'New Releases', limit);
    }

    static async getTopRatedSection(limit = 10) {
        return this.fetchSection('top-rated', 'Top Rated', limit);
    }

    static async getGenreSection(genre, limit = 10) {
        return this.fetchSection(`genre/${encodeURIComponent(genre)}`, `${genre} Movies & Shows`, limit);
    }

    static async getContinueWatchingSection(limit = 10) {
        const profileId = localStorage.getItem('netflix:profileId');
        if (!profileId) return { content: [], section: 'Continue Watching', total: 0 };
        return this.fetchSection(`continue-watching/${profileId}`, 'Continue Watching', limit);
    }

    static async getAvailableGenres() {
        try {
            const response = await fetch(`${this.BACKEND_URL}/content/sections/genres`);
            const data = await response.json();
            return data.success ? data.data.genres : [];
        } catch (error) {
            console.error('Error fetching available genres:', error);
            return [];
        }
    }

    static async loadDynamicSections(sectionTypes = ['trending', 'newReleases', 'topRated']) {
        const sectionMap = {
            trending: () => this.getTrendingSection(),
            newReleases: () => this.getNewReleasesSection(),
            topRated: () => this.getTopRatedSection(),
            continueWatching: () => this.getContinueWatchingSection()
        };

        const sections = await Promise.all(
            sectionTypes.map(async (type) => ({
                type,
                data: sectionMap[type] ? await sectionMap[type]() : { content: [], section: 'Unknown', total: 0 }
            }))
        );

        return sections.reduce((acc, { type, data }) => ({ ...acc, [type]: data }), {});
    }

    // =============================================================================
    // UPLOADED CONTENT API METHODS
    // =============================================================================

    /**
     * Get all uploaded content from backend
     * @returns {Promise<Array>} Array of uploaded content formatted for display
     */
    static async getAllUploadedContent() {
        try {
            const response = await this.fetchWithCredentials(`${this.BACKEND_URL}/content`);
            const data = await response.json();

            if (data.success && data.data) {
                // Format uploaded content to match TMDB content structure
                return data.data.map(item => this.formatUploadedContent(item));
            } else {
                console.error('Failed to fetch uploaded content:', data.error);
                return [];
            }
        } catch (error) {
            console.error('Error fetching uploaded content:', error);
            return [];
        }
    }

    /**
     * Format uploaded content to match TMDB content structure
     * @param {Object} item - Raw content from backend
     * @returns {Object} Formatted content object
     */
    static formatUploadedContent(item) {
        return {
            id: item._id,
            title: item.title,
            description: item.description || 'No description available.',
            category: item.type === 'movie' ? 'Movie' : 'Series',
            image: item.image || 'images/better.png',
            backdrop: item.backdrop || item.image || 'images/better.png',
            year: item.year || new Date().getFullYear(),
            rating: item.rating || 'N/A',
            genre: item.genre || 'General',
            runtime: item.runtime || (item.type === 'movie' ? '120 min' : '45 min'),
            popularity: item.views || 0,
            likes: item.likesCount || 0,
            progress: 0,
            videoFile: item.videoFile, // Include video file path for playback
            isUploaded: true, // Flag to identify uploaded content
            cast: item.cast || 'N/A',
            director: item.director || 'N/A'
        };
    }

    /**
     * Get specific uploaded content by ID
     * @param {string} contentId - Content ID
     * @returns {Promise<Object|null>} Content object or null
     */
    static async getUploadedContent(contentId) {
        try {
            const response = await this.fetchWithCredentials(`${this.BACKEND_URL}/content/${contentId}`);
            const data = await response.json();

            if (data.success && data.data) {
                return this.formatUploadedContent(data.data);
            } else {
                console.error('Failed to fetch uploaded content:', data.error);
                return null;
            }
        } catch (error) {
            console.error('Error fetching uploaded content:', error);
            return null;
        }
    }
}

// Export for global use
window.NetflixAPI = NetflixAPI;