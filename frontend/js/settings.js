// Settings Page - Profile Management
// Purpose: Manage user profiles (create, edit, delete)
// Dev: Yaron (Dev #2)

class SettingsManager {
    constructor() {
        this.currentUser = null;
        this.profiles = [];
        this.selectedAvatarUrl = null;
        this.avatarOptions = [
            'https://i.pravatar.cc/150?img=1',
            'https://i.pravatar.cc/150?img=2',
            'https://i.pravatar.cc/150?img=3',
            'https://i.pravatar.cc/150?img=4',
            'https://i.pravatar.cc/150?img=5',
            'https://i.pravatar.cc/150?img=6',
            'https://i.pravatar.cc/150?img=7',
            'https://i.pravatar.cc/150?img=8',
            'https://i.pravatar.cc/150?img=9',
            'https://i.pravatar.cc/150?img=10'
        ];
        this.dailyViewsChart = null;
        this.genreChart = null;
        this.init();
    }

    /**
     * Initialize settings page
     */
    async init() {
        console.log('Initializing settings page...');

        // Check authentication
        if (!NetflixAPI.isAuthenticated()) {
            console.log('User not authenticated, redirecting to login...');
            window.location.href = 'index.html';
            return;
        }

        // Get current user
        this.currentUser = NetflixAPI.getCurrentUser();
        if (!this.currentUser) {
            console.error('No current user found');
            window.location.href = 'index.html';
            return;
        }

        // Setup UI
        this.renderAvatarOptions();
        this.setupEventListeners();

        // Load profiles
        await this.loadProfiles();
    }

    /**
     * Render avatar selection grid
     */
    renderAvatarOptions() {
        const avatarContainer = document.getElementById('avatarOptions');
        if (!avatarContainer) return;

        avatarContainer.innerHTML = '';

        this.avatarOptions.forEach((avatarUrl, index) => {
            const img = document.createElement('img');
            img.src = avatarUrl;
            img.className = 'avatar-option' + (index === 0 ? ' selected' : '');
            img.alt = `Avatar ${index + 1}`;
            img.addEventListener('click', () => this.selectAvatar(img, avatarUrl));
            avatarContainer.appendChild(img);
        });

        // Select first avatar by default
        this.selectedAvatarUrl = this.avatarOptions[0];
        document.getElementById('selectedAvatar').value = this.selectedAvatarUrl;
    }

    /**
     * Handle avatar selection
     */
    selectAvatar(imgElement, avatarUrl) {
        // Remove selected class from all avatars
        document.querySelectorAll('.avatar-option').forEach(img => {
            img.classList.remove('selected');
        });

        // Add selected class to clicked avatar
        imgElement.classList.add('selected');
        this.selectedAvatarUrl = avatarUrl;
        document.getElementById('selectedAvatar').value = avatarUrl;
    }

    /**
     * Load and display user's profiles
     */
    async loadProfiles() {
        try {
            console.log('Loading profiles for user:', this.currentUser.id);
            this.profiles = await NetflixAPI.getAllProfiles();
            console.log('Loaded profiles:', this.profiles);

            this.updateProfileCount();
            this.renderProfiles();

            // Load statistics after profiles are loaded
            await this.loadStatistics();
        } catch (error) {
            console.error('Error loading profiles:', error);
            this.showError('Failed to load profiles. Please refresh the page.');
        }
    }

    /**
     * Render profiles in the list
     */
    renderProfiles() {
        const profilesList = document.getElementById('profilesList');
        if (!profilesList) return;

        if (this.profiles.length === 0) {
            profilesList.innerHTML = `
                <div class="empty-state">
                    <h4 style="color: #999;">No profiles yet</h4>
                    <p>Create your first profile using the form above!</p>
                </div>
            `;
            return;
        }

        profilesList.innerHTML = '';

        this.profiles.forEach(profile => {
            const profileCard = this.createProfileCard(profile);
            profilesList.appendChild(profileCard);
        });
    }

    /**
     * Create profile card element
     */
    createProfileCard(profile) {
        const card = document.createElement('div');
        card.className = 'profile-card';
        card.innerHTML = `
            <img src="${profile.avatar}" alt="${profile.name}" class="profile-card-avatar" onerror="this.src='https://via.placeholder.com/150/333/fff?text=${profile.name.charAt(0).toUpperCase()}'">
            <div class="profile-card-info">
                <div class="profile-card-name">${profile.name}</div>
                ${profile.isChild ? '<span class="profile-card-badge">Kids</span>' : ''}
            </div>
            <div class="profile-card-actions">
                <button class="btn-edit" data-profile-id="${profile.id}">Edit</button>
                <button class="btn-delete" data-profile-id="${profile.id}">Delete</button>
            </div>
        `;

        // Add event listeners
        const editBtn = card.querySelector('.btn-edit');
        const deleteBtn = card.querySelector('.btn-delete');

        editBtn.addEventListener('click', () => this.editProfile(profile.id));
        deleteBtn.addEventListener('click', () => this.deleteProfile(profile.id));

        return card;
    }

