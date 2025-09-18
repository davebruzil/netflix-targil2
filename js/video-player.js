// Netflix Clone - Video Player Controller
// Comprehensive video player functionality with custom controls

class VideoPlayerController {
    constructor(content, episodeId = null, startTime = 0) {
        this.content = content;
        this.episodeId = episodeId;
        this.currentEpisode = null;
        this.profileId = localStorage.getItem('netflix:profileId');
        
        // Get video elements
        this.video = document.getElementById('main-video');
        this.container = document.getElementById('video-container');
        this.controls = document.getElementById('video-controls');
        this.loadingSpinner = document.getElementById('loading-spinner');
        
        // Control elements
        this.playPauseBtn = document.getElementById('play-pause-btn');
        this.skipBackBtn = document.getElementById('skip-back-btn');
        this.skipForwardBtn = document.getElementById('skip-forward-btn');
        this.volumeBtn = document.getElementById('volume-btn');
        this.volumeSlider = document.getElementById('volume-slider');
        this.speedBtn = document.getElementById('speed-btn');
        this.speedMenu = document.getElementById('speed-menu');
        this.fullscreenBtn = document.getElementById('fullscreen-btn');
        
        // Progress elements
        this.progressContainer = document.getElementById('progress-container');
        this.progressFill = document.getElementById('progress-bar-fill');
        this.currentTimeDisplay = document.getElementById('current-time');
        this.totalTimeDisplay = document.getElementById('total-time');
        
        // Episode elements
        this.episodeInfo = document.getElementById('episode-info');
        this.nextEpisodeBtn = document.getElementById('next-episode-btn');
        
        // State
        this.isPlaying = false;
        this.isMuted = false;
        this.currentVolume = 1;
        this.currentSpeed = 1;
        this.progressUpdateInterval = null;
        this.controlsTimeout = null;
        this.saveProgressInterval = null;
        
        this.init(startTime);
    }
    
    async init(startTime = 0) {
        try {
            // Set up content
            this.setupContent();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Set up keyboard shortcuts
            this.setupKeyboardShortcuts();
            
            // Load video source
            await this.loadVideoSource();
            
            // Set start time if provided
            if (startTime > 0) {
                this.video.currentTime = startTime;
            }
            
            // Start progress saving
            this.startProgressSaving();
            
        } catch (error) {
            console.error('Error initializing video player:', error);
            this.showError('Failed to initialize video player');
        }
    }
    
    setupContent() {
        // Set page title
        document.getElementById('page-title').textContent = `Netflix - ${this.content.title}`;
        
        // Handle episodes
        if (this.content.type === 'series' && this.content.episodes) {
            if (this.episodeId) {
                this.currentEpisode = this.content.episodes.find(ep => ep.id === this.episodeId);
                if (this.currentEpisode) {
                    this.showEpisodeInfo();
                    this.setupNextEpisode();
                }
            } else {
                // Default to first episode
                this.currentEpisode = this.content.episodes[0];
                this.episodeId = this.currentEpisode.id;
                this.showEpisodeInfo();
                this.setupNextEpisode();
            }
        }
    }
    
    showEpisodeInfo() {
        if (!this.currentEpisode) return;
        
        const episodeNumber = this.content.episodes.findIndex(ep => ep.id === this.episodeId) + 1;
        
        document.getElementById('episode-title').textContent = this.currentEpisode.title;
        document.getElementById('episode-number').textContent = `S1:E${episodeNumber}`;
        this.episodeInfo.style.display = 'block';
    }
    
    setupNextEpisode() {
        if (!this.content.episodes || !this.currentEpisode) return;
        
        const currentIndex = this.content.episodes.findIndex(ep => ep.id === this.episodeId);
        const nextEpisode = this.content.episodes[currentIndex + 1];
        
        if (nextEpisode) {
            this.nextEpisodeBtn.style.display = 'block';
            this.nextEpisodeBtn.onclick = () => this.playNextEpisode();
            
            // Show next episode button in last 30 seconds
            this.video.addEventListener('timeupdate', () => {
                if (this.video.duration - this.video.currentTime <= 30) {
                    this.nextEpisodeBtn.style.display = 'block';
                } else if (this.video.duration - this.video.currentTime > 30) {
                    this.nextEpisodeBtn.style.display = 'none';
                }
            });
        }
    }
    
