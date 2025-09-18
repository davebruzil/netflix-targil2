// Netflix Clone - Admin Controller
// Complete admin panel functionality

class AdminController {
    constructor() {
        this.currentEditingId = null;
        this.episodeCount = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadContentLibrary();
        this.updateAnalytics();
    }
    
    setupEventListeners() {
        // Content form
        const contentForm = document.getElementById('content-form');
        if (contentForm) {
            contentForm.addEventListener('submit', (e) => this.handleAddContent(e));
        }
        
        // Content type change
        const contentType = document.getElementById('content-type');
        if (contentType) {
            contentType.addEventListener('change', (e) => this.toggleContentTypeFields(e.target.value));
        }
        
        // File uploads
        this.setupFileUploads();
        
        // IMDB fetch
        const fetchImdbBtn = document.getElementById('fetch-imdb-btn');
        if (fetchImdbBtn) {
            fetchImdbBtn.addEventListener('click', () => this.fetchIMDBData());
        }
        
        // Episodes
        const addEpisodeBtn = document.getElementById('add-episode-btn');
        if (addEpisodeBtn) {
            addEpisodeBtn.addEventListener('click', () => this.addEpisodeRow());
        }
        
        // Reset form
        const resetFormBtn = document.getElementById('reset-form-btn');
        if (resetFormBtn) {
            resetFormBtn.addEventListener('click', () => this.resetForm());
        }
        
        // Search and filter
        const searchInput = document.getElementById('search-content');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterContent(e.target.value));
        }
        
        const filterType = document.getElementById('filter-type');
        if (filterType) {
            filterType.addEventListener('change', (e) => this.filterContentByType(e.target.value));
        }
        
        // Edit modal
        const saveEditBtn = document.getElementById('save-edit-btn');
        if (saveEditBtn) {
            saveEditBtn.addEventListener('click', () => this.saveEdit());
        }
        
        // Tab switching
        const tabs = document.querySelectorAll('[data-bs-toggle="tab"]');
        tabs.forEach(tab => {
            tab.addEventListener('shown.bs.tab', (e) => {
                if (e.target.id === 'manage-content-tab') {
                    this.loadContentLibrary();
                } else if (e.target.id === 'analytics-tab') {
                    this.updateAnalytics();
                }
            });
        });
    }
    
    setupFileUploads() {
        // Poster upload
        const posterUploadArea = document.getElementById('poster-upload-area');
        const posterFile = document.getElementById('poster-file');
        
        if (posterUploadArea && posterFile) {
            posterUploadArea.addEventListener('click', () => posterFile.click());
            posterUploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
            posterUploadArea.addEventListener('drop', (e) => this.handleFileDrop(e, posterFile));
            posterFile.addEventListener('change', (e) => this.handleFileSelect(e, 'poster'));
        }
        
        // Video upload
        const videoUploadArea = document.getElementById('video-upload-area');
        const videoFile = document.getElementById('video-file');
        
        if (videoUploadArea && videoFile) {
            videoUploadArea.addEventListener('click', () => videoFile.click());
            videoUploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
            videoUploadArea.addEventListener('drop', (e) => this.handleFileDrop(e, videoFile));
            videoFile.addEventListener('change', (e) => this.handleFileSelect(e, 'video'));
        }
    }
    
    toggleContentTypeFields(type) {
        const episodesSection = document.getElementById('episodes-section');
        const durationSection = document.getElementById('duration-section');
        
        if (type === 'series') {
            episodesSection.style.display = 'block';
            durationSection.style.display = 'none';
        } else {
            episodesSection.style.display = 'none';
            durationSection.style.display = 'block';
        }
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    }
    
    handleFileDrop(e, fileInput) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            this.handleFileSelect({ target: fileInput }, fileInput.id.includes('poster') ? 'poster' : 'video');
        }
    }
    
    handleFileSelect(e, type) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validate file
        if (type === 'poster') {
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file for the poster.');
                return;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB
                alert('Poster image must be smaller than 5MB.');
                return;
            }
        } else if (type === 'video') {
            if (file.type !== 'video/mp4') {
                alert('Please select an MP4 video file.');
                return;
            }
            if (file.size > 500 * 1024 * 1024) { // 500MB
                alert('Video file must be smaller than 500MB.');
                return;
            }
        }
        
        // Show upload progress (simulated)
        this.simulateFileUpload(type, file);
    }
    
    simulateFileUpload(type, file) {
        const uploadArea = document.getElementById(`${type}-upload-area`);
        const progressDiv = uploadArea.parentElement.querySelector('.upload-progress');
        const progressBar = progressDiv.querySelector('.progress-bar');
        
        uploadArea.style.display = 'none';
        progressDiv.style.display = 'block';
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 100) progress = 100;
            
            progressBar.style.width = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    progressDiv.style.display = 'none';
                    uploadArea.style.display = 'block';
                    
                    // Update upload area to show success
                    const content = uploadArea.querySelector('.upload-content');
                    content.innerHTML = `
                        <div class="mb-2">✅</div>
                        <div>${file.name}</div>
                        <small class="text-success">Upload complete</small>
                    `;
                }, 500);
            }
        }, 200);
    }
    
    addEpisodeRow() {
        this.episodeCount++;
        const container = document.getElementById('episodes-container');
        
        const episodeRow = document.createElement('div');
        episodeRow.className = 'episode-row';
        episodeRow.innerHTML = `
            <h6 class="text-white mb-3">Episode ${this.episodeCount}</h6>
            <div class="row mb-3">
                <div class="col-md-8">
                    <label class="form-label text-white">Episode Title</label>
                    <input type="text" class="form-control episode-title" placeholder="Episode title" required>
                </div>
                <div class="col-md-4">
                    <label class="form-label text-white">Duration (minutes)</label>
                    <input type="number" class="form-control episode-duration" placeholder="45" min="1" required>
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label text-white">Episode Synopsis</label>
                <textarea class="form-control episode-synopsis" rows="2" placeholder="Episode description" required></textarea>
            </div>
            <div class="mb-3">
                <label class="form-label text-white">Episode Video URL</label>
                <input type="url" class="form-control episode-video" placeholder="https://example.com/episode.mp4" required>
            </div>
            <button type="button" class="btn btn-outline-danger btn-sm" onclick="this.parentElement.remove()">
                Remove Episode
            </button>
        `;
        
        container.appendChild(episodeRow);
    }
    
    async fetchIMDBData() {
        const imdbId = document.getElementById('imdb-id').value.trim();
        if (!imdbId) {
            alert('Please enter an IMDB ID');
            return;
        }
        
        const statusSpan = document.getElementById('api-status');
        statusSpan.style.display = 'inline';
        statusSpan.className = 'api-status loading';
        statusSpan.textContent = 'Fetching...';
        
        try {
            // Simulate API call (replace with actual IMDB API integration)
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Mock data for demonstration
            const mockData = {
                title: 'Mock Movie Title',
                year: 2023,
                genre: 'Action, Drama',
                director: 'Mock Director',
                actors: 'Actor 1, Actor 2, Actor 3',
                plot: 'This is a mock plot description from IMDB API.',
                rating: '7.5',
                poster: 'https://picsum.photos/400/600?random=99'
            };
            
            // Populate form fields
            document.getElementById('content-title').value = mockData.title;
            document.getElementById('content-year').value = mockData.year;
            document.getElementById('content-genre').value = mockData.genre;
            document.getElementById('content-director').value = mockData.director;
            document.getElementById('content-actors').value = mockData.actors;
            document.getElementById('content-synopsis').value = mockData.plot;
            document.getElementById('content-rating').value = mockData.rating;
            
            statusSpan.className = 'api-status success';
            statusSpan.textContent = 'Data fetched successfully';
            
            // Show external rating
            document.getElementById('external-rating').textContent = `IMDB: ${mockData.rating}/10`;
            
        } catch (error) {
            statusSpan.className = 'api-status error';
            statusSpan.textContent = 'Failed to fetch data';
            console.error('IMDB fetch error:', error);
        }
        
        setTimeout(() => {
            statusSpan.style.display = 'none';
        }, 3000);
    }
    
    handleAddContent(e) {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const spinner = submitBtn.querySelector('.spinner-border');
        
        // Show loading state
        spinner.style.display = 'inline-block';
        submitBtn.disabled = true;
        
        // Collect form data
        const formData = this.collectFormData();
        
        // Validate form
        if (!this.validateFormData(formData)) {
            spinner.style.display = 'none';
            submitBtn.disabled = false;
            return;
        }
        
        // Simulate processing delay
        setTimeout(() => {
            try {
                // Add content to data manager
                NetflixData.addContent(formData);
                
                // Reset form
                this.resetForm();
                
                // Show success message
                alert('Content added successfully!');
                
                // Update analytics
                this.updateAnalytics();
                
                // Switch to manage tab
                document.getElementById('manage-content-tab').click();
                
            } catch (error) {
                console.error('Error adding content:', error);
                alert('Error adding content. Please try again.');
            } finally {
                spinner.style.display = 'none';
                submitBtn.disabled = false;
            }
        }, 1500);
    }
    
    collectFormData() {
        const data = {
            title: document.getElementById('content-title').value,
            type: document.getElementById('content-type').value,
            year: parseInt(document.getElementById('content-year').value),
            genre: document.getElementById('content-genre').value,
            director: document.getElementById('content-director').value,
            actors: document.getElementById('content-actors').value.split(',').map(s => s.trim()),
            synopsis: document.getElementById('content-synopsis').value,
            rating: parseFloat(document.getElementById('content-rating').value),
            poster: 'https://picsum.photos/400/600?random=' + Math.floor(Math.random() * 100),
            thumbnail: 'https://picsum.photos/300/400?random=' + Math.floor(Math.random() * 100),
            videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
        };
        
        if (data.type === 'movie') {
            data.duration = parseInt(document.getElementById('content-duration').value) * 60; // Convert to seconds
        } else {
            // Collect episodes
            data.episodes = [];
            data.duration = 0; // Will be calculated from episodes
            
            const episodeRows = document.querySelectorAll('.episode-row');
            episodeRows.forEach((row, index) => {
                const title = row.querySelector('.episode-title').value;
                const duration = parseInt(row.querySelector('.episode-duration').value) * 60; // Convert to seconds
                const synopsis = row.querySelector('.episode-synopsis').value;
                const videoUrl = row.querySelector('.episode-video').value;
                
                data.episodes.push({
                    id: `${data.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-e${index + 1}`,
                    title,
                    duration,
                    synopsis,
                    videoUrl
                });
                
                data.duration += duration; // Add to total series duration
            });
        }
        
        return data;
    }
    
    validateFormData(data) {
        if (!data.title || !data.type || !data.year || !data.genre || !data.director || 
            !data.actors.length || !data.synopsis || !data.rating) {
            alert('Please fill in all required fields.');
            return false;
        }
        
        if (data.type === 'series' && data.episodes.length === 0) {
            alert('Please add at least one episode for TV series.');
            return false;
        }
        
        if (data.type === 'movie' && !data.duration) {
            alert('Please specify the movie duration.');
            return false;
        }
        
        return true;
    }
    
    resetForm() {
        const form = document.getElementById('content-form');
        if (form) form.reset();
        
        // Reset episodes
        const episodesContainer = document.getElementById('episodes-container');
        if (episodesContainer) episodesContainer.innerHTML = '';
        this.episodeCount = 0;
        
        // Reset upload areas
        this.resetUploadArea('poster');
        this.resetUploadArea('video');
        
        // Hide type-specific sections
        document.getElementById('episodes-section').style.display = 'none';
        document.getElementById('duration-section').style.display = 'block';
        
        // Clear API status
        document.getElementById('api-status').style.display = 'none';
        document.getElementById('external-rating').textContent = '';
    }
    
    resetUploadArea(type) {
        const uploadArea = document.getElementById(`${type}-upload-area`);
        const content = uploadArea.querySelector('.upload-content');
        
        if (type === 'poster') {
            content.innerHTML = `
                <div class="mb-2">🖼️</div>
                <div>Click or drag poster image here</div>
                <small class="text-muted">JPG, PNG, WebP (Max 5MB)</small>
            `;
        } else {
            content.innerHTML = `
                <div class="mb-2">🎬</div>
                <div>Click or drag video file here</div>
                <small class="text-muted">MP4 only (Max 500MB)</small>
            `;
        }
    }
    
    loadContentLibrary() {
        const tbody = document.getElementById('content-table-body');
        if (!tbody) return;
        
        const allContent = NetflixData.getAllContent();
        tbody.innerHTML = '';
        
        if (allContent.length === 0) {
            document.getElementById('no-content-message').style.display = 'block';
            return;
        }
        
        document.getElementById('no-content-message').style.display = 'none';
        
        allContent.forEach(content => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="text-white">${content.title}</td>
                <td><span class="badge ${content.type === 'movie' ? 'bg-primary' : 'bg-success'}">${content.type}</span></td>
                <td class="text-light">${content.year}</td>
                <td class="text-light">${content.genre}</td>
                <td class="text-light">⭐ ${content.rating}/10</td>
                <td>
                    <button class="btn btn-sm btn-outline-light me-2" onclick="window.adminController.editContent('${content.id}')">
                        Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="window.adminController.deleteContent('${content.id}')">
                        Delete
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    filterContent(searchTerm) {
        const tbody = document.getElementById('content-table-body');
        const rows = tbody.querySelectorAll('tr');
        
        rows.forEach(row => {
            const title = row.cells[0].textContent.toLowerCase();
            const genre = row.cells[3].textContent.toLowerCase();
            
            if (title.includes(searchTerm.toLowerCase()) || genre.includes(searchTerm.toLowerCase())) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
    
    filterContentByType(type) {
        const tbody = document.getElementById('content-table-body');
        const rows = tbody.querySelectorAll('tr');
        
        rows.forEach(row => {
            const contentType = row.cells[1].textContent.toLowerCase();
            
            if (!type || contentType.includes(type)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
    
    editContent(contentId) {
        const content = NetflixData.getContentById(contentId);
        if (!content) return;
        
        this.currentEditingId = contentId;
        
        // Populate edit form
        document.getElementById('edit-content-id').value = contentId;
        document.getElementById('edit-title').value = content.title;
        document.getElementById('edit-year').value = content.year;
        document.getElementById('edit-genre').value = content.genre;
        document.getElementById('edit-rating').value = content.rating;
        document.getElementById('edit-synopsis').value = content.synopsis;
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editModal'));
        modal.show();
    }
    
    saveEdit() {
        if (!this.currentEditingId) return;
        
        const updates = {
            title: document.getElementById('edit-title').value,
            year: parseInt(document.getElementById('edit-year').value),
            genre: document.getElementById('edit-genre').value,
            rating: parseFloat(document.getElementById('edit-rating').value),
            synopsis: document.getElementById('edit-synopsis').value
        };
        
        NetflixData.updateContent(this.currentEditingId, updates);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
        modal.hide();
        
        // Reload library
        this.loadContentLibrary();
        this.updateAnalytics();
        
        alert('Content updated successfully!');
    }
    
    deleteContent(contentId) {
        const content = NetflixData.getContentById(contentId);
        if (!content) return;
        
        if (confirm(`Are you sure you want to delete "${content.title}"?`)) {
            NetflixData.deleteContent(contentId);
            this.loadContentLibrary();
            this.updateAnalytics();
            alert('Content deleted successfully!');
        }
    }
    
    updateAnalytics() {
        const allContent = NetflixData.getAllContent();
        const movies = allContent.filter(c => c.type === 'movie');
        const series = allContent.filter(c => c.type === 'series');
        const avgRating = allContent.length > 0 
            ? (allContent.reduce((sum, c) => sum + c.rating, 0) / allContent.length).toFixed(1)
            : 0;
        
        // Update counters
        document.getElementById('total-content').textContent = allContent.length;
        document.getElementById('total-movies').textContent = movies.length;
        document.getElementById('total-series').textContent = series.length;
        document.getElementById('avg-rating').textContent = avgRating;
        
        // Update popular content table
        this.updatePopularContent(allContent);
    }
    
    updatePopularContent(content) {
        const tbody = document.getElementById('popular-content-body');
        if (!tbody) return;
        
        // Sort by rating (simulating popularity)
        const popular = [...content]
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 5);
        
        tbody.innerHTML = '';
        
        popular.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="text-white">#${index + 1}</td>
                <td class="text-white">${item.title}</td>
                <td><span class="badge ${item.type === 'movie' ? 'bg-primary' : 'bg-success'}">${item.type}</span></td>
                <td class="text-light">⭐ ${item.rating}/10</td>
                <td class="text-light">${Math.floor(Math.random() * 10000)}K</td>
            `;
            tbody.appendChild(row);
        });
    }
}