    /**
     * Setup form and button event listeners
     */
    setupEventListeners() {
        // Create profile form
        const createForm = document.getElementById('createProfileForm');
        if (createForm) {
            createForm.addEventListener('submit', (e) => this.handleCreateProfile(e));
        }

        // Profile name validation
        const profileNameInput = document.getElementById('profileName');
        if (profileNameInput) {
            profileNameInput.addEventListener('input', (e) => this.validateProfileName(e.target.value));
        }
    }

    /**
     * Validate profile name
     */
    validateProfileName(name) {
        const validation = document.getElementById('nameValidation');
        const createBtn = document.getElementById('createBtn');

        if (!name || name.trim().length === 0) {
            validation.textContent = '';
            createBtn.disabled = false;
            return true;
        }

        if (name.length < 2) {
            validation.textContent = 'Name must be at least 2 characters';
            validation.style.color = '#ff6b6b';
            createBtn.disabled = true;
            return false;
        }

        // Check for duplicate names
        const isDuplicate = this.profiles.some(p =>
            p.name.toLowerCase() === name.toLowerCase()
        );

        if (isDuplicate) {
            validation.textContent = 'A profile with this name already exists';
            validation.style.color = '#ff6b6b';
            createBtn.disabled = true;
            return false;
        }

        validation.textContent = '✓ Name available';
        validation.style.color = '#4ecdc4';
        createBtn.disabled = false;
        return true;
    }

    /**
     * Handle create profile form submission
     */
    async handleCreateProfile(e) {
        e.preventDefault();

        const name = document.getElementById('profileName').value.trim();
        const isChild = document.getElementById('isKidProfile').checked;
        const avatar = this.selectedAvatarUrl;

        // Validate
        if (!this.validateProfileName(name)) {
            return;
        }

        // Check profile limit
        if (this.profiles.length >= 5) {
            this.showError('Maximum of 5 profiles allowed');
            return;
        }

        const createBtn = document.getElementById('createBtn');
        const originalText = createBtn.textContent;

        try {
            createBtn.textContent = 'Creating...';
            createBtn.disabled = true;

            const profileData = {
                name: name,
                avatar: avatar || this.avatarOptions[0],
                isChild: isChild
            };

            console.log('Creating profile:', profileData);

            const newProfile = await NetflixAPI.createProfile(profileData);

            if (newProfile) {
                this.showSuccess(`Profile "${name}" created successfully!`);

                // Reset form
                document.getElementById('createProfileForm').reset();
                this.renderAvatarOptions();

                // Reload profiles
                await this.loadProfiles();

                createBtn.textContent = originalText;
                createBtn.disabled = false;
            } else {
                throw new Error('Failed to create profile');
            }
        } catch (error) {
            console.error('Error creating profile:', error);
            this.showError('Failed to create profile. Please try again.');
            createBtn.textContent = originalText;
            createBtn.disabled = false;
        }
    }

