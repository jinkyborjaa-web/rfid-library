// API Configuration
// Prefer a runtime override: window.API_BASE_URL
// Use localhost only when running locally
const API_BASE_URL = window.API_BASE_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : 'https://rfid-library-r38h.onrender.com/api');

// API Endpoints
const API_ENDPOINTS = {
    auth: {
        login: '/auth/login',
        me: '/auth/me',
        logout: '/auth/logout',
        forgotPassword: '/auth/forgot-password',
        resetPassword: '/auth/reset-password',
        updateProfile: '/auth/update-profile',
        changePassword: '/auth/change-password'
    },
    students: {
        list: '/students',
        create: '/students',
        update: (id) => `/students/${id}`,
        delete: (id) => `/students/${id}`,
        get: (id) => `/students/${id}`,
        topVisitors: '/students/top-visitors'
    },
    checkIn: {
        create: '/checkin',
        verify: (rfid) => `/check-in/verify/${rfid}`
    },
    visits: {
        list: '/visit-log'
    },
    leaderboard: {
        get: '/students/top-visitors'
    },
    colleges: {
        list: '/colleges',
        create: '/colleges',
        delete: (id) => `/colleges/${id}`
    },
    courses: {
        list: '/courses',
        create: '/courses',
        delete: (id) => `/courses/${id}`
    }
};

// Toast Notification Helper
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Error Handler
function handleError(error) {
    console.error('API Error:', error);
    showToast(error.message || 'An error occurred', 'error');
}
