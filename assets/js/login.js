const passwordInput = document.getElementById('password');
const passwordToggle = document.querySelector('.password-toggle');

passwordToggle.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    passwordToggle.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    passwordToggle.setAttribute('title', isPassword ? 'Hide password' : 'Show password');
});

document.getElementById('loginForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const errorElement = document.getElementById('loginError');
    const submitButton = form.querySelector('button[type="submit"]');
    errorElement.textContent = '';
    submitButton.disabled = true;

    try {
        const data = await apiRequest(API_ENDPOINTS.auth.login, 'POST', Object.fromEntries(new FormData(form)));
        sessionStorage.removeItem('authToken');
        localStorage.removeItem('authToken');
        const storage = form.elements.remember.checked ? localStorage : sessionStorage;
        storage.setItem('authToken', data.data.token);
        storage.setItem('admin', JSON.stringify(data.data));
        window.location.href = 'index.html';
    } catch (error) {
        errorElement.textContent = error.message;
    } finally {
        submitButton.disabled = false;
    }
});