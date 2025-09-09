// Netflix Clone - Data Management
// Mock database and content management system

(() => {
    // Storage keys for localStorage
    const STORAGE_KEYS = {
        CONTENT: 'netflix:content',
        USER_PROGRESS: 'netflix:userProgress',
        USER_LIKES: 'netflix:userLikes',
        ADMIN_USERS: 'netflix:adminUsers'
    };

    // Mock content database
    const DEFAULT_CONTENT = [
        {
            id: 'stranger-things',
            title: 'Stranger Things',
            type: 'series',
            year: 2016,
            genre: 'Sci-Fi',
            director: 'The Duffer Brothers',
            actors: ['Winona Ryder', 'David Harbour', 'Finn Wolfhard', 'Millie Bobby Brown'],
            synopsis: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces, and one strange little girl.',
            poster: 'https://picsum.photos/400/600?random=1',
            thumbnail: 'https://picsum.photos/300/400?random=1',
            rating: 8.7,
            videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
            duration: 3120, // 52 minutes in seconds
            episodes: [
                {
                    id: 's1e1',
                    title: 'Chapter One: The Vanishing of Will Byers',
                    duration: 2880, // 48 minutes
                    synopsis: 'On his way home from a friend\'s house, young Will sees something terrifying.',
                    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
                },
                {
                    id: 's1e2',
                    title: 'Chapter Two: The Weirdo on Maple Street',
                    duration: 3360, // 56 minutes
                    synopsis: 'Lucas, Mike and Dustin try to talk to the girl they found in the woods.',
                    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4'
                }
            ]
        },
        {
            id: 'the-crown',
            title: 'The Crown',
            type: 'series',
            year: 2016,
            genre: 'Drama',
            director: 'Peter Morgan',
            actors: ['Claire Foy', 'Olivia Colman', 'Imelda Staunton', 'Matt Smith'],
            synopsis: 'Follows the political rivalries and romance of Queen Elizabeth II\'s reign and the events that shaped the second half of the twentieth century.',
            poster: 'https://picsum.photos/400/600?random=2',
            thumbnail: 'https://picsum.photos/300/400?random=2',
            rating: 8.6,
            videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
            duration: 3600, // 60 minutes
            episodes: [
                {
                    id: 'tc1e1',
                    title: 'Wolferton Splash',
                    duration: 3480, // 58 minutes
                    synopsis: 'A young Princess Elizabeth marries Prince Philip.',
                    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
                }
            ]
        },
        {
            id: 'the-irishman',
            title: 'The Irishman',
            type: 'movie',
            year: 2019,
            genre: 'Crime',
            director: 'Martin Scorsese',
            actors: ['Robert De Niro', 'Al Pacino', 'Joe Pesci'],
            synopsis: 'A truck driver has been accused of having links to the mob and what happened to Jimmy Hoffa.',
            poster: 'https://picsum.photos/400/600?random=3',
            thumbnail: 'https://picsum.photos/300/400?random=3',
            rating: 7.8,
            videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
            duration: 12540 // 209 minutes
        },
        {
            id: 'extraction',
            title: 'Extraction',
            type: 'movie',
            year: 2020,
            genre: 'Action',
            director: 'Sam Hargrave',
            actors: ['Chris Hemsworth', 'Rudhraksh Jaiswal', 'Randeep Hooda'],
            synopsis: 'A black-market mercenary who has nothing to lose is hired to rescue the kidnapped son of an imprisoned international crime lord.',
            poster: 'https://picsum.photos/400/600?random=4',
            thumbnail: 'https://picsum.photos/300/400?random=4',
            rating: 6.7,
            videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
            duration: 6960 // 116 minutes
        },
        {
            id: 'ozark',
            title: 'Ozark',
            type: 'series',
            year: 2017,
            genre: 'Crime',
            director: 'Bill Dubuque',
            actors: ['Jason Bateman', 'Laura Linney', 'Sofia Hublitz', 'Skylar Gaertner'],
            synopsis: 'A financial advisor drags his family from Chicago to the Missouri Ozarks, where he must launder money to appease a drug boss.',
            poster: 'https://picsum.photos/400/600?random=5',
            thumbnail: 'https://picsum.photos/300/400?random=5',
            rating: 8.4,
            videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
            duration: 3600, // 60 minutes
            episodes: [
                {
                    id: 'oz1e1',
                    title: 'Sugarwood',
                    duration: 3840, // 64 minutes
                    synopsis: 'After a money laundering scheme for a Mexican cartel goes wrong, financial advisor Marty Byrde proposes to make amends by offering to set up a bigger laundering operation in the Lake of the Ozarks region of central Missouri.',
                    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
                }
            ]
        },
        {
            id: 'red-notice',
            title: 'Red Notice',
            type: 'movie',
            year: 2021,
            genre: 'Action',
            director: 'Rawson Marshall Thurber',
            actors: ['Dwayne Johnson', 'Ryan Reynolds', 'Gal Gadot'],
            synopsis: 'An Interpol agent tracks the world\'s most wanted art thief.',
            poster: 'https://picsum.photos/400/600?random=6',
            thumbnail: 'https://picsum.photos/300/400?random=6',
            rating: 6.3,
            videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
            duration: 7080 // 118 minutes
        },
        {
            id: 'breaking-bad',
            title: 'Breaking Bad',
            type: 'series',
            year: 2008,
            genre: 'Crime',
            director: 'Vince Gilligan',
            actors: ['Bryan Cranston', 'Aaron Paul', 'Anna Gunn', 'RJ Mitte'],
            synopsis: 'A high school chemistry teacher turned methamphetamine producer partners with a former student.',
            poster: 'https://picsum.photos/400/600?random=7',
            thumbnail: 'https://picsum.photos/300/400?random=7',
            rating: 9.5,
            videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
            duration: 2700, // 45 minutes
            episodes: [
                {
                    id: 'bb1e1',
                    title: 'Pilot',
                    duration: 2760, // 46 minutes
                    synopsis: 'Walter White, a struggling high school chemistry teacher, is diagnosed with lung cancer.',
                    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
                }
            ]
        },
        {
            id: 'the-office',
            title: 'The Office',
            type: 'series',
            year: 2005,
            genre: 'Comedy',
            director: 'Greg Daniels',
            actors: ['Steve Carell', 'John Krasinski', 'Jenna Fischer', 'Rainn Wilson'],
            synopsis: 'A mockumentary on a group of typical office workers, where the workday consists of ego clashes, inappropriate behavior, and tedium.',
            poster: 'https://picsum.photos/400/600?random=8',
            thumbnail: 'https://picsum.photos/300/400?random=8',
            rating: 8.9,
            videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
            duration: 1320, // 22 minutes
            episodes: [
                {
                    id: 'office1e1',
                    title: 'Pilot',
                    duration: 1380, // 23 minutes
                    synopsis: 'The premiere episode introduces the employees at Dunder Mifflin Scranton.',
                    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
                }
            ]
        },
        {
            id: 'bird-box',
            title: 'Bird Box',
            type: 'movie',
            year: 2018,
            genre: 'Horror',
            director: 'Susanne Bier',
            actors: ['Sandra Bullock', 'Trevante Rhodes', 'John Malkovich', 'Sarah Paulson'],
            synopsis: 'Five years after an ominous unseen presence drives most of society to suicide, a mother and her two children make a desperate attempt to reach safety.',
            poster: 'https://picsum.photos/400/600?random=9',
            thumbnail: 'https://picsum.photos/300/400?random=9',
            rating: 6.6,
            videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
            duration: 7440 // 124 minutes
        },
        {
            id: 'friends',
            title: 'Friends',
            type: 'series',
            year: 1994,
            genre: 'Comedy',
            director: 'David Crane',
            actors: ['Jennifer Aniston', 'Courteney Cox', 'Lisa Kudrow', 'Matt LeBlanc'],
            synopsis: 'Follows the personal and professional lives of six twenty to thirty-something-year-old friends living in Manhattan.',
            poster: 'https://picsum.photos/400/600?random=10',
            thumbnail: 'https://picsum.photos/300/400?random=10',
            rating: 8.9,
            videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
            duration: 1320, // 22 minutes
            episodes: [
                {
                    id: 'friends1e1',
                    title: 'The Pilot',
                    duration: 1380, // 23 minutes
                    synopsis: 'Monica and the gang introduce Rachel to the real world after she leaves her fiancé at the altar.',
                    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
                }
            ]
        },
        {
            id: 'the-conjuring',
            title: 'The Conjuring',
            type: 'movie',
            year: 2013,
            genre: 'Horror',
            director: 'James Wan',
            actors: ['Vera Farmiga', 'Patrick Wilson', 'Lili Taylor', 'Ron Livingston'],
            synopsis: 'Paranormal investigators Ed and Lorraine Warren work to help a family terrorized by a dark presence in their farmhouse.',
            poster: 'https://picsum.photos/400/600?random=11',
            thumbnail: 'https://picsum.photos/300/400?random=11',
            rating: 7.5,
            videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
            duration: 6720 // 112 minutes
        },
        {
            id: 'money-heist',
            title: 'Money Heist',
            type: 'series',
            year: 2017,
            genre: 'Action',
            director: 'Álex Pina',
            actors: ['Úrsula Corberó', 'Álvaro Morte', 'Itziar Ituño', 'Pedro Alonso'],
            synopsis: 'An unusual group of robbers attempt to carry out the most perfect robbery in Spanish history - stealing 2.4 billion euros from the Royal Mint of Spain.',
            poster: 'https://picsum.photos/400/600?random=12',
            thumbnail: 'https://picsum.photos/300/400?random=12',
            rating: 8.2,
            videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
            duration: 4200, // 70 minutes
            episodes: [
                {
                    id: 'mh1e1',
                    title: 'Efectuar lo acordado',
                    duration: 4200, // 70 minutes
                    synopsis: 'The Professor recruits a young female robber and seven other criminals for a grand heist.',
                    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
                }
            ]
        },
        {
            id: 'rush-hour',
            title: 'Rush Hour',
            type: 'movie',
            year: 1998,
            genre: 'Action',
            director: 'Brett Ratner',
            actors: ['Jackie Chan', 'Chris Tucker', 'Tom Wilkinson', 'Chris Penn'],
            synopsis: 'A loyal and dedicated Hong Kong Inspector teams up with a reckless and loudmouthed L.A.P.D. detective to rescue the Chinese Consul\'s kidnapped daughter.',
            poster: 'https://picsum.photos/400/600?random=13',
            thumbnail: 'https://picsum.photos/300/400?random=13',
            rating: 7.0,
            videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
            duration: 5880 // 98 minutes
        },
        {
            id: 'brooklyn-nine-nine',
            title: 'Brooklyn Nine-Nine',
            type: 'series',
            year: 2013,
            genre: 'Comedy',
            director: 'Dan Goor',
            actors: ['Andy Samberg', 'Stephanie Beatriz', 'Terry Crews', 'Melissa Fumero'],
            synopsis: 'Comedy series following the exploits of Det. Jake Peralta and his diverse, lovable colleagues as they police the NYPD\'s 99th Precinct.',
            poster: 'https://picsum.photos/400/600?random=14',
            thumbnail: 'https://picsum.photos/300/400?random=14',
            rating: 8.4,
            videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
            duration: 1320, // 22 minutes
            episodes: [
                {
                    id: 'b99-1e1',
                    title: 'Pilot',
                    duration: 1380, // 23 minutes
                    synopsis: 'Jake Peralta, an immature but talented NYPD detective in Brooklyn\'s 99th Precinct, comes into conflict with his new commanding officer.',
                    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
                }
            ]
        }
    ];

    // Admin users list
    const DEFAULT_ADMIN_USERS = ['admin@netflix.com', 'dev@netflix.com'];

    // Data management class
    class NetflixDataManager {
        constructor() {
            this.initializeData();
        }

        // Initialize default data if not exists
        initializeData() {
            if (!localStorage.getItem(STORAGE_KEYS.CONTENT)) {
                localStorage.setItem(STORAGE_KEYS.CONTENT, JSON.stringify(DEFAULT_CONTENT));
            }
            if (!localStorage.getItem(STORAGE_KEYS.USER_PROGRESS)) {
                localStorage.setItem(STORAGE_KEYS.USER_PROGRESS, JSON.stringify({}));
            }
            if (!localStorage.getItem(STORAGE_KEYS.USER_LIKES)) {
                localStorage.setItem(STORAGE_KEYS.USER_LIKES, JSON.stringify({}));
            }
            if (!localStorage.getItem(STORAGE_KEYS.ADMIN_USERS)) {
                localStorage.setItem(STORAGE_KEYS.ADMIN_USERS, JSON.stringify(DEFAULT_ADMIN_USERS));
            }
        }

        // Content management
        getAllContent() {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.CONTENT) || '[]');
        }

        getContentById(id) {
            const content = this.getAllContent();
            return content.find(item => item.id === id);
        }

        getContentByType(type) {
            const content = this.getAllContent();
            return content.filter(item => item.type === type);
        }

        getContentByGenre(genre) {
            const content = this.getAllContent();
            return content.filter(item => item.genre.toLowerCase().includes(genre.toLowerCase()));
        }

        searchContent(query) {
            const content = this.getAllContent();
            const searchTerm = query.toLowerCase();
            return content.filter(item => 
                item.title.toLowerCase().includes(searchTerm) ||
                item.genre.toLowerCase().includes(searchTerm) ||
                item.director.toLowerCase().includes(searchTerm) ||
                item.actors.some(actor => actor.toLowerCase().includes(searchTerm))
            );
        }

        addContent(contentData) {
            const content = this.getAllContent();
            const newContent = {
                id: contentData.id || this.generateId(contentData.title),
                ...contentData,
                dateAdded: new Date().toISOString()
            };
            content.push(newContent);
            localStorage.setItem(STORAGE_KEYS.CONTENT, JSON.stringify(content));
            return newContent;
        }

        updateContent(id, updates) {
            const content = this.getAllContent();
            const index = content.findIndex(item => item.id === id);
            if (index !== -1) {
                content[index] = { ...content[index], ...updates };
                localStorage.setItem(STORAGE_KEYS.CONTENT, JSON.stringify(content));
                return content[index];
            }
            return null;
        }

        deleteContent(id) {
            const content = this.getAllContent();
            const filteredContent = content.filter(item => item.id !== id);
            localStorage.setItem(STORAGE_KEYS.CONTENT, JSON.stringify(filteredContent));
            return true;
        }

        generateId(title) {
            return title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        }

        // User progress management
        getUserProgress(profileId) {
            const progress = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_PROGRESS) || '{}');
            return progress[profileId] || {};
        }

        setUserProgress(profileId, contentId, progressData) {
            const allProgress = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_PROGRESS) || '{}');
            if (!allProgress[profileId]) {
                allProgress[profileId] = {};
            }
            allProgress[profileId][contentId] = {
                ...progressData,
                lastWatched: new Date().toISOString()
            };
            localStorage.setItem(STORAGE_KEYS.USER_PROGRESS, JSON.stringify(allProgress));
        }

        getContentProgress(profileId, contentId) {
            const progress = this.getUserProgress(profileId);
            return progress[contentId] || { currentTime: 0, completed: false };
        }

        // User likes management
        getUserLikes(profileId) {
            const likes = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_LIKES) || '{}');
            return likes[profileId] || [];
        }

        toggleContentLike(profileId, contentId) {
            const allLikes = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_LIKES) || '{}');
            if (!allLikes[profileId]) {
                allLikes[profileId] = [];
            }
            
            const userLikes = allLikes[profileId];
            const isLiked = userLikes.includes(contentId);
            
            if (isLiked) {
                allLikes[profileId] = userLikes.filter(id => id !== contentId);
            } else {
                allLikes[profileId].push(contentId);
            }
            
            localStorage.setItem(STORAGE_KEYS.USER_LIKES, JSON.stringify(allLikes));
            return !isLiked;
        }

        isContentLiked(profileId, contentId) {
            const likes = this.getUserLikes(profileId);
            return likes.includes(contentId);
        }

        // Admin management
        isAdmin(email) {
            const adminUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.ADMIN_USERS) || '[]');
            return adminUsers.includes(email);
        }

        addAdmin(email) {
            const adminUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.ADMIN_USERS) || '[]');
            if (!adminUsers.includes(email)) {
                adminUsers.push(email);
                localStorage.setItem(STORAGE_KEYS.ADMIN_USERS, JSON.stringify(adminUsers));
            }
        }

        // Recommendations
        getRecommendations(profileId, contentId, limit = 6) {
            const content = this.getAllContent();
            const currentContent = this.getContentById(contentId);
            const userLikes = this.getUserLikes(profileId);
            
            if (!currentContent) return [];

            // Score content based on genre similarity and user likes
            const scored = content
                .filter(item => item.id !== contentId)
                .map(item => {
                    let score = 0;
                    
                    // Genre similarity
                    if (item.genre === currentContent.genre) score += 3;
                    
                    // Type similarity (series/movie)
                    if (item.type === currentContent.type) score += 2;
                    
                    // User likes boost
                    if (userLikes.includes(item.id)) score += 2;
                    
                    // Rating boost
                    score += (item.rating / 10);
                    
                    return { ...item, score };
                })
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);

            return scored.map(item => {
                const { score, ...content } = item;
                return content;
            });
        }

        // Continue watching
        getContinueWatching(profileId, limit = 10) {
            const progress = this.getUserProgress(profileId);
            const content = this.getAllContent();
            
            const continueWatching = Object.entries(progress)
                .filter(([contentId, data]) => !data.completed && data.currentTime > 0)
                .map(([contentId, data]) => {
                    const contentItem = content.find(item => item.id === contentId);
                    return contentItem ? { ...contentItem, progress: data } : null;
                })
                .filter(Boolean)
                .sort((a, b) => new Date(b.progress.lastWatched) - new Date(a.progress.lastWatched))
                .slice(0, limit);
                
            return continueWatching;
        }
    }

    // Create global instance
    window.NetflixData = new NetflixDataManager();

    // Export for use in other modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = NetflixDataManager;
    }
})();