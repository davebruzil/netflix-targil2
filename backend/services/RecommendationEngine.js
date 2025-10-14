// Recommendation Engine Service
// Purpose: Generate personalized content recommendations
// Dev: Alon (Dev #3)

const ContentSchema = require('../schemas/ContentSchema');
const ProfileInteractionSchema = require('../schemas/ProfileInteractionSchema');

/**
 * Get personalized recommendations for a profile
 * Algorithm:
 * 1. Get profile's watch history and liked content
 * 2. Extract common genres from liked/watched content
 * 3. Find similar content based on genres (from both MongoDB and TMDB)
 * 4. Filter out already watched content
 * 5. Return top N recommendations
 *
 * @param {string} profileId - The profile to get recommendations for
 * @param {number} limit - Maximum number of recommendations (default: 10)
 * @returns {Array} Array of recommended content objects
 */
async function getRecommendations(profileId, limit = 10) {
    try {
        console.log(`🎯 Getting recommendations for profile: ${profileId}, limit: ${limit}`);

        // Get profile's interaction data
        const interaction = await ProfileInteractionSchema.findOne({ profileId });
        if (!interaction) {
            console.log('No interaction data found, returning mixed popular content');
            return await getMixedPopularContent(limit);
        }

        // Get liked content IDs
        const likedContentIds = interaction.likedContent || [];
        const watchedContentIds = Array.from(interaction.watchProgress.keys()) || [];

        // If no liked content, return popular content
        if (likedContentIds.length === 0) {
            console.log('No liked content found, returning popular content');
            return await getPopularContent(limit);
        }

        console.log(`📊 Analyzing ${likedContentIds.length} liked items for recommendations`);

        // Separate MongoDB IDs from TMDB IDs
        const mongodbIds = likedContentIds.filter(id =>
            typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/)
        );

        const tmdbIds = likedContentIds.filter(id =>
            typeof id === 'string' && (id.startsWith('movie_') || id.startsWith('tv_'))
        );

        console.log(`  - MongoDB content: ${mongodbIds.length}`);
        console.log(`  - TMDB content: ${tmdbIds.length}`);

        // Get liked content from database
        let likedContent = [];
        if (mongodbIds.length > 0) {
            likedContent = await ContentSchema.find({ _id: { $in: mongodbIds } });
        }

        // For TMDB content, fetch actual genre data from TMDB API
        const tmdbGenres = [];
        if (tmdbIds.length > 0) {
            const genres = await extractGenresFromTMDBLikes(tmdbIds);
            tmdbGenres.push(...genres);
            console.log(`  - Extracted genres from TMDB likes: ${tmdbGenres.join(', ')}`);
        }

        // Get search history for additional context
        const searchHistory = interaction.searchHistory || [];

        // Extract genres from liked content
        const favoriteGenres = extractGenres(likedContent);

        // Extract genres from search history (if user searched for specific genres)
        const searchGenres = extractGenresFromSearchHistory(searchHistory);

        // Combine all genre sources: liked content + TMDB + search history
        const allGenres = [...new Set([...favoriteGenres, ...tmdbGenres, ...searchGenres])];

        console.log(`📚 Genre Analysis:`);
        console.log(`  - From liked DB content: ${favoriteGenres.join(', ') || 'none'}`);
        console.log(`  - From TMDB likes: ${tmdbGenres.join(', ') || 'none'}`);
        console.log(`  - From search history: ${searchGenres.join(', ') || 'none'}`);
        console.log(`  - Combined genres: ${allGenres.join(', ')}`);

        // If we have genres, find similar content from BOTH database and TMDB
        if (allGenres.length > 0) {
            // Get recommendations from database
            const dbRecommendations = await findSimilarByGenres(allGenres, Math.ceil(limit / 2));

            // Get recommendations from TMDB API - fetch more since many will be filtered out
            const tmdbRecommendations = await fetchTMDBRecommendations(allGenres, limit * 2);

            // Combine both sources
            const allRecommendations = [...dbRecommendations, ...tmdbRecommendations];

            // Filter out already watched/liked content
            const filteredRecommendations = allRecommendations.filter(content => {
                const contentId = content._id ? content._id.toString() : content.id;
                return !likedContentIds.includes(contentId) &&
                       !watchedContentIds.includes(contentId);
            });

            // Sort by relevance score and return top N
            const sortedRecommendations = filteredRecommendations
                .sort((a, b) => b.popularity - a.popularity)
                .slice(0, limit);

            console.log(`✅ Generated ${sortedRecommendations.length} recommendations (${dbRecommendations.length} from DB, ${tmdbRecommendations.length} from TMDB)`);
            return sortedRecommendations;
        } else {
            // No genres found, return popular content
            console.log('No genres found, returning popular content');
            return await getPopularContent(limit);
        }

    } catch (error) {
        console.error('Error generating recommendations:', error);
        // Fallback to popular content
        return await getPopularContent(limit);
    }
}

