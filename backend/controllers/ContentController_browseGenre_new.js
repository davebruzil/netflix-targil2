    /**
     * Browse genre with pagination, sorting, and filtering
     * Fetches from both TMDB API and local MongoDB
     * @route GET /api/content/browse/genre/:genre
     */
    async browseGenre(req, res) {
        try {
            const { genre } = req.params;
            const {
                page = 1,
                limit = 20,
                sort = 'popularity', // popularity, rating, title, recent
                watchStatus = 'all', // all, watched, unwatched
                profileId
            } = req.query;

            console.log(`🎬 GET /api/content/browse/genre/${genre} - Page: ${page}, Sort: ${sort}, Status: ${watchStatus}`);

            const axios = require('axios');
            const ContentSchema = require('../schemas/ContentSchema');
            const ProfileInteractionSchema = require('../schemas/ProfileInteractionSchema');

            // Map genre names to TMDB genre IDs
            const genreMap = {
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

            const tmdbGenreId = genreMap[genre] || null;
            let allContent = [];

            // Fetch from TMDB API if we have a matching genre
            if (tmdbGenreId) {
                try {
                    const tmdbResponse = await axios.get(`https://api.themoviedb.org/3/discover/movie`, {
                        params: {
                            api_key: process.env.TMDB_API_KEY,
                            with_genres: tmdbGenreId,
                            page: parseInt(page),
                            sort_by: sort === 'rating' ? 'vote_average.desc' : sort === 'recent' ? 'release_date.desc' : 'popularity.desc',
                            'vote_count.gte': 100 // Minimum votes for quality
                        }
                    });

                    if (tmdbResponse.data && tmdbResponse.data.results) {
                        const tmdbContent = tmdbResponse.data.results.map(movie => ({
                            id: `movie_${movie.id}`,
                            _id: `movie_${movie.id}`, // For consistency
                            title: movie.title,
                            description: movie.overview,
                            image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
                            backdrop: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null,
                            rating: movie.vote_average ? parseFloat(movie.vote_average.toFixed(1)) : 0,
                            year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
                            genre: genre,
                            category: 'Movie',
                            popularity: movie.popularity || 0,
                            likes: Math.floor(movie.vote_count / 100) || 0, // Convert votes to likes
                            source: 'tmdb'
                        }));
                        allContent = tmdbContent;
                        console.log(`✅ Fetched ${tmdbContent.length} movies from TMDB for genre: ${genre}`);
                    }
                } catch (tmdbError) {
                    console.error('TMDB API error:', tmdbError.message);
                }
            }

            // Also fetch from local MongoDB
            try {
                const localContent = await ContentSchema.find({
                    genre: { $regex: genre, $options: 'i' }
                });

                const localFormatted = localContent.map(item => ({
                    ...item.toObject(),
                    source: 'local'
                }));

                allContent = [...allContent, ...localFormatted];
                console.log(`✅ Total content: ${allContent.length} (${localFormatted.length} from local DB)`);
            } catch (dbError) {
                console.error('MongoDB error:', dbError.message);
            }

            // Get watched content IDs if profileId provided
            let watchedIds = [];
            if (profileId) {
                const interaction = await ProfileInteractionSchema.findOne({ profileId });
                if (interaction && interaction.watchProgress) {
                    watchedIds = Array.from(interaction.watchProgress.keys())
                        .filter(id => {
                            const progressData = interaction.watchProgress.get(id);
                            if (typeof progressData === 'object' && progressData.progress) {
                                return progressData.progress >= 90;
                            }
                            return progressData >= 90; // Legacy format
                        });
                }
            }

            // Apply watch status filter
            if (watchStatus === 'watched') {
                allContent = allContent.filter(item =>
                    watchedIds.includes(item._id?.toString()) || watchedIds.includes(item.id)
                );
            } else if (watchStatus === 'unwatched') {
                allContent = allContent.filter(item =>
                    !watchedIds.includes(item._id?.toString()) && !watchedIds.includes(item.id)
                );
            }

            // Apply sorting
            allContent.sort((a, b) => {
                switch (sort) {
                    case 'rating':
                        return (b.rating || 0) - (a.rating || 0);
                    case 'title':
                        return (a.title || '').localeCompare(b.title || '');
                    case 'recent':
                        return (b.year || 0) - (a.year || 0);
                    case 'popularity':
                    default:
                        return (b.popularity || 0) - (a.popularity || 0);
                }
            });

            // Apply pagination
            const totalCount = allContent.length;
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;
            const paginatedContent = allContent.slice(skip, skip + limitNum);

            // Mark which items are watched
            const contentWithStatus = paginatedContent.map(item => ({
                ...item,
                watched: watchedIds.includes(item._id?.toString()) || watchedIds.includes(item.id)
            }));

            res.json({
                success: true,
                data: {
                    content: contentWithStatus,
                    pagination: {
                        currentPage: pageNum,
                        totalPages: Math.ceil(totalCount / limitNum),
                        totalItems: totalCount,
                        itemsPerPage: limitNum,
                        hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
                        hasPrevPage: pageNum > 1
                    },
                    filters: {
                        genre,
                        sort,
                        watchStatus
                    }
                }
            });

        } catch (error) {
            console.error('Error browsing genre:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to browse genre',
                message: error.message
            });
        }
    }
