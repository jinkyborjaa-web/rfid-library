document.addEventListener('DOMContentLoaded', () => {
    const admin = (() => {
        try {
            const savedAdmin = sessionStorage.getItem('admin') || localStorage.getItem('admin');
            return savedAdmin ? JSON.parse(savedAdmin) : null;
        } catch (error) {
            return null;
        }
    })();

    const userDisplay = document.getElementById('sidebarUser');
    if (userDisplay) {
        const username = admin?.username || 'admin';
        userDisplay.textContent = `Logged in as: ${username}`;
        userDisplay.classList.remove('hidden');
    }

    const logoutButton = document.getElementById('logoutButton');
    if (!logoutButton) return;

    logoutButton.addEventListener('click', async () => {
        const clearAuth = () => {
            sessionStorage.removeItem('authToken');
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('admin');
            localStorage.removeItem('admin');
        };

        try {
            if (API_ENDPOINTS?.auth?.logout) {
                await apiRequest(API_ENDPOINTS.auth.logout, 'POST');
            }
        } catch (error) {
            console.warn('Logout request failed; clearing local session anyway.', error);
        } finally {
            clearAuth();
            window.location.href = 'login.html';
        }
    });
});
