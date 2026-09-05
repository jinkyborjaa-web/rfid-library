document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await apiFetch(API_ENDPOINTS.auth.me);
        if (!response.ok) window.location.href = 'login.html';
    } catch (error) {
        console.error('Authentication check failed:', error);
        window.location.href = 'login.html';
    }
});