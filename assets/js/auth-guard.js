(async () => {
    if (window.location.pathname.endsWith('login.html')) return;
    if (!sessionStorage.getItem('authToken') && !localStorage.getItem('authToken')) {
        window.location.href = 'login.html';
        return;
    }
    try {
        await apiRequest('/auth/me');
    } catch (error) {
        sessionStorage.removeItem('authToken');
        window.location.href = 'login.html';
    }
})();