    /**
     * Edit existing profile
     */
    async editProfile(profileId) {
        const profile = this.profiles.find(p => p.id === profileId);
        if (!profile) {
            console.error('Profile not found:', profileId);
            return;
        }

        // Show edit modal/form
        const newName = prompt('Enter new name:', profile.name);
        if (!newName || newName.trim() === '') {
            return;
        }

        try {
            const updateData = {
                name: newName.trim()
            };

            const updated = await NetflixAPI.updateProfile(profileId, updateData);

            if (updated) {
                this.showSuccess('Profile updated successfully!');
                await this.loadProfiles();
            } else {
                throw new Error('Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showError('Failed to update profile. Please try again.');
        }
    }

    /**
     * Delete profile with confirmation
     */
    async deleteProfile(profileId) {
        const profile = this.profiles.find(p => p.id === profileId);
        if (!profile) {
            console.error('Profile not found:', profileId);
            return;
        }

        // Check if it's the last profile
        if (this.profiles.length <= 1) {
            this.showError('Cannot delete the last profile. You must have at least one profile.');
            return;
        }

        // Confirmation dialog
        const confirmed = confirm(`Are you sure you want to delete the profile "${profile.name}"? This action cannot be undone.`);
        if (!confirmed) {
            return;
        }

        try {
            const deleted = await NetflixAPI.deleteProfile(profileId);

            if (deleted) {
                this.showSuccess(`Profile "${profile.name}" deleted successfully!`);
                await this.loadProfiles();
            } else {
                throw new Error('Failed to delete profile');
            }
        } catch (error) {
            console.error('Error deleting profile:', error);
            this.showError('Failed to delete profile. Please try again.');
        }
    }

    /**
     * Update profile count display
     */
    updateProfileCount() {
        const profileCount = document.getElementById('profileCount');
        if (profileCount) {
            profileCount.textContent = this.profiles.length;
        }

        // Disable create form if at max profiles
        const createForm = document.getElementById('createProfileForm');
        const createBtn = document.getElementById('createBtn');

        if (this.profiles.length >= 5) {
            createBtn.disabled = true;
            createBtn.textContent = 'Maximum Profiles Reached';
            if (createForm) {
                Array.from(createForm.elements).forEach(el => {
                    if (el.tagName !== 'BUTTON') {
                        el.disabled = true;
                    }
                });
            }
        } else {
            createBtn.disabled = false;
            createBtn.textContent = 'Create Profile';
            if (createForm) {
                Array.from(createForm.elements).forEach(el => {
                    el.disabled = false;
                });
            }
        }
    }

    /**
     * Show success toast
     */
    showSuccess(message) {
        this.showToast(message, 'success');
    }

    /**
     * Show error toast
     */
    showError(message) {
        this.showToast(message, 'error');
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        const bgColor = type === 'success' ?
            'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)' :
            'linear-gradient(135deg, #e50914 0%, #b20710 100%)';

        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-size: 14px;
            font-weight: 500;
            animation: slideInRight 0.3s ease-out, fadeOut 0.3s ease-in 3.7s;
            max-width: 300px;
        `;
        toast.textContent = message;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
            style.remove();
        }, 4000);
    }

    /**
     * Load and render statistics charts
     */
    async loadStatistics() {
        try {
            console.log('Loading statistics for user:', this.currentUser.id);

            const response = await fetch(`${API_CONFIG.BASE_URL}/profiles/statistics/${this.currentUser.id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch statistics');
            }

            const result = await response.json();

            if (result.success) {
                console.log('Statistics data:', result.data);
                
                // Check if there's any data
                const hasViews = result.data.dailyViews.datasets && result.data.dailyViews.datasets.some(d => d.data.some(v => v > 0));
                const hasGenres = result.data.genrePopularity.data && result.data.genrePopularity.data.length > 0;
                
                if (!hasViews && !hasGenres) {
                    // Show demo data if no real data exists
                    console.log('No real data, showing demo data');
                    this.renderDemoStatistics();
                } else {
                    this.renderDailyViewsChart(result.data.dailyViews);
                    this.renderGenreChart(result.data.genrePopularity);
                }
            } else {
                console.error('Failed to load statistics:', result.error);
                this.renderDemoStatistics();
            }
        } catch (error) {
            console.error('Error loading statistics:', error);
            this.renderDemoStatistics();
        }
    }

    /**
     * Render demo statistics when no real data is available
     */
    renderDemoStatistics() {
        // Demo daily views data
        const demoDailyViews = {
            labels: ['10/8', '10/9', '10/10', '10/11', '10/12', '10/13', '10/14'],
            datasets: [
                {
                    label: 'Demo Profile',
                    data: [5, 8, 3, 12, 7, 9, 15],
                    backgroundColor: 'hsl(0, 70%, 50%)'
                }
            ]
        };

        // Demo genre data
        const demoGenreData = {
            labels: ['Action', 'Drama', 'Comedy', 'Thriller', 'Romance'],
            data: [25, 18, 12, 10, 8]
        };

        this.renderDailyViewsChart(demoDailyViews);
        this.renderGenreChart(demoGenreData);

        // Show message that this is demo data
        const statsSection = document.querySelector('.statistics-section');
        if (statsSection) {
            const demoNote = document.createElement('div');
            demoNote.className = 'alert alert-info mt-3';
            demoNote.style.cssText = 'background-color: #1a4d6d; border-color: #2a5d7d; color: #a8d8ff;';
            demoNote.innerHTML = '<strong>Note:</strong> Showing demo data. Start watching content and liking shows to see your real statistics!';
            statsSection.appendChild(demoNote);
        }
    }

    /**
     * Render daily views bar chart
     */
    renderDailyViewsChart(data) {
        const ctx = document.getElementById('dailyViewsChart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.dailyViewsChart) {
            this.dailyViewsChart.destroy();
        }

        this.dailyViewsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels || [],
                datasets: data.datasets || []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            color: '#e5e5e5',
                            font: {
                                size: 12
                            }
                        }
                    },
                    title: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#e5e5e5',
                            stepSize: 1
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#e5e5e5'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }

    /**
     * Render genre popularity pie chart
     */
    renderGenreChart(data) {
        const ctx = document.getElementById('genreChart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.genreChart) {
            this.genreChart.destroy();
        }

        // Generate colors for pie chart
        const colors = data.labels ? data.labels.map((_, index) => {
            const hue = (index * 360 / data.labels.length);
            return `hsl(${hue}, 70%, 60%)`;
        }) : [];

        this.genreChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.labels || [],
                datasets: [{
                    data: data.data || [],
                    backgroundColor: colors,
                    borderColor: '#2a2a2a',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                        labels: {
                            color: '#e5e5e5',
                            font: {
                                size: 11
                            },
                            padding: 10
                        }
                    },
                    title: {
                        display: false
                    }
                }
            }
        });
    }
}

/**
 * Global logout function
 */
window.netflixLogout = function() {
    NetflixAPI.logout();
    window.location.href = 'index.html';
};

// Initialize settings manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new SettingsManager();
});
