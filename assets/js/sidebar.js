document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    const sidebarHeader = sidebar?.querySelector('.sidebar-header');

    if (sidebar && sidebarHeader && !sidebar.querySelector('.sidebar-toggle')) {
        const toggleButton = document.createElement('button');
        toggleButton.className = 'sidebar-toggle';
        toggleButton.type = 'button';
        toggleButton.setAttribute('aria-label', 'Open navigation menu');
        toggleButton.setAttribute('aria-expanded', 'false');
        toggleButton.innerHTML = '<i class="fas fa-bars" aria-hidden="true"></i>';
        sidebarHeader.appendChild(toggleButton);

        toggleButton.addEventListener('click', () => {
            const isOpen = sidebar.classList.toggle('is-open');
            toggleButton.setAttribute('aria-expanded', String(isOpen));
            toggleButton.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
            toggleButton.innerHTML = `<i class="fas fa-${isOpen ? 'xmark' : 'bars'}" aria-hidden="true"></i>`;
        });
    }

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
        userDisplay.replaceChildren('Logged in as ', Object.assign(document.createElement('strong'), { textContent: username }));
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
            window.location.href = 'index.html';
        }
    });
});