    async loadVideoSource() {
        const videoUrl = this.currentEpisode ? this.currentEpisode.videoUrl : this.content.videoUrl;
        
        if (!videoUrl) {
            throw new Error('No video URL available');
        }
        
        this.video.src = videoUrl;
        
        // Show loading spinner
        this.loadingSpinner.style.display = 'block';
        
        return new Promise((resolve, reject) => {
            this.video.addEventListener('loadedmetadata', () => {
                this.loadingSpinner.style.display = 'none';
                this.updateTimeDisplay();
                resolve();
            });
            
            this.video.addEventListener('error', () => {
                this.loadingSpinner.style.display = 'none';
                reject(new Error('Failed to load video'));
            });
        });
    }
    
    setupEventListeners() {
        // Play/Pause
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.video.addEventListener('click', () => this.togglePlayPause());
        
        // Skip buttons
        this.skipBackBtn.addEventListener('click', () => this.skipTime(-10));
        this.skipForwardBtn.addEventListener('click', () => this.skipTime(10));
        
        // Volume controls
        this.volumeBtn.addEventListener('click', () => this.toggleMute());
        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value / 100));
        
        // Speed controls
        this.speedBtn.addEventListener('click', () => this.toggleSpeedMenu());
        this.speedMenu.addEventListener('click', (e) => {
            if (e.target.classList.contains('speed-option')) {
                this.setPlaybackSpeed(parseFloat(e.target.dataset.speed));
            }
        });
        
        // Fullscreen
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        
        // Progress bar
        this.progressContainer.addEventListener('click', (e) => this.seekToPosition(e));
        this.progressContainer.addEventListener('mousemove', (e) => this.showProgressPreview(e));
        
        // Video events
        this.video.addEventListener('timeupdate', () => this.updateProgress());
        this.video.addEventListener('loadedmetadata', () => this.updateTimeDisplay());
        this.video.addEventListener('ended', () => this.handleVideoEnd());
        this.video.addEventListener('play', () => this.handlePlay());
        this.video.addEventListener('pause', () => this.handlePause());
        this.video.addEventListener('waiting', () => this.showLoadingSpinner());
        this.video.addEventListener('canplay', () => this.hideLoadingSpinner());
        
        // Controls visibility
        this.container.addEventListener('mousemove', () => this.showControls());
        this.container.addEventListener('mouseleave', () => this.hideControlsDelayed());
        this.controls.addEventListener('mouseenter', () => this.cancelHideControls());
        this.controls.addEventListener('mouseleave', () => this.hideControlsDelayed());
        
        // Fullscreen events
        document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('webkitfullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('mozfullscreenchange', () => this.handleFullscreenChange());
        
        // Click outside speed menu to close
        document.addEventListener('click', (e) => {
            if (!this.speedBtn.contains(e.target) && !this.speedMenu.contains(e.target)) {
                this.speedMenu.style.display = 'none';
            }
        });
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Prevent default browser shortcuts
            if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
                e.preventDefault();
            }
            
            switch (e.code) {
                case 'Space':
                    this.togglePlayPause();
                    break;
                case 'ArrowLeft':
                    this.skipTime(-10);
                    break;
                case 'ArrowRight':
                    this.skipTime(10);
                    break;
                case 'ArrowUp':
                    this.adjustVolume(0.1);
                    break;
                case 'ArrowDown':
                    this.adjustVolume(-0.1);
                    break;
                case 'KeyM':
                    this.toggleMute();
                    break;
                case 'KeyF':
                    this.toggleFullscreen();
                    break;
                case 'Escape':
                    if (this.isFullscreen()) {
                        this.exitFullscreen();
                    }
                    break;
            }
        });
    }
    
    togglePlayPause() {
        if (this.video.paused) {
            this.play();
        } else {
            this.pause();
        }
    }
    
    play() {
        this.video.play();
    }
    
    pause() {
        this.video.pause();
    }
    
    handlePlay() {
        this.isPlaying = true;
        this.playPauseBtn.innerHTML = '⏸️';
        this.showControls();
        this.hideControlsDelayed();
    }
    
    handlePause() {
        this.isPlaying = false;
        this.playPauseBtn.innerHTML = '▶️';
        this.showControls();
        this.cancelHideControls();
    }
    
    skipTime(seconds) {
        this.video.currentTime = Math.max(0, Math.min(this.video.duration, this.video.currentTime + seconds));
        this.updateProgress();
        this.showControls();
    }
    
    toggleMute() {
        if (this.isMuted) {
            this.setVolume(this.currentVolume);
        } else {
            this.currentVolume = this.video.volume;
            this.setVolume(0);
        }
    }
    
    setVolume(volume) {
        volume = Math.max(0, Math.min(1, volume));
        this.video.volume = volume;
        this.volumeSlider.value = volume * 100;
        
        this.isMuted = volume === 0;
        
        if (this.isMuted) {
            this.volumeBtn.innerHTML = '🔇';
        } else if (volume < 0.5) {
            this.volumeBtn.innerHTML = '🔉';
        } else {
            this.volumeBtn.innerHTML = '🔊';
        }
    }
    
    adjustVolume(delta) {
        const newVolume = this.video.volume + delta;
        this.setVolume(newVolume);
        this.showControls();
    }
    
    toggleSpeedMenu() {
        const isVisible = this.speedMenu.style.display === 'block';
        this.speedMenu.style.display = isVisible ? 'none' : 'block';
    }
    
    setPlaybackSpeed(speed) {
        this.video.playbackRate = speed;
        this.currentSpeed = speed;
        this.speedBtn.textContent = `${speed}x`;
        
        // Update active speed option
        this.speedMenu.querySelectorAll('.speed-option').forEach(option => {
            option.classList.toggle('active', parseFloat(option.dataset.speed) === speed);
        });
        
        this.speedMenu.style.display = 'none';
    }
    
    toggleFullscreen() {
        if (this.isFullscreen()) {
            this.exitFullscreen();
        } else {
            this.enterFullscreen();
        }
    }
    
    enterFullscreen() {
        if (this.container.requestFullscreen) {
            this.container.requestFullscreen();
        } else if (this.container.webkitRequestFullscreen) {
            this.container.webkitRequestFullscreen();
        } else if (this.container.mozRequestFullScreen) {
            this.container.mozRequestFullScreen();
        }
    }
    
    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        }
    }
    
    isFullscreen() {
        return !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
    }
    
    handleFullscreenChange() {
        if (this.isFullscreen()) {
            this.fullscreenBtn.innerHTML = '⛷';
        } else {
            this.fullscreenBtn.innerHTML = '⛶';
        }
    }
    
    seekToPosition(e) {
        const rect = this.progressContainer.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        this.video.currentTime = pos * this.video.duration;
        this.updateProgress();
    }
    
    showProgressPreview(e) {
        // Could implement thumbnail preview here in the future
    }
    
    updateProgress() {
        if (!this.video.duration) return;
        
        const progress = (this.video.currentTime / this.video.duration) * 100;
        this.progressFill.style.width = `${progress}%`;
        
        this.updateTimeDisplay();
    }
    
    updateTimeDisplay() {
        if (!this.video.duration) return;
        
        this.currentTimeDisplay.textContent = this.formatTime(this.video.currentTime);
        this.totalTimeDisplay.textContent = this.formatTime(this.video.duration);
    }
    
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }
    
    showControls() {
        this.controls.classList.add('show');
        this.cancelHideControls();
    }
    
    hideControlsDelayed() {
        if (this.isPlaying) {
            this.controlsTimeout = setTimeout(() => {
                this.controls.classList.remove('show');
            }, 3000);
        }
    }
    
    cancelHideControls() {
        if (this.controlsTimeout) {
            clearTimeout(this.controlsTimeout);
            this.controlsTimeout = null;
        }
    }
    
    showLoadingSpinner() {
        this.loadingSpinner.style.display = 'block';
    }
    
    hideLoadingSpinner() {
        this.loadingSpinner.style.display = 'none';
    }
    
    handleVideoEnd() {
        this.isPlaying = false;
        this.playPauseBtn.innerHTML = '▶️';
        this.showControls();
        
        // Mark as completed
        this.markAsCompleted();
        
        // Auto-play next episode if available
        if (this.content.type === 'series' && this.currentEpisode) {
            const currentIndex = this.content.episodes.findIndex(ep => ep.id === this.episodeId);
            const nextEpisode = this.content.episodes[currentIndex + 1];
            
            if (nextEpisode) {
                // Show next episode countdown
                this.showNextEpisodeCountdown();
            }
        }
    }
    
    showNextEpisodeCountdown() {
        // Could implement countdown overlay here
        setTimeout(() => {
            if (confirm('Play next episode?')) {
                this.playNextEpisode();
            }
        }, 2000);
    }
    
    playNextEpisode() {
        if (!this.content.episodes || !this.currentEpisode) return;
        
        const currentIndex = this.content.episodes.findIndex(ep => ep.id === this.episodeId);
        const nextEpisode = this.content.episodes[currentIndex + 1];
        
        if (nextEpisode) {
            // Update URL
            const url = new URL(window.location);
            url.searchParams.set('episode', nextEpisode.id);
            url.searchParams.delete('t');
            window.history.replaceState({}, '', url);
            
            // Update controller state
            this.episodeId = nextEpisode.id;
            this.currentEpisode = nextEpisode;
            
            // Reload video
            this.setupContent();
            this.loadVideoSource().then(() => {
                this.play();
            });
        }
    }
    
    startProgressSaving() {
        this.saveProgressInterval = setInterval(() => {
            this.saveProgress();
        }, 10000); // Save every 10 seconds
    }
    
    saveProgress() {
        if (!this.profileId || !this.video.currentTime) return;
        
        const contentKey = this.currentEpisode ? `${this.content.id}-${this.episodeId}` : this.content.id;
        const duration = this.currentEpisode ? this.currentEpisode.duration : this.content.duration;
        const completed = this.video.currentTime >= duration * 0.9; // 90% watched = completed
        
        NetflixData.setUserProgress(this.profileId, contentKey, {
            currentTime: this.video.currentTime,
            duration: duration,
            completed: completed,
            contentId: this.content.id,
            episodeId: this.episodeId
        });
    }
    
    markAsCompleted() {
        if (!this.profileId) return;
        
        const contentKey = this.currentEpisode ? `${this.content.id}-${this.episodeId}` : this.content.id;
        const duration = this.currentEpisode ? this.currentEpisode.duration : this.content.duration;
        
        NetflixData.setUserProgress(this.profileId, contentKey, {
            currentTime: duration,
            duration: duration,
            completed: true,
            contentId: this.content.id,
            episodeId: this.episodeId
        });
    }
    
    showError(message) {
        this.loadingSpinner.style.display = 'none';
        document.getElementById('error-message').style.display = 'block';
        document.getElementById('error-message').querySelector('p').textContent = message;
    }
    
    destroy() {
        // Clean up intervals
        if (this.progressUpdateInterval) {
            clearInterval(this.progressUpdateInterval);
        }
        if (this.saveProgressInterval) {
            clearInterval(this.saveProgressInterval);
        }
        if (this.controlsTimeout) {
            clearTimeout(this.controlsTimeout);
        }
        
        // Save final progress
        this.saveProgress();
    }
}

// Clean up when page unloads
window.addEventListener('beforeunload', () => {
    if (window.videoPlayerController) {
        window.videoPlayerController.destroy();
    }
});