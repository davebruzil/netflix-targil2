// Netflix Login/Registration System with Backend Integration
(() => {
    const STORAGE_KEYS = {
        AUTH: 'netflix:isAuthenticated',
        EMAIL: 'netflix:email',
        PROFILE_ID: 'netflix:profileId',
        PROFILE_NAME: 'netflix:profileName'
    };

    const MIN_PASSWORD_LENGTH = 6;
    let isLoginForm = true;

    // Email validation
    const isEmailValid = (value) => {
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return pattern.test(String(value).toLowerCase());
    };

    // Check if user is authenticated
    const isAuthenticated = () => {
        return NetflixAPI.isAuthenticated();
    };

    // Get base path for redirects
    const getBasePath = () => {
        const pathname = window.location.pathname;
        if (pathname.endsWith('/')) return pathname;
        return pathname.replace(/[^/]*$/, '');
    };

    // Redirect to a page
    const redirectTo = (filename) => {
        const base = getBasePath();
        window.location.href = base + filename;
    };

    // Get current page name
    const getPageName = () => {
        const parts = window.location.pathname.split('/');
        return parts[parts.length - 1] || 'index.html';
    };

    // Handle authentication guards
    const handleAuthGuards = () => {
        const page = getPageName();
        const onLogin = page === 'index.html';
        const onProtected = page === 'main.html' || page === 'profiles.html' || page === 'welcome.html';

        if (onLogin && isAuthenticated()) {
            redirectTo('profiles.html');
            return true;
        }

        if (onProtected && !isAuthenticated()) {
            redirectTo('index.html');
            return true;
        }

        return false;
    };

    // Show error message
    const showError = (inputEl, errorEl, message) => {
        if (!inputEl || !errorEl) return;
        if (message) {
            inputEl.classList.add('error');
            errorEl.textContent = message;
        } else {
            inputEl.classList.remove('error');
            errorEl.textContent = '';
        }
    };

    // Show loading state
    const showLoading = (button, isLoading) => {
        if (!button) return;
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
        } else {
            button.disabled = false;
            button.innerHTML = isLoginForm ? 'Sign In' : 'Sign Up';
        }
    };

    // Toggle between login and registration forms
    window.toggleForm = () => {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const formTitle = document.getElementById('formTitle');
        
        isLoginForm = !isLoginForm;
        
        if (isLoginForm) {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            formTitle.textContent = 'Sign In';
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            formTitle.textContent = 'Sign Up';
        }
        
        // Clear all errors
        clearAllErrors();
    };

    // Clear all error messages
    const clearAllErrors = () => {
        const errorElements = document.querySelectorAll('.error-message');
        const inputElements = document.querySelectorAll('.form-control');
        
        errorElements.forEach(el => el.textContent = '');
        inputElements.forEach(el => el.classList.remove('error'));
    };

    // Setup login form
    const setupLoginForm = () => {
        const form = document.getElementById('loginForm');
        if (!form) return;

        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const emailError = document.getElementById('emailError');
        const passwordError = document.getElementById('passwordError');
        const submitButton = form.querySelector('button[type="submit"]');

        const validateEmail = () => {
            const value = emailInput.value.trim();
            if (!value) {
                showError(emailInput, emailError, 'Email is required');
                return false;
            }
            if (!isEmailValid(value)) {
                showError(emailInput, emailError, 'Enter a valid email');
                return false;
            }
            showError(emailInput, emailError, '');
            return true;
        };

        const validatePassword = () => {
            const value = passwordInput.value;
            if (!value) {
                showError(passwordInput, passwordError, 'Password is required');
                return false;
            }
            if (value.length < MIN_PASSWORD_LENGTH) {
                showError(passwordInput, passwordError, `Must be at least ${MIN_PASSWORD_LENGTH} characters`);
                return false;
            }
            showError(passwordInput, passwordError, '');
            return true;
        };

        emailInput.addEventListener('input', validateEmail);
        passwordInput.addEventListener('input', validatePassword);

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const emailOk = validateEmail();
            const passwordOk = validatePassword();

            if (!emailOk || !passwordOk) return;

            showLoading(submitButton, true);
            clearAllErrors();

            try {
                const result = await NetflixAPI.login({
                    email: emailInput.value.trim(),
                    password: passwordInput.value
                });

                if (result) {
                    console.log('✅ Login successful:', result.user);
                    redirectTo('profiles.html');
                } else {
                    showError(passwordInput, passwordError, 'Invalid email or password');
                }
            } catch (error) {
                console.error('❌ Login error:', error);
                showError(passwordInput, passwordError, 'Login failed. Please try again.');
            } finally {
                showLoading(submitButton, false);
            }
        });
    };

    // Setup registration form
    const setupRegisterForm = () => {
        const form = document.getElementById('registerForm');
        if (!form) return;

        const firstNameInput = document.getElementById('regFirstName');
        const lastNameInput = document.getElementById('regLastName');
        const emailInput = document.getElementById('regEmail');
        const passwordInput = document.getElementById('regPassword');
        const firstNameError = document.getElementById('regFirstNameError');
        const lastNameError = document.getElementById('regLastNameError');
        const emailError = document.getElementById('regEmailError');
        const passwordError = document.getElementById('regPasswordError');
        const submitButton = form.querySelector('button[type="submit"]');

        const validateFirstName = () => {
            const value = firstNameInput.value.trim();
            if (!value) {
                showError(firstNameInput, firstNameError, 'First name is required');
                return false;
            }
            showError(firstNameInput, firstNameError, '');
            return true;
        };

        const validateLastName = () => {
            const value = lastNameInput.value.trim();
            if (!value) {
                showError(lastNameInput, lastNameError, 'Last name is required');
                return false;
            }
            showError(lastNameInput, lastNameError, '');
            return true;
        };

        const validateEmail = () => {
            const value = emailInput.value.trim();
            if (!value) {
                showError(emailInput, emailError, 'Email is required');
                return false;
            }
            if (!isEmailValid(value)) {
                showError(emailInput, emailError, 'Enter a valid email');
                return false;
            }
            showError(emailInput, emailError, '');
            return true;
        };

        const validatePassword = () => {
            const value = passwordInput.value;
            if (!value) {
                showError(passwordInput, passwordError, 'Password is required');
                return false;
            }
            if (value.length < MIN_PASSWORD_LENGTH) {
                showError(passwordInput, passwordError, `Must be at least ${MIN_PASSWORD_LENGTH} characters`);
                return false;
            }
            showError(passwordInput, passwordError, '');
            return true;
        };

        firstNameInput.addEventListener('input', validateFirstName);
        lastNameInput.addEventListener('input', validateLastName);
        emailInput.addEventListener('input', validateEmail);
        passwordInput.addEventListener('input', validatePassword);

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const firstNameOk = validateFirstName();
            const lastNameOk = validateLastName();
            const emailOk = validateEmail();
            const passwordOk = validatePassword();

            if (!firstNameOk || !lastNameOk || !emailOk || !passwordOk) return;

            showLoading(submitButton, true);
            clearAllErrors();

            try {
                const result = await NetflixAPI.register({
                    firstName: firstNameInput.value.trim(),
                    lastName: lastNameInput.value.trim(),
                    email: emailInput.value.trim(),
                    password: passwordInput.value
                });

                if (result) {
                    console.log('✅ Registration successful:', result.user);
                    redirectTo('profiles.html');
                } else {
                    showError(emailInput, emailError, 'Registration failed. Email may already exist.');
                }
            } catch (error) {
                console.error('❌ Registration error:', error);
                showError(emailInput, emailError, 'Registration failed. Please try again.');
            } finally {
                showLoading(submitButton, false);
            }
        });
    };

    // Profile selection function
    window.selectProfile = (profileId, profileName) => {
        localStorage.setItem(STORAGE_KEYS.PROFILE_ID, profileId);
        localStorage.setItem(STORAGE_KEYS.PROFILE_NAME, profileName);
        redirectTo('welcome.html');
    };

    // Logout function
    window.netflixLogout = async () => {
        await NetflixAPI.logout();
        redirectTo('index.html');
    };

    // Initialize the page
    document.addEventListener('DOMContentLoaded', () => {
        const redirected = handleAuthGuards();
        if (!redirected) {
            setupLoginForm();
            setupRegisterForm();
        }
    });
})();