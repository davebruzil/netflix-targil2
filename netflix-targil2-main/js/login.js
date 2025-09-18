

(() => {
    const STORAGE_KEYS = {
        AUTH: 'netflix:isAuthenticated',
        EMAIL: 'netflix:email',
        PROFILE_ID: 'netflix:profileId',
        PROFILE_NAME: 'netflix:profileName'
    };

    const MIN_PASSWORD_LENGTH = 6;

    const isEmailValid = (value) => {
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return pattern.test(String(value).toLowerCase());
    };

    const setAuth = (email) => {
        localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
        localStorage.setItem(STORAGE_KEYS.EMAIL, email);
    };

    const clearAuth = () => {
        localStorage.removeItem(STORAGE_KEYS.AUTH);
        localStorage.removeItem(STORAGE_KEYS.EMAIL);
        localStorage.removeItem(STORAGE_KEYS.PROFILE_ID);
        localStorage.removeItem(STORAGE_KEYS.PROFILE_NAME);
    };

    const isAuthenticated = () => localStorage.getItem(STORAGE_KEYS.AUTH) === 'true';

    const getBasePath = () => {
        const pathname = window.location.pathname;
        if (pathname.endsWith('/')) return pathname;
        return pathname.replace(/[^/]*$/, '');
    };

    const redirectTo = (filename) => {
        const base = getBasePath();
        window.location.href = base + filename;
    };

    const getPageName = () => {
        const parts = window.location.pathname.split('/');
        return parts[parts.length - 1] || 'index.html';
    };

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

    const setupLoginForm = () => {
        const form = document.getElementById('loginForm');
        if (!form) return;

        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const emailError = document.getElementById('emailError');
        const passwordError = document.getElementById('passwordError');

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

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const emailOk = validateEmail();
            const passwordOk = validatePassword();

            if (!emailOk || !passwordOk) return;

            setAuth(emailInput.value.trim());
            redirectTo('profiles.html');
        });
    };

    window.selectProfile = (profileId, profileName) => {
        localStorage.setItem(STORAGE_KEYS.PROFILE_ID, profileId);
        localStorage.setItem(STORAGE_KEYS.PROFILE_NAME, profileName);
        redirectTo('welcome.html');
    };

    window.netflixLogout = () => {
        clearAuth();
        redirectTo('index.html');
    };

    document.addEventListener('DOMContentLoaded', () => {
        const redirected = handleAuthGuards();
        if (!redirected) {
            setupLoginForm();
        }
    });
})();


