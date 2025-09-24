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

        // Add "Add Profile" button if less than max profiles (increased limit to 10)
        if (allProfiles.length < 10) {
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
            <div id="add-profile-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 9999; animation: fadeIn 0.3s ease-in;">
                <div style="background: linear-gradient(135deg, #141414 0%, #2a2a2a 100%); padding: 40px; border-radius: 12px; max-width: 450px; width: 90%; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid #333; animation: slideIn 0.3s ease-out;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="background: #e50914; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; font-size: 24px; color: white;">+</div>
                        <h3 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Add New Profile</h3>
                        <p style="color: #999; margin: 8px 0 0 0; font-size: 14px;">Create a personalized Netflix experience</p>
                    </div>
                    <form id="add-profile-form">
                        <div style="margin-bottom: 25px;">
                            <label style="color: white; display: block; margin-bottom: 8px; font-weight: 500; font-size: 14px;">Profile Name:</label>
                            <input type="text" id="profile-name" required maxlength="15" style="width: 100%; padding: 12px 15px; border: 1px solid #555; background: #333; color: white; border-radius: 6px; font-size: 16px; box-sizing: border-box; transition: border-color 0.3s ease;" placeholder="Enter a unique name" oninput="validateProfileName(this)">
                            <div id="name-feedback" style="color: #888; font-size: 12px; margin-top: 5px;"></div>
                        </div>
                        <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 30px;">
                            <button type="button" onclick="closeAddProfileModal()" style="background: #444; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.3s ease;" onmouseover="this.style.background='#555'" onmouseout="this.style.background='#444'">Cancel</button>
                            <button type="submit" id="create-profile-btn" style="background: #e50914; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.3s ease;" onmouseover="this.style.background='#f40612'" onmouseout="this.style.background='#e50914'">Create Profile</button>
                        </div>
                    </form>
                </div>
            </div>
            <style>
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                @keyframes slideIn {
                    from { transform: scale(0.9) translateY(-20px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }
                #profile-name:focus {
                    outline: none;
                    border-color: #e50914 !important;
                    box-shadow: 0 0 0 3px rgba(229, 9, 20, 0.2);
                }
            </style>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Focus on input field
        setTimeout(() => {
            document.getElementById('profile-name').focus();
        }, 100);
        
        // Handle form submission
        document.getElementById('add-profile-form').addEventListener('submit', handleAddProfile);
        
        // Add ESC key handler
        document.addEventListener('keydown', handleEscapeKey);
    };

    /**
     * Close add profile modal
     */
    window.closeAddProfileModal = function() {
        const modal = document.getElementById('add-profile-modal');
        if (modal) {
            modal.style.animation = 'fadeOut 0.2s ease-out';
            setTimeout(() => {
                modal.remove();
            }, 200);
        }
        document.removeEventListener('keydown', handleEscapeKey);
    };

    /**
     * Handle ESC key to close modal
     */
    function handleEscapeKey(e) {
        if (e.key === 'Escape') {
            closeAddProfileModal();
        }
    }

    /**
     * Validate profile name input
     */
    window.validateProfileName = function(input) {
        const name = input.value.trim();
        const feedback = document.getElementById('name-feedback');
        const createBtn = document.getElementById('create-profile-btn');
        
        if (!name) {
            feedback.textContent = '';
            createBtn.disabled = false;
            return;
        }
        
        if (name.length < 2) {
            feedback.textContent = 'Name must be at least 2 characters long';
            feedback.style.color = '#ff6b6b';
            createBtn.disabled = true;
        } else if (allProfiles.some(p => p.name.toLowerCase() === name.toLowerCase())) {
            feedback.textContent = 'A profile with this name already exists';
            feedback.style.color = '#ff6b6b';
            createBtn.disabled = true;
        } else {
            feedback.textContent = 'Looks good!';
            feedback.style.color = '#4ecdc4';
            createBtn.disabled = false;
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
            
            // Show loading state
            const createBtn = document.getElementById('create-profile-btn');
            const originalText = createBtn.textContent;
            createBtn.textContent = 'Creating...';
            createBtn.disabled = true;
            
            const newProfile = await NetflixAPI.createProfile(profileData);
            
            if (newProfile) {
                console.log('Profile created successfully:', newProfile);
                
                // Show success feedback
                createBtn.textContent = '✓ Created!';
                createBtn.style.background = '#4ecdc4';
                
                setTimeout(() => {
                    closeAddProfileModal();
                    // Reload profiles
                    loadProfilesFromAPI().then(() => {
                        renderProfiles();
                        // Show success toast
                        showSuccessToast(`Profile "${name}" created successfully!`);
                    });
                }, 800);
            } else {
                // Reset button on error
                createBtn.textContent = originalText;
                createBtn.disabled = false;
                createBtn.style.background = '#e50914';
                
                // Show error in feedback
                const feedback = document.getElementById('name-feedback');
                feedback.textContent = 'Failed to create profile. Please try again.';
                feedback.style.color = '#ff6b6b';
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
     * Show success toast notification
     */
    function showSuccessToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
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
        `;
        document.head.appendChild(style);
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
            style.remove();
        }, 4000);
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