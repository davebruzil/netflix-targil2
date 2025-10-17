class VideoPlayer {
    constructor() {
        this.video = document.getElementById('mainVideo');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.rewindBtn = document.getElementById('rewindBtn');
        this.forwardBtn = document.getElementById('forwardBtn');
        this.muteBtn = document.getElementById('muteBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.progressBar = document.getElementById('progressBar');
        this.progressFill = document.getElementById('progressFill');
        this.progressHandle = document.getElementById('progressHandle');
        this.currentTimeEl = document.getElementById('currentTime');
        this.totalTimeEl = document.getElementById('totalTime');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        this.episodesBtn = document.getElementById('episodesBtn');
        this.nextEpisodeBtn = document.getElementById('nextEpisodeBtn');
        this.episodesDrawer = document.getElementById('episodesDrawer');
        this.closeDrawerBtn = document.getElementById('closeDrawerBtn');
        this.playerContainer = document.getElementById('playerContainer');

        this.isPlaying = false;
        this.isDragging = false;
        this.currentContent = null;
        this.episodes = [];
        this.currentEpisodeIndex = 0;
        this.contentId = null;
        this.isTMDBContent = false;
        this.progressSaveInterval = null;
        this.lastSavedProgress = 0;
        this.isMockPlayback = false;
        this.mockCurrentTime = 0;
        this.mockDuration = 60;
        this.mockInterval = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadContentFromURL();
    }

    setupEventListeners() {
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.rewindBtn.addEventListener('click', () => this.rewind(10));
        this.forwardBtn.addEventListener('click', () => this.forward(10));
        this.muteBtn.addEventListener('click', () => this.toggleMute());
        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        this.episodesBtn.addEventListener('click', () => this.toggleEpisodesDrawer());
        this.nextEpisodeBtn.addEventListener('click', () => this.playNextEpisode());
        this.closeDrawerBtn.addEventListener('click', () => this.closeEpisodesDrawer());

        this.progressBar.addEventListener('click', (e) => this.seekTo(e));
        this.progressBar.addEventListener('mousedown', () => this.startDragging());
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.stopDragging());

        this.video.addEventListener('loadedmetadata', () => this.updateDuration());
        this.video.addEventListener('timeupdate', () => this.updateProgress());
        this.video.addEventListener('ended', () => this.onVideoEnded());
        this.video.addEventListener('play', () => {
            this.updatePlayPauseButton(true);
            this.startProgressTracking();
        });
        this.video.addEventListener('pause', () => {
            this.updatePlayPauseButton(false);
            this.stopProgressTracking();
        });

        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        document.addEventListener('click', (e) => this.closeEpisodesDrawerOnOutsideClick(e));

        // Save progress before page unload
        window.addEventListener('beforeunload', () => {
            this.saveWatchProgress();
        });
    }

    loadContentFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const contentId = urlParams.get('id');

        console.log('🎬 Loading content from URL:', contentId);

        if (contentId) {
            this.loadContent(contentId);
        } else {
            this.loadSampleContent();
        }
    }

    async loadContent(contentId) {
        try {
            this.contentId = contentId;
            console.log('📺 loadContent called with ID:', contentId);

            // Check if it's a TMDB content (movie_xxx or tv_xxx)
            if (contentId.startsWith('movie_') || contentId.startsWith('tv_')) {
                console.log('🎥 Detected TMDB content, using mock playback');
                this.isTMDBContent = true;
                await this.loadTMDBContent(contentId);
            } else {
                this.isTMDBContent = false;
                const response = await fetch(`/api/content/${contentId}`);
                const data = await response.json();

                if (data.success) {
                    this.currentContent = data.data;
                    this.setupContent();
                } else {
                    this.loadSampleContent();
                }
            }

            // Load saved progress and resume if available
            await this.loadSavedProgress();

            // Save initial progress (0%) to mark content as started
            // This ensures content appears in Continue Watching even if user doesn't click play
            console.log('⏰ Setting timeout to save initial progress in 1 second...');
            setTimeout(() => {
                console.log('⏰ Timeout fired! Calling saveWatchProgress for initial 0% save');
                console.log('⏰ contentId:', this.contentId);
                console.log('⏰ isMockPlayback:', this.isMockPlayback);
                console.log('⏰ mockCurrentTime:', this.mockCurrentTime);
                this.saveWatchProgress();
            }, 1000);
        } catch (error) {
            console.error('Error loading content:', error);
            this.loadSampleContent();
        }
    }

    async loadTMDBContent(contentId) {
        // For TMDB content, create a mock content object
        const [type, id] = contentId.split('_');

        this.currentContent = {
            _id: contentId,
            id: contentId,
            title: `${type === 'movie' ? 'Movie' : 'TV Show'} Preview`,
            description: 'This is preview content. Actual video not available.',
            videoFile: null, // Will trigger placeholder video generation
            isTMDB: true
        };

        this.setupContent();
    }

    loadSampleContent() {
        this.currentContent = {
            title: 'Sample Movie',
            description: 'This is a sample movie for demonstration purposes.',
            year: 2024,
            rating: 'PG-13',
            runtime: '2h 15min',
            genre: 'Action',
            director: 'Sample Director',
            cast: 'Actor 1, Actor 2, Actor 3',
            videoFile: 'data:video/mp4;base64,',
            image: 'data:image/jpeg;base64,'
        };
        this.setupContent();
    }

    setupContent() {
        if (!this.currentContent) return;

        // Set video title in browser tab
        document.title = `${this.currentContent.title} - Netflix Player`;

        // Handle different video file formats
        if (this.currentContent.videoFile) {
            if (this.currentContent.videoFile.startsWith('data:video/')) {
                // Base64 encoded video
                this.video.src = this.currentContent.videoFile;
            } else if (this.currentContent.videoFile.startsWith('/uploads/')) {
                // Uploaded video file - use the URL directly
                this.video.src = this.currentContent.videoFile;
            } else if (this.currentContent.videoFile.startsWith('http')) {
                // External URL
                this.video.src = this.currentContent.videoFile;
            } else {
                // Unknown format, generate sample
                this.generateSampleVideo();
            }
        } else {
            // No video file, generate sample (60 seconds for TMDB content)
            this.generateSampleVideo();
        }

        // Load episodes if it's a TV show
        this.loadRealEpisodes();
    }

    generateSampleVideo() {
        // Use mock playback for TMDB content (no real video file)
        this.isMockPlayback = true;
        this.mockDuration = 60; // 60 seconds
        this.mockCurrentTime = 0;

        // Set a black background for the video element
        this.video.style.display = 'block';
        this.video.style.background = '#000';

        // Create a minimal black frame as the video source
        const canvas = document.createElement('canvas');
        canvas.width = 1280;
        canvas.height = 720;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Convert to blob and set as video source
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            this.video.poster = url;
        }, 'image/png');

        // Set initial duration display
        this.totalTimeEl.textContent = '1:00';
        this.currentTimeEl.textContent = '0:00';
    }

    async loadRealEpisodes() {
        try {
            // Check if content is a TV show
            if (!this.contentId || !this.contentId.startsWith('tv_')) {
                // Not a TV show, hide episodes section
                console.log('📺 Not a TV show, hiding episodes section');
                if (this.episodesBtn) this.episodesBtn.style.display = 'none';
                if (this.nextEpisodeBtn) this.nextEpisodeBtn.style.display = 'none';
                return;
            }

            // Show episodes section for TV shows
            if (this.episodesBtn) this.episodesBtn.style.display = 'flex';
            if (this.nextEpisodeBtn) this.nextEpisodeBtn.style.display = 'flex';

            // Extract TV show ID from contentId (format: tv_12345)
            const tvId = this.contentId.split('_')[1];
            const seasonNumber = 1; // Default to season 1

            console.log(`📺 Loading episodes for TV show ${tvId}, Season ${seasonNumber}`);

            // Fetch episodes from backend
            const response = await fetch(`/api/content/tv/${tvId}/season/${seasonNumber}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                console.error('Failed to fetch episodes:', response.statusText);
                this.loadMockEpisodes(); // Fallback to mock data
                return;
            }

            const data = await response.json();

            if (data.success && data.data && data.data.episodes) {
                this.episodes = data.data.episodes;
                console.log(`✅ Loaded ${this.episodes.length} episodes from TMDB`);
                this.renderEpisodes();
            } else {
                console.warn('No episodes found, using mock data');
                this.loadMockEpisodes();
            }
        } catch (error) {
            console.error('Error loading episodes:', error);
            this.loadMockEpisodes(); // Fallback to mock data
        }
    }

    loadMockEpisodes() {
        console.log('📺 Loading mock episodes as fallback');
        this.episodes = [
            {
                title: 'Episode 1: The Beginning',
                description: 'The story begins with our hero discovering their powers.',
                duration: '45:30',
                thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNDUiIHZpZXdCb3g9IjAgMCA4MCA0NSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjQ1IiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjQwIiB5PSIyNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5FcGlzb2RlIDE8L3RleHQ+Cjwvc3ZnPgo='
            },
            {
                title: 'Episode 2: The Challenge',
                description: 'Our hero faces their first major challenge.',
                duration: '42:15',
                thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNDUiIHZpZXdCb3g9IjAgMCA4MCA0NSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjQ1IiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjQwIiB5PSIyNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5FcGlzb2RlIDI8L3RleHQ+Cjwvc3ZnPgo='
            },
            {
                title: 'Episode 3: The Victory',
                description: 'The final confrontation and resolution.',
                duration: '48:20',
                thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNDUiIHZpZXdCb3g9IjAgMCA4MCA0NSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjQ1IiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjQwIiB5PSIyNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5FcGlzb2RlIDM8L3RleHQ+Cjwvc3ZnPgo='
            }
        ];

        this.renderEpisodes();
    }

    renderEpisodes() {
        const episodesList = document.getElementById('episodesList');
        episodesList.innerHTML = '';
        
        this.episodes.forEach((episode, index) => {
            const episodeEl = document.createElement('div');
            episodeEl.className = `episode-item ${index === this.currentEpisodeIndex ? 'active' : ''}`;
            episodeEl.innerHTML = `
                <div class="episode-thumbnail">
                    <img src="${episode.thumbnail}" alt="Episode ${index + 1}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">
                </div>
                <div class="episode-info">
                    <div class="episode-title">${episode.title}</div>
                    <div class="episode-description">${episode.description}</div>
                    <div class="episode-duration">${episode.duration}</div>
                </div>
            `;
            
            episodeEl.addEventListener('click', () => this.playEpisode(index));
            episodesList.appendChild(episodeEl);
        });
    }

    togglePlayPause() {
        console.log('▶️ togglePlayPause called');
        console.log('▶️ isMockPlayback:', this.isMockPlayback);
        console.log('▶️ isPlaying:', this.isPlaying);

        if (this.isMockPlayback) {
            if (this.isPlaying) {
                console.log('⏸️ Pausing mock playback');
                this.pauseMock();
            } else {
                console.log('▶️ Starting mock playback');
                this.playMock();
            }
        } else {
            if (this.isPlaying) {
                this.video.pause();
            } else {
                this.video.play();
            }
        }
    }

    playMock() {
        console.log('🎬 playMock started');
        console.log('🎬 mockCurrentTime:', this.mockCurrentTime);
        console.log('🎬 mockDuration:', this.mockDuration);

        if (this.mockCurrentTime >= this.mockDuration) {
            this.mockCurrentTime = 0;
        }

        this.isPlaying = true;
        this.updatePlayPauseButton(true);
        this.startProgressTracking();

        // Start mock playback interval
        this.mockInterval = setInterval(() => {
            this.mockCurrentTime += 1;
            console.log(`⏱️ Mock time: ${this.mockCurrentTime}s / ${this.mockDuration}s`);

            // Update UI
            const progress = (this.mockCurrentTime / this.mockDuration) * 100;
            this.progressFill.style.width = `${progress}%`;
            this.progressHandle.style.left = `${progress}%`;
            this.currentTimeEl.textContent = this.formatTime(this.mockCurrentTime);

            // Check if ended
            if (this.mockCurrentTime >= this.mockDuration) {
                this.pauseMock();
                this.onVideoEnded();
            }
        }, 1000);

        console.log('🎬 Mock interval started with ID:', this.mockInterval);
    }

    pauseMock() {
        this.isPlaying = false;
        this.updatePlayPauseButton(false);
        this.stopProgressTracking();

        if (this.mockInterval) {
            clearInterval(this.mockInterval);
            this.mockInterval = null;
        }

        // Save progress
        this.saveWatchProgress();
    }

    updatePlayPauseButton(playing) {
        console.log('🎮 updatePlayPauseButton called, playing:', playing);
        this.isPlaying = playing;

        if (!this.playPauseBtn) {
            console.warn('❌ playPauseBtn not found!');
            return;
        }

        // Try to find icon element (could be <i> or Font Awesome might convert it)
        let icon = this.playPauseBtn.querySelector('i');

        // If icon doesn't exist, create it
        if (!icon) {
            console.log('⚠️ Icon element not found, creating new one');
            this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            icon = this.playPauseBtn.querySelector('i');
        }

        if (!icon) {
            console.warn('❌ Still cannot find/create icon element');
            return;
        }

        console.log('🎮 Current icon class:', icon.className);
        const newClass = playing ? 'fas fa-pause' : 'fas fa-play';
        icon.className = newClass;
        console.log('🎮 Updated icon class to:', newClass);
    }

    rewind(seconds) {
        if (this.isMockPlayback) {
            this.mockCurrentTime = Math.max(0, this.mockCurrentTime - seconds);
            const progress = (this.mockCurrentTime / this.mockDuration) * 100;
            this.progressFill.style.width = `${progress}%`;
            this.progressHandle.style.left = `${progress}%`;
            this.currentTimeEl.textContent = this.formatTime(this.mockCurrentTime);
        } else {
            this.video.currentTime = Math.max(0, this.video.currentTime - seconds);
        }
    }

    forward(seconds) {
        if (this.isMockPlayback) {
            this.mockCurrentTime = Math.min(this.mockDuration, this.mockCurrentTime + seconds);
            const progress = (this.mockCurrentTime / this.mockDuration) * 100;
            this.progressFill.style.width = `${progress}%`;
            this.progressHandle.style.left = `${progress}%`;
            this.currentTimeEl.textContent = this.formatTime(this.mockCurrentTime);
        } else {
            this.video.currentTime = Math.min(this.video.duration, this.video.currentTime + seconds);
        }
    }

    toggleMute() {
        this.video.muted = !this.video.muted;
        if (!this.muteBtn) return;

        const icon = this.muteBtn.querySelector('i');
        if (icon) {
            icon.className = this.video.muted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
        }
    }

    setVolume(value) {
        this.video.volume = value / 100;
        if (!this.muteBtn) return;

        const icon = this.muteBtn.querySelector('i');
        if (!icon) return;

        if (value == 0) {
            icon.className = 'fas fa-volume-mute';
        } else if (value < 50) {
            icon.className = 'fas fa-volume-down';
        } else {
            icon.className = 'fas fa-volume-up';
        }
    }

    updateProgress() {
        if (this.isDragging) return;
        
        const progress = (this.video.currentTime / this.video.duration) * 100;
        this.progressFill.style.width = `${progress}%`;
        this.progressHandle.style.left = `${progress}%`;
        
        this.currentTimeEl.textContent = this.formatTime(this.video.currentTime);
    }

    updateDuration() {
        this.totalTimeEl.textContent = this.formatTime(this.video.duration);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    seekTo(e) {
        const rect = this.progressBar.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;

        if (this.isMockPlayback) {
            this.mockCurrentTime = pos * this.mockDuration;
            const progress = pos * 100;
            this.progressFill.style.width = `${progress}%`;
            this.progressHandle.style.left = `${progress}%`;
            this.currentTimeEl.textContent = this.formatTime(this.mockCurrentTime);
        } else {
            this.video.currentTime = pos * this.video.duration;
        }
    }

    startDragging() {
        this.isDragging = true;
    }

    drag(e) {
        if (!this.isDragging) return;
        
        const rect = this.progressBar.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        const progress = Math.max(0, Math.min(100, pos * 100));
        
        this.progressFill.style.width = `${progress}%`;
        this.progressHandle.style.left = `${progress}%`;
    }

    stopDragging() {
        if (!this.isDragging) return;

        this.isDragging = false;
        const progress = parseFloat(this.progressFill.style.width) / 100;

        if (this.isMockPlayback) {
            this.mockCurrentTime = progress * this.mockDuration;
            this.currentTimeEl.textContent = this.formatTime(this.mockCurrentTime);
        } else {
            this.video.currentTime = progress * this.video.duration;
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.playerContainer.requestFullscreen();
            this.playerContainer.classList.add('fullscreen');
        } else {
            document.exitFullscreen();
            this.playerContainer.classList.remove('fullscreen');
        }
    }

    toggleEpisodesDrawer() {
        this.episodesDrawer.classList.toggle('open');
    }

    closeEpisodesDrawer() {
        this.episodesDrawer.classList.remove('open');
    }

    closeEpisodesDrawerOnOutsideClick(e) {
        if (!this.episodesDrawer.contains(e.target) && !this.episodesBtn.contains(e.target)) {
            this.closeEpisodesDrawer();
        }
    }

    playEpisode(index) {
        this.currentEpisodeIndex = index;
        this.renderEpisodes();
        this.closeEpisodesDrawer();

        // Reset progress bar to 0 for new episode
        this.mockCurrentTime = 0;
        this.progressFill.style.width = '0%';
        this.progressHandle.style.left = '0%';
        this.currentTimeEl.textContent = '0:00';
        console.log(`📺 Starting new episode ${index + 1}, progress reset to 0`);

        this.generateSampleVideo();

        // Auto-play the new episode if mock playback
        if (this.isMockPlayback) {
            this.playMock();
        } else {
            this.video.play();
        }
    }

    playNextEpisode() {
        if (this.currentEpisodeIndex < this.episodes.length - 1) {
            this.playEpisode(this.currentEpisodeIndex + 1);
        }
    }

    onVideoEnded() {
        this.updatePlayPauseButton(false);
        if (this.currentEpisodeIndex < this.episodes.length - 1) {
            setTimeout(() => this.playNextEpisode(), 3000);
        }
    }

    handleKeyboard(e) {
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.rewind(10);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.forward(10);
                break;
            case 'KeyF':
                e.preventDefault();
                this.toggleFullscreen();
                break;
            case 'KeyM':
                e.preventDefault();
                this.toggleMute();
                break;
            case 'Escape':
                if (document.fullscreenElement) {
                    this.toggleFullscreen();
                }
                this.closeEpisodesDrawer();
                break;
        }
    }

    async saveWatchProgress() {
        console.log('💾 saveWatchProgress called');
        try {
            const profileId = localStorage.getItem('netflix:profileId');
            console.log('💾 profileId:', profileId);
            console.log('💾 contentId:', this.contentId);

            if (!profileId || !this.contentId) {
                console.warn('💾 Missing profileId or contentId, skipping save');
                return;
            }

            let currentTime, duration;

            if (this.isMockPlayback) {
                console.log('💾 Using mock playback data');
                currentTime = this.mockCurrentTime;
                duration = this.mockDuration;
            } else {
                currentTime = this.video.currentTime || 0;
                duration = this.video.duration || 60;

                // Skip if video hasn't loaded yet
                if (isNaN(duration) || duration === 0) {
                    console.warn('💾 Video not loaded yet, skipping save');
                    return;
                }
            }

            const progress = (currentTime / duration) * 100;
            console.log(`💾 Progress: ${Math.round(progress)}% (${currentTime}s / ${duration}s)`);
            console.log(`💾 lastSavedProgress: ${this.lastSavedProgress}`);

            // Only save if progress has changed significantly (more than 1%)
            // Allow initial save at 0% (when lastSavedProgress === 0)
            if (Math.abs(progress - this.lastSavedProgress) < 1 && progress < 99 && this.lastSavedProgress > 0) {
                console.log('💾 Progress change < 1%, skipping save');
                return;
            }

            console.log('💾 Sending POST request to save progress...');
            const requestBody = {
                contentId: this.contentId,
                progress: Math.round(progress),
                currentTime: currentTime,
                totalDuration: duration
            };

            // Add episode information for TV shows
            if (this.contentId && this.contentId.startsWith('tv_') && this.episodes.length > 0) {
                const currentEpisode = this.episodes[this.currentEpisodeIndex];
                if (currentEpisode) {
                    requestBody.episodeNumber = currentEpisode.episodeNumber;
                    requestBody.seasonNumber = currentEpisode.seasonNumber;
                    requestBody.episodeTitle = currentEpisode.title;
                    console.log(`📺 Saving episode info: S${currentEpisode.seasonNumber}E${currentEpisode.episodeNumber} - ${currentEpisode.title}`);
                }
            }

            console.log('💾 Request body:', requestBody);

            const url = `/api/profiles/${profileId}/watch-progress`;
            console.log('💾 Full URL:', url);
            console.log('💾 URL length:', url.length);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(requestBody)
            });

            console.log('💾 Response status:', response.status);
            console.log('💾 Response headers:', response.headers);
            console.log('💾 Response ok:', response.ok);
            console.log('💾 Response Content-Type:', response.headers.get('Content-Type'));

            // If not OK, log the text response
            if (!response.ok) {
                const text = await response.text();
                console.error('💾 Error response (first 500 chars):', text.substring(0, 500));
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('💾 Response data:', data);

            if (data.success) {
                this.lastSavedProgress = progress;
                console.log(`✅ Progress saved: ${Math.round(progress)}%`);
            } else {
                console.error('💾 Save failed:', data);
            }
        } catch (error) {
            console.error('Error saving watch progress:', error);
            console.error('Error stack:', error.stack);
        }
    }

    async loadSavedProgress() {
        try {
            const profileId = localStorage.getItem('netflix:profileId');
            if (!profileId || !this.contentId) return;

            const response = await fetch(`/api/profiles/${profileId}/watch-history`, {
                credentials: 'include'
            });

            const data = await response.json();
            if (data.success && data.data) {
                // Find progress for current content
                const savedProgress = data.data.find(item => item.contentId === this.contentId);

                if (savedProgress && savedProgress.currentTime > 0) {
                    console.log(`📼 Resuming from ${Math.round(savedProgress.progress)}%`);

                    // If it's a TV show with saved episode info, load that episode
                    if (this.contentId.startsWith('tv_') && savedProgress.episodeNumber !== null && savedProgress.episodeNumber !== undefined) {
                        console.log(`📺 Resuming at S${savedProgress.seasonNumber}E${savedProgress.episodeNumber} - ${savedProgress.episodeTitle}`);

                        // Find the episode index that matches
                        const episodeIndex = this.episodes.findIndex(ep =>
                            ep.episodeNumber === savedProgress.episodeNumber &&
                            ep.seasonNumber === savedProgress.seasonNumber
                        );

                        if (episodeIndex >= 0) {
                            this.currentEpisodeIndex = episodeIndex;
                            this.renderEpisodes(); // Update UI to highlight current episode
                            console.log(`✅ Set current episode index to ${episodeIndex}`);
                        }
                    }

                    if (this.isMockPlayback) {
                        // Restore mock playback position
                        this.mockCurrentTime = savedProgress.currentTime;
                        const progress = (this.mockCurrentTime / this.mockDuration) * 100;
                        this.progressFill.style.width = `${progress}%`;
                        this.progressHandle.style.left = `${progress}%`;
                        this.currentTimeEl.textContent = this.formatTime(this.mockCurrentTime);
                    } else {
                        // Restore real video position
                        if (this.video.readyState >= 2) {
                            this.video.currentTime = savedProgress.currentTime;
                        } else {
                            this.video.addEventListener('loadedmetadata', () => {
                                this.video.currentTime = savedProgress.currentTime;
                            }, { once: true });
                        }
                    }

                    this.lastSavedProgress = savedProgress.progress;
                }
            }
        } catch (error) {
            console.error('Error loading saved progress:', error);
        }
    }

    startProgressTracking() {
        // Save progress every 5 seconds
        this.progressSaveInterval = setInterval(() => {
            this.saveWatchProgress();
        }, 5000);
    }

    stopProgressTracking() {
        if (this.progressSaveInterval) {
            clearInterval(this.progressSaveInterval);
            this.progressSaveInterval = null;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.player = new VideoPlayer();
});
