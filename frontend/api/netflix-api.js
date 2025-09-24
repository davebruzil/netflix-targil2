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

    /**
     * Load all content for different sections
     * @param {Object} sections - Sections object to populate
     * @param {Array} allContent - Array to store all content
     * @returns {Promise<void>}
     */
    static async loadAllContent(sections, allContent) {
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
                            allContent.push(movieData);
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
                            allContent.push(tvData);
                        }
                    }
                }

                sections[section] = sectionContent;
            }

            // Update global content data
            window.CONTENT_DATA = [...allContent];

        } catch (error) {
            console.error('Error loading content:', error);
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

    // ============================================
    // PROFILE MANAGEMENT API FUNCTIONS
    // ============================================

    /**
     * Get all profiles from backend API
     * @returns {Promise<Array>} Array of profile objects
     */
    static async getAllProfiles() {
        try {
            const response = await fetch(`${this.BACKEND_URL}/profiles`);
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
            const response = await fetch(`${this.BACKEND_URL}/profiles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileData)
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
            const response = await fetch(`${this.BACKEND_URL}/profiles/${profileId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
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
}

// Export for global use
window.NetflixAPI = NetflixAPI;