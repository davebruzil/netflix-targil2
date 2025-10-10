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
 * 3. Find similar content based on genres
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
            console.log('No interaction data found, returning popular content');
            return await getPopularContent(limit);
        }

        // Get liked content IDs
        const likedContentIds = interaction.likedContent || [];
        const watchedContentIds = Array.from(interaction.watchProgress.keys()) || [];

        // If no liked content, return popular content
        if (likedContentIds.length === 0) {
            console.log('No liked content found, returning popular content');
            return await getPopularContent(limit);
        }

        // Filter to only MongoDB ObjectIds (24-char hex strings)
        const validLikedIds = likedContentIds.filter(id =>
            typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/)
        );

        // If no valid MongoDB IDs, return popular content
        if (validLikedIds.length === 0) {
            console.log('No valid MongoDB IDs in liked content, returning popular content');
            return await getPopularContent(limit);
        }

        // Get liked content details
        const likedContent = await ContentSchema.find({ _id: { $in: validLikedIds } });
        
        // Get search history for additional context
        const searchHistory = interaction.searchHistory || [];
        
        // Extract genres from liked content
        const favoriteGenres = extractGenres(likedContent);
        
        // Extract genres from search history (if user searched for specific genres)
        const searchGenres = extractGenresFromSearchHistory(searchHistory);
        
        // Combine favorite genres with search genres
        const allGenres = [...new Set([...favoriteGenres, ...searchGenres])];
        
        console.log(`Favorite genres: ${favoriteGenres.join(', ')}`);
        console.log(`Search genres: ${searchGenres.join(', ')}`);
        console.log(`Combined genres: ${allGenres.join(', ')}`);

        // Find similar content based on genres
        const recommendations = await findSimilarByGenres(allGenres, limit * 2);

        // Filter out already watched/liked content
        const filteredRecommendations = recommendations.filter(content => 
            !likedContentIds.includes(content._id.toString()) && 
            !watchedContentIds.includes(content._id.toString())
        );

        // Sort by relevance score and return top N
        const sortedRecommendations = filteredRecommendations
            .sort((a, b) => b.popularity - a.popularity)
            .slice(0, limit);

        console.log(`✅ Generated ${sortedRecommendations.length} recommendations`);
        return sortedRecommendations;

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
 * Extract genres from search history
 * Looks for genre-related search terms in user's search history
 *
 * @param {Array} searchHistory - Array of search history objects
 * @returns {Array} Array of unique genre strings found in searches
 */
function extractGenresFromSearchHistory(searchHistory) {
    const genreKeywords = [
        'action', 'comedy', 'drama', 'horror', 'thriller', 'romance', 'sci-fi', 'fantasy',
        'adventure', 'crime', 'mystery', 'documentary', 'animation', 'family', 'musical',
        'western', 'war', 'biography', 'history', 'sport', 'reality', 'talk show'
    ];
    
    const foundGenres = new Set();
    
    searchHistory.forEach(search => {
        const query = search.query.toLowerCase();
        
        // Check if search query contains genre keywords
        genreKeywords.forEach(genre => {
            if (query.includes(genre)) {
                foundGenres.add(genre.charAt(0).toUpperCase() + genre.slice(1));
            }
        });
    });
    
    return Array.from(foundGenres);
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

module.exports = {
    getRecommendations,
    extractGenres,
    findSimilarByGenres,
    getPopularContent,
    getRelatedContent,
    extractGenresFromSearchHistory
};
