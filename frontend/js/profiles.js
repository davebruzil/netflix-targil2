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
        
        // Check if user is authenticated
        if (!NetflixAPI.isAuthenticated()) {
            console.log('User not authenticated, redirecting to login...');
            window.location.href = '/index.html';
            return;
        }
        
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

        // Update profile count
        const profileCountEl = document.getElementById('profileCount');
        if (profileCountEl) {
            profileCountEl.textContent = allProfiles.length;
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

        // Add "Add Profile" button if less than max profiles (5 max)
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

        if (isManageMode) {
            // In manage mode, show edit and delete buttons
            profileDiv.innerHTML = `
                <div style="position: relative;">
                    <div class="profile-avatar">
                        <img src="${profile.avatar}" alt="${profile.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" onerror="this.src='https://via.placeholder.com/150/333/fff?text=${profile.name.charAt(0).toUpperCase()}'">
                        <button onclick="window.editProfile('${profile.id}')" style="position: absolute; top: -10px; left: -10px; background: #555; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);" title="Edit Profile">✎</button>
                        <button onclick="window.deleteProfile('${profile.id}', '${profile.name}')" style="position: absolute; top: -10px; right: -10px; background: #e50914; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);" title="Delete Profile">×</button>
                    </div>
                    <div class="profile-name">${profile.name}</div>
                </div>
            `;
        } else {
            // Normal select mode
            profileDiv.innerHTML = `
                <a href="#" onclick="selectProfile('${profile.id}', '${profile.name}', '${profile.avatar}')" style="text-decoration: none; color: inherit;">
                    <div class="profile-avatar">
                        <img src="${profile.avatar}" alt="${profile.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" onerror="this.src='https://via.placeholder.com/150/333/fff?text=${profile.name.charAt(0).toUpperCase()}'">
                    </div>
                    <div class="profile-name">${profile.name}</div>
                </a>
            `;
        }

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
        // Manage Profiles button is now handled via onclick in HTML
    }

    /**
     * Show add profile modal
     */
    window.showAddProfileModal = function() {
        if (allProfiles.length >= 5) {
            alert('Maximum of 5 profiles reached. Please delete a profile before adding a new one.');
            return;
        }

        const avatarOptions = [
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

        const modalHtml = `
            <div id="add-profile-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 9999; animation: fadeIn 0.3s ease-in;">
                <div style="background: linear-gradient(135deg, #141414 0%, #2a2a2a 100%); padding: 40px; border-radius: 12px; max-width: 500px; width: 90%; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid #333; animation: slideIn 0.3s ease-out; max-height: 90vh; overflow-y: auto;">
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
                        <div style="margin-bottom: 25px;">
                            <label style="color: white; display: block; margin-bottom: 12px; font-weight: 500; font-size: 14px;">Select Avatar:</label>
                            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 15px;" id="avatar-grid">
                                ${avatarOptions.map((url, i) => `
                                    <img src="${url}"
                                         data-avatar="${url}"
                                         class="avatar-option ${i === 0 ? 'selected' : ''}"
                                         style="width: 60px; height: 60px; border-radius: 8px; cursor: pointer; border: 3px solid ${i === 0 ? '#e50914' : 'transparent'}; transition: all 0.2s ease; object-fit: cover;"
                                         onclick="selectAddAvatar('${url}')">
                                `).join('')}
                            </div>
                            <div style="margin-top: 15px;">
                                <label style="color: #999; display: block; margin-bottom: 8px; font-size: 13px;">Or upload custom image:</label>
                                <input type="file" id="avatar-upload" accept="image/*" style="display: none;">
                                <button type="button" onclick="document.getElementById('avatar-upload').click()" style="background: #444; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 13px; width: 100%;">Choose File</button>
                                <div id="upload-preview" style="margin-top: 10px; text-align: center;"></div>
                            </div>
                            <input type="hidden" id="selected-avatar" value="${avatarOptions[0]}">
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

        // Setup avatar selection
        window.selectAddAvatar = function(url) {
            document.querySelectorAll('.avatar-option').forEach(img => {
                img.style.border = '3px solid transparent';
                img.classList.remove('selected');
            });
            const selected = document.querySelector(`[data-avatar="${url}"]`);
            if (selected) {
                selected.style.border = '3px solid #e50914';
                selected.classList.add('selected');
            }
            document.getElementById('selected-avatar').value = url;
            document.getElementById('upload-preview').innerHTML = '';
        };

        // Handle file upload
        document.getElementById('avatar-upload').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // Check file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    alert('Image file is too large. Please choose an image smaller than 5MB.');
                    e.target.value = '';
                    return;
                }

                // Check file type
                if (!file.type.startsWith('image/')) {
                    alert('Please select a valid image file.');
                    e.target.value = '';
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(event) {
                    const dataUrl = event.target.result;
                    document.getElementById('selected-avatar').value = dataUrl;
                    document.getElementById('upload-preview').innerHTML = `
                        <img src="${dataUrl}" style="width: 80px; height: 80px; border-radius: 8px; border: 3px solid #e50914; object-fit: cover;">
                        <p style="color: #4ecdc4; font-size: 12px; margin-top: 5px;">Custom image selected</p>
                    `;
                    // Deselect preset avatars
                    document.querySelectorAll('.avatar-option').forEach(img => {
                        img.style.border = '3px solid transparent';
                        img.classList.remove('selected');
                    });
                };
                reader.readAsDataURL(file);
            }
        });

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
        const avatar = document.getElementById('selected-avatar')?.value;

        if (!name) {
            alert('Please enter a profile name');
            return;
        }

        if (name.length < 2) {
            alert('Profile name must be at least 2 characters');
            return;
        }

        if (!avatar) {
            alert('Please select an avatar');
            return;
        }

        try {
            const profileData = {
                name: name,
                avatar: avatar,
                isChild: false
            };
            
            // Check current user
            const currentUser = NetflixAPI.getCurrentUser();
            if (!currentUser) {
                alert('No user found. Please log in again.');
                return;
            }
            
            // Show loading state
            const createBtn = document.getElementById('create-profile-btn');
            const originalText = createBtn.textContent;
            createBtn.textContent = 'Creating...';
            createBtn.disabled = true;
            
            const newProfile = await NetflixAPI.createProfile(profileData);
            
            if (newProfile) {
                
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
    let isManageMode = false;

    /**
     * Toggle between select and manage mode
     */
    window.toggleManageMode = function() {
        isManageMode = !isManageMode;
        const btn = document.getElementById('manageProfilesBtn');

        if (isManageMode) {
            btn.textContent = 'Done';
            btn.style.backgroundColor = '#e50914';
            btn.style.color = 'white';
        } else {
            btn.textContent = 'Manage Profiles';
            btn.style.backgroundColor = '';
            btn.style.color = '';
        }

        renderProfiles();
    };

    /**
     * Edit profile - Show edit modal
     */
    window.editProfile = async function(profileId) {
        const profile = allProfiles.find(p => p.id === profileId);
        if (!profile) {
            alert('Profile not found');
            return;
        }

        const avatarOptions = [
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

        const modalHtml = `
            <div id="edit-profile-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 9999; animation: fadeIn 0.3s ease-in;">
                <div style="background: linear-gradient(135deg, #141414 0%, #2a2a2a 100%); padding: 40px; border-radius: 12px; max-width: 500px; width: 90%; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid #333; animation: slideIn 0.3s ease-out; max-height: 90vh; overflow-y: auto;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="background: #555; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; font-size: 24px; color: white;">✎</div>
                        <h3 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Edit Profile</h3>
                        <p style="color: #999; margin: 8px 0 0 0; font-size: 14px;">Update profile information</p>
                    </div>
                    <form id="edit-profile-form">
                        <div style="margin-bottom: 25px;">
                            <label style="color: white; display: block; margin-bottom: 8px; font-weight: 500; font-size: 14px;">Profile Name:</label>
                            <input type="text" id="edit-profile-name" value="${profile.name}" required maxlength="15" style="width: 100%; padding: 12px 15px; border: 1px solid #555; background: #333; color: white; border-radius: 6px; font-size: 16px; box-sizing: border-box; transition: border-color 0.3s ease;" placeholder="Enter a unique name">
                            <div id="edit-name-feedback" style="color: #888; font-size: 12px; margin-top: 5px;"></div>
                        </div>
                        <div style="margin-bottom: 25px;">
                            <label style="color: white; display: block; margin-bottom: 12px; font-weight: 500; font-size: 14px;">Select Avatar:</label>
                            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 15px;" id="edit-avatar-grid">
                                ${avatarOptions.map((url, i) => `
                                    <img src="${url}"
                                         data-avatar="${url}"
                                         class="edit-avatar-option ${profile.avatar === url ? 'selected' : ''}"
                                         style="width: 60px; height: 60px; border-radius: 8px; cursor: pointer; border: 3px solid ${profile.avatar === url ? '#e50914' : 'transparent'}; transition: all 0.2s ease; object-fit: cover;"
                                         onclick="selectEditAvatar('${url}')">
                                `).join('')}
                            </div>
                            <div style="margin-top: 15px;">
                                <label style="color: #999; display: block; margin-bottom: 8px; font-size: 13px;">Or upload custom image:</label>
                                <input type="file" id="edit-avatar-upload" accept="image/*" style="display: none;">
                                <button type="button" onclick="document.getElementById('edit-avatar-upload').click()" style="background: #444; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 13px; width: 100%;">Choose File</button>
                                <div id="edit-upload-preview" style="margin-top: 10px; text-align: center;"></div>
                            </div>
                            <input type="hidden" id="edit-selected-avatar" value="${profile.avatar}">
                        </div>
                        <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 30px;">
                            <button type="button" onclick="closeEditProfileModal()" style="background: #444; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.3s ease;">Cancel</button>
                            <button type="submit" id="edit-profile-btn" style="background: #e50914; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.3s ease;">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Setup avatar selection
        window.selectEditAvatar = function(url) {
            document.querySelectorAll('.edit-avatar-option').forEach(img => {
                img.style.border = '3px solid transparent';
                img.classList.remove('selected');
            });
            const selected = document.querySelector(`[data-avatar="${url}"]`);
            if (selected) {
                selected.style.border = '3px solid #e50914';
                selected.classList.add('selected');
            }
            document.getElementById('edit-selected-avatar').value = url;
            document.getElementById('edit-upload-preview').innerHTML = '';
        };

        // Handle file upload
        document.getElementById('edit-avatar-upload').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // Check file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    alert('Image file is too large. Please choose an image smaller than 5MB.');
                    e.target.value = '';
                    return;
                }

                // Check file type
                if (!file.type.startsWith('image/')) {
                    alert('Please select a valid image file.');
                    e.target.value = '';
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(event) {
                    const dataUrl = event.target.result;
                    document.getElementById('edit-selected-avatar').value = dataUrl;
                    document.getElementById('edit-upload-preview').innerHTML = `
                        <img src="${dataUrl}" style="width: 80px; height: 80px; border-radius: 8px; border: 3px solid #e50914; object-fit: cover;">
                        <p style="color: #4ecdc4; font-size: 12px; margin-top: 5px;">Custom image selected</p>
                    `;
                    // Deselect preset avatars
                    document.querySelectorAll('.edit-avatar-option').forEach(img => {
                        img.style.border = '3px solid transparent';
                        img.classList.remove('selected');
                    });
                };
                reader.readAsDataURL(file);
            }
        });

        // Handle form submission
        document.getElementById('edit-profile-form').addEventListener('submit', async function(e) {
            e.preventDefault();

            const newName = document.getElementById('edit-profile-name').value.trim();
            const newAvatar = document.getElementById('edit-selected-avatar').value;

            if (!newName || newName.length < 2) {
                alert('Profile name must be at least 2 characters');
                return;
            }

            const editBtn = document.getElementById('edit-profile-btn');
            const originalText = editBtn.textContent;
            editBtn.textContent = 'Saving...';
            editBtn.disabled = true;

            try {
                const updateData = {
                    name: newName,
                    avatar: newAvatar
                };

                const updated = await NetflixAPI.updateProfile(profileId, updateData);

                if (updated) {
                    editBtn.textContent = '✓ Saved!';
                    editBtn.style.background = '#4ecdc4';

                    setTimeout(() => {
                        closeEditProfileModal();
                        loadProfilesFromAPI().then(() => {
                            renderProfiles();
                            showSuccessToast(`Profile "${newName}" updated successfully!`);
                        });
                    }, 800);
                } else {
                    editBtn.textContent = originalText;
                    editBtn.disabled = false;
                    alert('Failed to update profile. Please try again.');
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                editBtn.textContent = originalText;
                editBtn.disabled = false;
                alert('Error updating profile. Please try again.');
            }
        });

        // ESC key handler
        document.addEventListener('keydown', handleEscapeKey);
    };

    /**
     * Close edit profile modal
     */
    window.closeEditProfileModal = function() {
        const modal = document.getElementById('edit-profile-modal');
        if (modal) {
            modal.style.animation = 'fadeOut 0.2s ease-out';
            setTimeout(() => {
                modal.remove();
            }, 200);
        }
        document.removeEventListener('keydown', handleEscapeKey);
    };

    /**
     * Delete profile with confirmation
     */
    window.deleteProfile = async function(profileId, profileName) {
        if (allProfiles.length <= 1) {
            alert('Cannot delete the last profile. You must have at least one profile.');
            return;
        }

        if (!confirm(`Are you sure you want to delete the profile "${profileName}"?\n\nThis action cannot be undone.`)) {
            return;
        }

        try {
            const success = await NetflixAPI.deleteProfile(profileId);
            if (success) {
                showSuccessToast(`Profile "${profileName}" deleted successfully`);
                await loadProfilesFromAPI();
                renderProfiles();
            } else {
                alert('Failed to delete profile. Please try again.');
            }
        } catch (error) {
            console.error('Error deleting profile:', error);
            alert('Error deleting profile. Please try again.');
        }
    };

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

    /**
     * Select profile and redirect to main app
     */
    window.selectProfile = function(profileId, profileName, profileAvatar) {
        // Store selected profile in localStorage
        localStorage.setItem('netflix:selectedProfile', JSON.stringify({
            id: profileId,
            name: profileName,
            avatar: profileAvatar
        }));

        // Also store in individual keys for backward compatibility
        localStorage.setItem('netflix:profileId', profileId);
        localStorage.setItem('netflix:profileName', profileName);
        localStorage.setItem('netflix:profileAvatar', profileAvatar);

        // Redirect to main app
        window.location.href = '/main.html';
    };

    /**
     * Logout function
     */
    window.netflixLogout = function() {
        NetflixAPI.logout();
        window.location.href = '/index.html';
    };

    // Export functions for global use
    window.ProfileManager = {
        init: initProfiles,
        refresh: window.refreshProfiles,
        loadProfiles: loadProfilesFromAPI,
        renderProfiles: renderProfiles
    };
})();