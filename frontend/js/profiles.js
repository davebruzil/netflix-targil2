// Profile Management Script
// Handles dynamic loading and management of profiles from backend API

(() => {
    let allProfiles = [];
    let isLoading = false;

    /**
     * Initialize profiles page
     */
    async function initProfiles() {
        console.log('Initializing profiles page...');
        showLoadingState();
        
        try {
            await loadProfilesFromAPI();
            renderProfiles();
            setupEventListeners();
        } catch (error) {
            console.error('Error initializing profiles:', error);
            showErrorState('Failed to load profiles. Please try again.');
        }
    }

    /**
     * Load profiles from backend API
     */
    async function loadProfilesFromAPI() {
        try {
            console.log('Loading profiles from API...');
            isLoading = true;
            
            allProfiles = await NetflixAPI.getAllProfiles();
            console.log('Loaded profiles:', allProfiles);
            
            isLoading = false;
        } catch (error) {
            isLoading = false;
            throw error;
        }
    }

    /**
     * Render profiles dynamically
     */
    function renderProfiles() {
        const profilesContainer = document.getElementById('profiles-container');
        if (!profilesContainer) {
            console.error('Profiles container not found');
            return;
        }

        // Clear existing content
        profilesContainer.innerHTML = '';

        if (allProfiles.length === 0) {
            showEmptyState();
            return;
        }

        // Create profile elements
        allProfiles.forEach(profile => {
            const profileElement = createProfileElement(profile);
            profilesContainer.appendChild(profileElement);
        });

        // Add "Add Profile" button if less than max profiles
        if (allProfiles.length < 5) {
            const addProfileElement = createAddProfileElement();
            profilesContainer.appendChild(addProfileElement);
        }
    }

    /**
     * Create individual profile element
     */
    function createProfileElement(profile) {
        const profileDiv = document.createElement('div');
        profileDiv.className = 'profile-item';
        profileDiv.innerHTML = `
            <a href="#" onclick="selectProfile('${profile.id}', '${profile.name}')" style="text-decoration: none; color: inherit;">
                <div class="profile-avatar">
                    <img src="${profile.avatar}" alt="${profile.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" onerror="this.src='https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 20) + 1}'">
                </div>
                <div class="profile-name">${profile.name}</div>
            </a>
        `;
        return profileDiv;
    }

    /**
     * Create "Add Profile" element
     */
    function createAddProfileElement() {
        const addProfileDiv = document.createElement('div');
        addProfileDiv.className = 'profile-item add-profile';
        addProfileDiv.innerHTML = `
            <a href="#" onclick="showAddProfileModal()" style="text-decoration: none; color: inherit;">
                <div class="profile-avatar" style="display: flex; align-items: center; justify-content: center; background-color: #333; border: 2px dashed #666;">
                    <span style="font-size: 3rem; color: #666;">+</span>
                </div>
                <div class="profile-name">Add Profile</div>
            </a>
        `;
        return addProfileDiv;
    }

    /**
     * Show loading state
     */
    function showLoadingState() {
        const profilesContainer = document.getElementById('profiles-container');
        if (profilesContainer) {
            profilesContainer.innerHTML = `
                <div class="loading-state" style="text-align: center; padding: 50px; color: white;">
                    <div class="spinner" style="border: 4px solid #333; border-top: 4px solid #e50914; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                    <p>Loading profiles...</p>
                </div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
        }
    }

    /**
     * Show error state
     */
    function showErrorState(message) {
        const profilesContainer = document.getElementById('profiles-container');
        if (profilesContainer) {
            profilesContainer.innerHTML = `
                <div class="error-state" style="text-align: center; padding: 50px; color: white;">
                    <div style="font-size: 3rem; color: #e50914; margin-bottom: 20px;">⚠️</div>
                    <p>${message}</p>
                    <button onclick="location.reload()" style="background-color: #e50914; color: white; border: none; padding: 10px 20px; border-radius: 4px; margin-top: 20px; cursor: pointer;">
                        Try Again
                    </button>
                </div>
            `;
        }
    }

    /**
     * Show empty state
     */
    function showEmptyState() {
        const profilesContainer = document.getElementById('profiles-container');
        if (profilesContainer) {
            profilesContainer.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 50px; color: white;">
                    <div style="font-size: 3rem; margin-bottom: 20px;">👤</div>
                    <p>No profiles found</p>
                    <button onclick="showAddProfileModal()" style="background-color: #e50914; color: white; border: none; padding: 10px 20px; border-radius: 4px; margin-top: 20px; cursor: pointer;">
                        Create First Profile
                    </button>
                </div>
            `;
        }
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Handle "Manage Profiles" button
        const manageBtn = document.querySelector('.manage-profiles-btn');
        if (manageBtn && !manageBtn.hasAttribute('data-listener-added')) {
            manageBtn.addEventListener('click', showManageProfilesModal);
            manageBtn.setAttribute('data-listener-added', 'true');
        }
    }

    /**
     * Show add profile modal
     */
    window.showAddProfileModal = function() {
        const modalHtml = `
            <div id="add-profile-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 9999;">
                <div style="background: #141414; padding: 30px; border-radius: 8px; max-width: 400px; width: 90%;">
                    <h3 style="color: white; margin-bottom: 20px;">Add New Profile</h3>
                    <form id="add-profile-form">
                        <div style="margin-bottom: 15px;">
                            <label style="color: white; display: block; margin-bottom: 5px;">Profile Name:</label>
                            <input type="text" id="profile-name" required style="width: 100%; padding: 10px; border: 1px solid #333; background: #333; color: white; border-radius: 4px;">
                        </div>
                        <div style="display: flex; gap: 10px; justify-content: flex-end;">
                            <button type="button" onclick="closeAddProfileModal()" style="background: #333; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Cancel</button>
                            <button type="submit" style="background: #e50914; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Create Profile</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Handle form submission
        document.getElementById('add-profile-form').addEventListener('submit', handleAddProfile);
    };

    /**
     * Close add profile modal
     */
    window.closeAddProfileModal = function() {
        const modal = document.getElementById('add-profile-modal');
        if (modal) {
            modal.remove();
        }
    };

    /**
     * Handle add profile form submission
     */
    async function handleAddProfile(e) {
        e.preventDefault();
        
        const nameInput = document.getElementById('profile-name');
        const name = nameInput.value.trim();
        
        if (!name) {
            alert('Please enter a profile name');
            return;
        }
        
        // Generate profile ID from name
        const profileId = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        try {
            const profileData = {
                id: profileId,
                name: name,
                avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 20) + 1}`,
                preferences: { language: 'en' }
            };
            
            const newProfile = await NetflixAPI.createProfile(profileData);
            
            if (newProfile) {
                console.log('Profile created successfully:', newProfile);
                closeAddProfileModal();
                // Reload profiles
                await loadProfilesFromAPI();
                renderProfiles();
            } else {
                alert('Failed to create profile. Please try again.');
            }
        } catch (error) {
            console.error('Error creating profile:', error);
            alert('Failed to create profile. Please try again.');
        }
    }

    /**
     * Show manage profiles modal (placeholder)
     */
    function showManageProfilesModal() {
        alert('Profile management features coming soon! You can add new profiles using the + button.');
    }

    /**
     * Refresh profiles list
     */
    window.refreshProfiles = async function() {
        await loadProfilesFromAPI();
        renderProfiles();
    };

    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
        // Only initialize if we're on the profiles page
        if (window.location.pathname.includes('profiles.html') || 
            document.getElementById('profiles-container')) {
            initProfiles();
        }
    });

    // Export functions for global use
    window.ProfileManager = {
        init: initProfiles,
        refresh: window.refreshProfiles,
        loadProfiles: loadProfilesFromAPI,
        renderProfiles: renderProfiles
    };
})();