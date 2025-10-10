class AdminManager {
    constructor() {
        this.apiConfig = window.AppConfig;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAdminSession();
    }

    setupEventListeners() {
        document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAdminLogin();
        });

        document.getElementById('contentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleContentSubmission();
        });

        this.setupFileUploads();
    }

    setupFileUploads() {
        const fileInputs = ['posterFile', 'backdropFile', 'videoFile'];
        
        fileInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            const uploadArea = input.closest('.file-upload-area');
            
            input.addEventListener('change', (e) => {
                this.handleFileUpload(e.target, uploadArea);
            });

            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    input.files = files;
                    this.handleFileUpload(input, uploadArea);
                }
            });
        });
    }

    handleFileUpload(input, uploadArea) {
        const file = input.files[0];
        if (!file) return;

        const previewId = input.id.replace('File', 'Preview');
        const uploadTextId = input.id.replace('File', 'UploadText');
        const preview = document.getElementById(previewId);
        const uploadText = document.getElementById(uploadTextId);

        if (input.id === 'videoFile') {
            preview.innerHTML = `
                <div class="text-center">
                    <i class="fas fa-video fa-2x mb-2 text-success"></i>
                    <p class="mb-1">${file.name}</p>
                    <small class="text-muted">${this.formatFileSize(file.size)}</small>
                </div>
            `;
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `
                    <img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 150px; border-radius: 5px;">
                    <p class="mt-2 mb-0 small">${file.name}</p>
                `;
            };
            reader.readAsDataURL(file);
        }

        uploadText.style.display = 'none';
        preview.style.display = 'block';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async checkAdminSession() {
        try {
            const response = await fetch(`${this.apiConfig.get('BACKEND_URL')}/auth/admin/status`, {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data.isAdmin) {
                    this.showAdminPanel();
                }
            }
        } catch (error) {
            console.log('No admin session found');
        }
    }

    async handleAdminLogin() {
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;
        const errorDiv = document.getElementById('adminError');

        try {
            const response = await fetch(`${this.apiConfig.get('BACKEND_URL')}/auth/admin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                this.showAdminPanel();
                errorDiv.style.display = 'none';
            } else {
                errorDiv.textContent = data.message || 'Login failed';
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            errorDiv.textContent = 'Connection error. Please try again.';
            errorDiv.style.display = 'block';
        }
    }

    showAdminPanel() {
        document.getElementById('adminLogin').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
    }

    async adminLogout() {
        try {
            await fetch(`${this.apiConfig.get('BACKEND_URL')}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            
            document.getElementById('adminLogin').style.display = 'block';
            document.getElementById('adminPanel').style.display = 'none';
            document.getElementById('adminLoginForm').reset();
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    async fetchRatings() {
        const title = document.getElementById('contentTitle').value;
        const year = document.getElementById('contentYear').value;

        if (!title) {
            this.showMessage('Please enter a title first', 'warning');
            return;
        }

        try {
            const response = await fetch(`${this.apiConfig.get('BACKEND_URL')}/content/admin/ratings/${encodeURIComponent(title)}?year=${year}`, {
                method: 'GET',
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                this.displayRatings(data.data);
            } else {
                this.showMessage('Failed to fetch ratings', 'danger');
            }
        } catch (error) {
            this.showMessage('Error fetching ratings', 'danger');
        }
    }

    displayRatings(ratings) {
        const ratingsDisplay = document.getElementById('ratingsDisplay');
        const imdbRating = document.getElementById('imdbRating');
        const rtRating = document.getElementById('rtRating');

        if (ratings.imdb && ratings.imdb.rating) {
            imdbRating.textContent = `${ratings.imdb.rating}/10`;
        } else {
            imdbRating.textContent = 'N/A';
        }

        if (ratings.rottenTomatoes && ratings.rottenTomatoes.rating) {
            rtRating.textContent = `${ratings.rottenTomatoes.rating}%`;
        } else {
            rtRating.textContent = 'N/A';
        }

        ratingsDisplay.style.display = 'block';
    }

    async handleContentSubmission() {
        const formData = new FormData();
        const messageDiv = document.getElementById('formMessage');

        const title = document.getElementById('contentTitle').value;
        const description = document.getElementById('contentDescription').value;
        const category = document.getElementById('contentCategory').value;
        const year = document.getElementById('contentYear').value;
        const genre = document.getElementById('contentGenre').value;
        const director = document.getElementById('contentDirector').value;
        const cast = document.getElementById('contentCast').value;
        const runtime = document.getElementById('contentRuntime').value;
        const section = document.getElementById('contentSection').value;

        const posterFile = document.getElementById('posterFile').files[0];
        const backdropFile = document.getElementById('backdropFile').files[0];
        const videoFile = document.getElementById('videoFile').files[0];

        // Append text fields to FormData
        formData.append('title', title);
        formData.append('description', description || 'A sample movie for testing purposes.');
        formData.append('category', category || 'Movie');
        formData.append('year', year || '2024');
        formData.append('genre', genre || 'Action');
        formData.append('director', director || 'Unknown');
        formData.append('cast', cast || 'Unknown');
        formData.append('runtime', runtime || '2h 15min');
        formData.append('section', section || 'movies');

        // Append files to FormData (only if provided)
        if (posterFile) {
            formData.append('posterImage', posterFile);
        }
        if (backdropFile) {
            formData.append('backdropImage', backdropFile);
        }
        if (videoFile) {
            formData.append('videoFile', videoFile);
        }

        // Show upload progress message for large files
        if (videoFile && videoFile.size > 10 * 1024 * 1024) { // > 10MB
            this.showMessage(`Uploading large video file (${this.formatFileSize(videoFile.size)})... This may take several minutes.`, 'info');
        }

        try {
            console.log('Sending request to:', `${this.apiConfig.get('BACKEND_URL')}/content/admin/add`);
            console.log('Request data:', { title, description, category, year, genre });

            if (videoFile) {
                console.log('Video file size:', this.formatFileSize(videoFile.size));
            }

            const response = await fetch(`${this.apiConfig.get('BACKEND_URL')}/content/admin/add`, {
                method: 'POST',
                credentials: 'include',
                body: formData
                // Don't set Content-Type header - browser will set it automatically with boundary
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            const data = await response.json();

            if (data.success) {
                this.showMessage('Content added successfully!', 'success');
                document.getElementById('contentForm').reset();
                this.resetFileUploads();
                document.getElementById('ratingsDisplay').style.display = 'none';
            } else {
                this.showMessage(data.message || 'Failed to add content', 'danger');
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showMessage('Error adding content: ' + error.message, 'danger');
        }
    }

    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    resetFileUploads() {
        const fileInputs = ['posterFile', 'backdropFile', 'videoFile'];
        
        fileInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            const previewId = inputId.replace('File', 'Preview');
            const uploadTextId = inputId.replace('File', 'UploadText');
            
            input.value = '';
            document.getElementById(previewId).style.display = 'none';
            document.getElementById(uploadTextId).style.display = 'block';
        });
    }

    showMessage(message, type) {
        const messageDiv = document.getElementById('formMessage');
        messageDiv.textContent = message;
        messageDiv.className = `alert alert-${type} mt-3`;
        messageDiv.style.display = 'block';

        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}

window.adminLogout = function() {
    if (window.adminManager) {
        window.adminManager.adminLogout();
    }
};

window.fetchRatings = function() {
    if (window.adminManager) {
        window.adminManager.fetchRatings();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.adminManager = new AdminManager();
});
