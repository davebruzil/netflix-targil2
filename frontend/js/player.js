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

        if (contentId) {
            this.loadContent(contentId);
        } else {
            this.loadSampleContent();
        }
    }

    async loadContent(contentId) {
        try {
            this.contentId = contentId;

            // Check if it's a TMDB content (movie_xxx or tv_xxx)
            if (contentId.startsWith('movie_') || contentId.startsWith('tv_')) {
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
            // No video file, generate sample
            this.generateSampleVideo();
        }

        this.generateEpisodes();
    }

    generateSampleVideo() {
        const canvas = document.createElement('canvas');
        canvas.width = 1920;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');

        // Create a black canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add Netflix-style text in center (for TMDB content)
        if (this.isTMDBContent) {
            ctx.fillStyle = '#e50914';
            ctx.font = 'bold 72px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Preview', canvas.width / 2, canvas.height / 2 - 40);

            ctx.fillStyle = '#999';
            ctx.font = '36px Arial';
            ctx.fillText('Content Not Available', canvas.width / 2, canvas.height / 2 + 40);
        } else {
            ctx.fillStyle = '#e50914';
            ctx.font = '48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Sample Video', canvas.width / 2, canvas.height / 2);

            ctx.fillStyle = '#fff';
            ctx.font = '24px Arial';
            ctx.fillText(this.currentContent.title, canvas.width / 2, canvas.height / 2 + 40);
        }

        const stream = canvas.captureStream(30);
        const mediaRecorder = new MediaRecorder(stream);
        const chunks = [];

        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            this.video.src = url;

            // Manually set duration to 60 seconds for TMDB content
            if (this.isTMDBContent) {
                this.video.addEventListener('loadedmetadata', () => {
                    // Override duration display
                    this.totalTimeEl.textContent = '1:00';
                }, { once: true });
            }
        };

        mediaRecorder.start();
        // Record for 60 seconds (1 minute) for TMDB content, 5 seconds for others
        const recordDuration = this.isTMDBContent ? 60000 : 5000;
        setTimeout(() => mediaRecorder.stop(), recordDuration);
    }

    generateEpisodes() {
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
        if (this.isPlaying) {
            this.video.pause();
        } else {
            this.video.play();
        }
    }

    updatePlayPauseButton(playing) {
        this.isPlaying = playing;
        const icon = this.playPauseBtn.querySelector('i');
        icon.className = playing ? 'fas fa-pause' : 'fas fa-play';
    }

    rewind(seconds) {
        this.video.currentTime = Math.max(0, this.video.currentTime - seconds);
    }

    forward(seconds) {
        this.video.currentTime = Math.min(this.video.duration, this.video.currentTime + seconds);
    }

    toggleMute() {
        this.video.muted = !this.video.muted;
        const icon = this.muteBtn.querySelector('i');
        icon.className = this.video.muted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
    }

    setVolume(value) {
        this.video.volume = value / 100;
        const icon = this.muteBtn.querySelector('i');
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
        this.video.currentTime = pos * this.video.duration;
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
        this.video.currentTime = progress * this.video.duration;
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
        
        this.generateSampleVideo();
        this.video.play();
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
}

document.addEventListener('DOMContentLoaded', () => {
    window.player = new VideoPlayer();
});