/**
 * Extract unique genres from an array of content items
 * Helper function for recommendation algorithm
 *
 * @param {Array} contentArray - Array of content objects
 * @returns {Array} Array of unique genre strings
 */
function extractGenres(contentArray) {
    const genreCount = {};
    
    contentArray.forEach(content => {
        if (content.genre) {
            // Handle comma-separated genres
            const genres = content.genre.split(',').map(g => g.trim());
            genres.forEach(genre => {
                if (genre) {
                    genreCount[genre] = (genreCount[genre] || 0) + 1;
                }
            });
        }
    });

    // Return genres sorted by frequency (most liked first)
    return Object.keys(genreCount)
        .sort((a, b) => genreCount[b] - genreCount[a])
        .slice(0, 5); // Top 5 genres
}


/**
 * Find content similar to given genres
 *
 * @param {Array} genres - Array of genre strings to match
 * @param {number} limit - Maximum results to return
 * @returns {Array} Array of matching content objects
 */
async function findSimilarByGenres(genres, limit = 20) {
    try {
        if (!genres || genres.length === 0) {
            return await getPopularContent(limit);
        }

        // Create regex pattern for genre matching
        const genrePattern = genres.map(genre => 
            genre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
        ).join('|');

        // Find content matching any of the genres
        const similarContent = await ContentSchema.find({
            genre: { $regex: genrePattern, $options: 'i' }
        }).limit(limit * 2); // Get more to allow for scoring

        // Calculate match score for each content item
        const scoredContent = similarContent.map(content => {
            let matchScore = 0;
            const contentGenres = content.genre ? content.genre.split(',').map(g => g.trim()) : [];
            
            // Count genre matches
            genres.forEach(favoriteGenre => {
                if (contentGenres.some(contentGenre => 
                    contentGenre.toLowerCase().includes(favoriteGenre.toLowerCase())
                )) {
                    matchScore += 1;
                }
            });

            return {
                ...content.toObject(),
                matchScore,
                genreMatchRatio: matchScore / genres.length
            };
        });

        // Sort by match score and popularity
        return scoredContent
            .sort((a, b) => {
                if (b.matchScore !== a.matchScore) {
                    return b.matchScore - a.matchScore;
                }
                return b.popularity - a.popularity;
            })
            .slice(0, limit);

    } catch (error) {
        console.error('Error finding similar content:', error);
        return await getPopularContent(limit);
    }
}

/**
 * Get trending/popular content
 * Based on number of likes and views across all profiles
 *
 * @param {number} limit - Maximum results to return (default: 10)
 * @returns {Array} Array of popular content objects
 */
async function getPopularContent(limit = 10) {
    try {
        console.log(`🔥 Getting popular content, limit: ${limit}`);

        // Get content sorted by likes and popularity
        const popularContent = await ContentSchema.find()
            .sort({ 
                likes: -1,      // Most liked first
                popularity: -1, // Then by popularity
                createdAt: -1   // Then by newest
            })
            .limit(limit);

        console.log(`✅ Found ${popularContent.length} popular items`);
        return popularContent;

    } catch (error) {
        console.error('Error getting popular content:', error);
        return [];
    }
}

/**
 * Get content recommendations based on a specific movie/show
 * "More Like This" functionality
 *
 * @param {string} contentId - The content ID to find similar content for
 * @param {number} limit - Maximum results to return (default: 6)
 * @returns {Array} Array of similar content objects
 */
async function getRelatedContent(contentId, limit = 6) {
    try {
        console.log(`🔗 Getting related content for: ${contentId}, limit: ${limit}`);

        // Find the source content
        const sourceContent = await ContentSchema.findById(contentId);
        if (!sourceContent) {
            console.log('Source content not found');
            return [];
        }

        // Extract genres from source content
        const sourceGenres = sourceContent.genre ? 
            sourceContent.genre.split(',').map(g => g.trim()) : [];

        if (sourceGenres.length === 0) {
            console.log('No genres found in source content');
            return await getPopularContent(limit);
        }

        // Find similar content based on genres
        const relatedContent = await findSimilarByGenres(sourceGenres, limit + 1);

        // Filter out the source content itself
        const filteredContent = relatedContent.filter(content => 
            content._id.toString() !== contentId
        );

        console.log(`✅ Found ${filteredContent.length} related items`);
        return filteredContent.slice(0, limit);

    } catch (error) {
        console.error('Error getting related content:', error);
        return [];
    }
}

/**
 * Extract genres from search history
 * @param {Array} searchHistory - Array of search history objects
 * @returns {Array} Array of unique genres
 */
