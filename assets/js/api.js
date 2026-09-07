function getStoredAuthToken() {
    return sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
}

async function apiRequest(endpoint, method = 'GET', body) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
    const token = getStoredAuthToken();
    if (token && token !== 'session') headers.Authorization = `Bearer ${token}`;

    let response;
    try {
        response = await fetch(url, {
            method,
            headers,
            credentials: 'include',
            body: body === undefined ? undefined : JSON.stringify(body)
        });
    } catch (error) {
        throw new Error('Unable to reach the server. Check that the backend is running.');
    }

    let data = {};
    try { data = await response.json(); } catch (error) { /* non-JSON response */ }
    if (!response.ok) {
        if (response.status === 401 && !window.location.pathname.endsWith('login.html')) {
            sessionStorage.removeItem('authToken');
            localStorage.removeItem('authToken');
            window.location.href = 'login.html';
        }
        const validationMessage = data.errors?.map(item => item.msg).join(', ');
        const error = new Error(data.message || validationMessage || `Request failed (${response.status})`);
        error.fields = data.fields;
        throw error;
    }
    return data;
}

// Compatibility helper for existing page modules during the client migration.
async function apiFetch(endpoint, options = {}) {
    const method = options.method || 'GET';
    let body;
    if (options.body) body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    const data = await apiRequest(endpoint, method, body);
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
}