// Recommendation Engine Service
// Purpose: Generate personalized content recommendations
// Dev: Alon (Dev #3)

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
    // TODO: Read profiles.json to get profile data

    // TODO: Get profile's watchHistory and likedContent arrays

    // TODO: Read content.json to get all available content

    // TODO: Extract genres from liked and watched content

    // TODO: Find similar content based on common genres

    // TODO: Filter out already watched content

    // TODO: Sort by relevance score (genre match count)

    // TODO: Return top N recommendations
}

/**
 * Extract unique genres from an array of content items
 * Helper function for recommendation algorithm
 *
 * @param {Array} contentArray - Array of content objects
 * @returns {Array} Array of unique genre strings
 */
function extractGenres(contentArray) {
    // TODO: Loop through content items

    // TODO: Extract genres from each item

    // TODO: Return unique genres array
}

/**
 * Find content similar to given genres
 *
 * @param {Array} genres - Array of genre strings to match
 * @param {number} limit - Maximum results to return
 * @returns {Array} Array of matching content objects
 */
async function findSimilarByGenres(genres, limit = 20) {
    // TODO: Read content.json

    // TODO: Filter content that matches any of the genres

    // TODO: Calculate match score (how many genres match)

    // TODO: Sort by match score

    // TODO: Return top N results
}

/**
 * Get trending/popular content
 * Based on number of likes and views across all profiles
 *
 * @param {number} limit - Maximum results to return (default: 10)
 * @returns {Array} Array of popular content objects
 */
async function getPopularContent(limit = 10) {
    // TODO: Read profiles.json to count likes per content

    // TODO: Count how many profiles liked each content item

    // TODO: Read content.json

    // TODO: Add popularity score to each content item

    // TODO: Sort by popularity score

    // TODO: Return top N popular items
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
    // TODO: Read content.json

    // TODO: Find the source content by ID

    // TODO: Extract its genres

    // TODO: Find other content with matching genres

    // TODO: Filter out the source content itself

    // TODO: Return top N matches
}

module.exports = {
    getRecommendations,
    extractGenres,
    findSimilarByGenres,
    getPopularContent,
    getRelatedContent
};