function extractGenresFromSearchHistory(searchHistory) {
    const genreMap = new Map();

    searchHistory.forEach(search => {
        const query = search.query.toLowerCase();

        // Map search queries to genres
        if (query.includes('action') || query.includes('thriller')) {
            genreMap.set('Action', (genreMap.get('Action') || 0) + 1);
        }
        if (query.includes('comedy') || query.includes('funny')) {
            genreMap.set('Comedy', (genreMap.get('Comedy') || 0) + 1);
        }
        if (query.includes('drama') || query.includes('emotional')) {
            genreMap.set('Drama', (genreMap.get('Drama') || 0) + 1);
        }
        if (query.includes('horror') || query.includes('scary')) {
            genreMap.set('Horror', (genreMap.get('Horror') || 0) + 1);
        }
        if (query.includes('romance') || query.includes('love')) {
            genreMap.set('Romance', (genreMap.get('Romance') || 0) + 1);
        }
        if (query.includes('sci-fi') || query.includes('science fiction')) {
            genreMap.set('Sci-Fi', (genreMap.get('Sci-Fi') || 0) + 1);
        }
        if (query.includes('fantasy') || query.includes('magic')) {
            genreMap.set('Fantasy', (genreMap.get('Fantasy') || 0) + 1);
        }
        if (query.includes('documentary') || query.includes('doc')) {
            genreMap.set('Documentary', (genreMap.get('Documentary') || 0) + 1);
        }
    });

    // Return genres sorted by frequency
    return Array.from(genreMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0]);
}

/**
 * Extract genres from TMDB liked content
 * Fetches TMDB movie/TV data to get actual genre information
 *
 * @param {Array} tmdbIds - Array of TMDB IDs (e.g., ['movie_460465', 'tv_12345'])
 * @returns {Array} Array of unique genre strings
 */
async function extractGenresFromTMDBLikes(tmdbIds) {
    const axios = require('axios');
    const genreSet = new Set();

    // Map TMDB genre IDs to genre names
    const genreIdMap = {
        28: 'Action',
        12: 'Adventure',
        16: 'Animation',
        35: 'Comedy',
        80: 'Crime',
        99: 'Documentary',
        18: 'Drama',
        10751: 'Family',
        14: 'Fantasy',
        36: 'History',
        27: 'Horror',
        10402: 'Music',
        9648: 'Mystery',
        10749: 'Romance',
        878: 'Science Fiction',
        10770: 'TV Movie',
        53: 'Thriller',
        10752: 'War',
        37: 'Western'
    };

    try {
        // Fetch genre data from TMDB for each liked item (limit to first 10 to avoid rate limiting)
        const fetchPromises = tmdbIds.slice(0, 10).map(async (id) => {
            try {
                const [type, tmdbId] = id.split('_');
                const endpoint = type === 'movie' ? 'movie' : 'tv';

                const response = await axios.get(
                    `https://api.themoviedb.org/3/${endpoint}/${tmdbId}`,
                    {
                        params: {
                            api_key: process.env.TMDB_API_KEY
                        }
                    }
                );

                if (response.data && response.data.genres) {
                    response.data.genres.forEach(genre => {
                        genreSet.add(genre.name);
                    });
                }
            } catch (error) {
                console.warn(`Failed to fetch genres for ${id}:`, error.message);
            }
        });

        await Promise.all(fetchPromises);
    } catch (error) {
        console.error('Error extracting genres from TMDB likes:', error);
        // Fallback to common genres if API fails
        return ['Action', 'Drama', 'Comedy', 'Thriller'];
    }

    return Array.from(genreSet).slice(0, 5); // Return top 5 genres
}

/**
 * Fetch recommendations from TMDB API based on genres
 *
 * @param {Array} genres - Array of genre strings
 * @param {number} limit - Number of recommendations to fetch
 * @returns {Array} Array of TMDB content formatted for recommendations
 */
