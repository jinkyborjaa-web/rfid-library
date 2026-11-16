(async () => {
    if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) return;
    if (!sessionStorage.getItem('authToken') && !localStorage.getItem('authToken')) {
        window.location.href = 'index.html';
        return;
    }
    try {
        await apiRequest('/auth/me');
    } catch (error) {
        sessionStorage.removeItem('authToken');
        window.location.href = 'index.html';
    }
})();