async function fetchTMDBRecommendations(genres, limit = 5) {
    const axios = require('axios');

    // Map genre names to TMDB genre IDs
    const genreNameToId = {
        'Action': 28,
        'Adventure': 12,
        'Animation': 16,
        'Comedy': 35,
        'Crime': 80,
        'Documentary': 99,
        'Drama': 18,
        'Family': 10751,
        'Fantasy': 14,
        'History': 36,
        'Horror': 27,
        'Music': 10402,
        'Mystery': 9648,
        'Romance': 10749,
        'Science Fiction': 878,
        'Sci-Fi': 878,
        'TV Movie': 10770,
        'Thriller': 53,
        'War': 10752,
        'Western': 37
    };

    try {
        // Convert genre names to TMDB genre IDs
        const genreIds = genres
            .map(genre => genreNameToId[genre])
            .filter(id => id !== undefined);

        if (genreIds.length === 0) {
            console.log('No valid TMDB genre IDs found');
            return [];
        }

        console.log(`🎬 Fetching TMDB recommendations for genres: ${genres.join(', ')} (IDs: ${genreIds.join(', ')})`);

        let allResults = [];

        // Try fetching with all genres first (AND logic - most specific)
        try {
            const response = await axios.get('https://api.themoviedb.org/3/discover/movie', {
                params: {
                    api_key: process.env.TMDB_API_KEY,
                    with_genres: genreIds.join(','),
                    sort_by: 'popularity.desc',
                    'vote_count.gte': 100,
                    page: 1
                }
            });

            if (response.data && response.data.results && response.data.results.length > 0) {
                allResults = response.data.results;
                console.log(`  ✅ Found ${allResults.length} movies matching ALL genres`);
            }
        } catch (error) {
            console.warn('  ⚠️ Error with AND genre query:', error.message);
        }

        // If not enough results, try with primary genre only (OR logic - broader)
        if (allResults.length < limit && genreIds.length > 0) {
            console.log(`  🔄 Fetching additional movies from primary genre: ${genres[0]}`);
            try {
                const response = await axios.get('https://api.themoviedb.org/3/discover/movie', {
                    params: {
                        api_key: process.env.TMDB_API_KEY,
                        with_genres: genreIds[0], // Just first genre
                        sort_by: 'popularity.desc',
                        'vote_count.gte': 50, // Lower threshold for broader results
                        page: 1
                    }
                });

                if (response.data && response.data.results) {
                    // Add new movies that aren't already in results
                    const existingIds = new Set(allResults.map(m => m.id));
                    const newMovies = response.data.results.filter(m => !existingIds.has(m.id));
                    allResults.push(...newMovies);
                    console.log(`  ✅ Added ${newMovies.length} more movies from primary genre`);
                }
            } catch (error) {
                console.warn('  ⚠️ Error with primary genre query:', error.message);
            }
        }

        // If still not enough, get popular movies as fallback
        if (allResults.length < limit) {
            console.log(`  🔄 Fetching popular movies as fallback`);
            try {
                const response = await axios.get('https://api.themoviedb.org/3/movie/popular', {
                    params: {
                        api_key: process.env.TMDB_API_KEY,
                        page: 1
                    }
                });

                if (response.data && response.data.results) {
                    const existingIds = new Set(allResults.map(m => m.id));
                    const newMovies = response.data.results.filter(m => !existingIds.has(m.id));
                    allResults.push(...newMovies);
                    console.log(`  ✅ Added ${newMovies.length} popular movies as fallback`);
                }
            } catch (error) {
                console.warn('  ⚠️ Error with popular movies query:', error.message);
            }
        }

        // Format results
        const formattedContent = allResults.slice(0, limit).map(movie => ({
            id: `movie_${movie.id}`,
            _id: `movie_${movie.id}`,
            title: movie.title,
            description: movie.overview,
            image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
            backdrop: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null,
            rating: movie.vote_average ? parseFloat(movie.vote_average.toFixed(1)) : 0,
            year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
            genre: genres.join(', '),
            category: 'Movie',
            popularity: movie.popularity || 0,
            likes: Math.floor(movie.vote_count / 100) || 0,
            source: 'tmdb'
        }));

        console.log(`✅ Fetched ${formattedContent.length} TMDB recommendations (requested: ${limit})`);
        return formattedContent;

    } catch (error) {
        console.error('Error fetching TMDB recommendations:', error.message);
        return [];
    }
}

/**
 * Get mixed popular content (fallback when no user data available)
 * Returns a mix of database content and TMDB popular movies
 *
 * @param {number} limit - Maximum number of items to return
 * @returns {Array} Array of mixed popular content
 */
async function getMixedPopularContent(limit = 10) {
    try {
        console.log('🌟 Getting mixed popular content...');

        // Get popular content from database
        const dbPopular = await getPopularContent(Math.ceil(limit / 2));

        // Get popular movies from TMDB
        const tmdbPopular = await fetchTMDBRecommendations(['Action', 'Comedy', 'Drama'], Math.ceil(limit / 2));

        // Combine and shuffle
        const mixed = [...dbPopular, ...tmdbPopular]
            .sort(() => Math.random() - 0.5) // Shuffle
            .slice(0, limit);

        console.log(`✅ Generated ${mixed.length} mixed popular items`);
        return mixed;
    } catch (error) {
        console.error('Error getting mixed popular content:', error);
        return await getPopularContent(limit);
    }
}

module.exports = {
    getRecommendations,
    extractGenres,
    findSimilarByGenres,
    getPopularContent,
    getRelatedContent,
    extractGenresFromSearchHistory,
    extractGenresFromTMDBLikes,
    fetchTMDBRecommendations,
    getMixedPopularContent
};
