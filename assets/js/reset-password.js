const resetForm = document.getElementById('resetForm');
const resetMessage = document.getElementById('resetMessage');
const resetLoginLink = document.getElementById('resetLoginLink');
const resetToken = new URLSearchParams(window.location.search).get('token');

resetLoginLink.addEventListener('click', event => {
    event.preventDefault();
    window.location.href = 'login.html';
});

resetForm.addEventListener('submit', async event => {
    event.preventDefault();
    const password = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const button = resetForm.querySelector('button');

    resetMessage.className = 'form-error';

    if (!resetToken) {
        resetMessage.textContent = 'This reset link is missing its token.';
        resetMessage.classList.add('message-error');
        return;
    }
    if (password !== confirmPassword) {
        resetMessage.textContent = 'Passwords do not match.';
        resetMessage.classList.add('message-error');
        return;
    }

    resetMessage.textContent = '';
    button.disabled = true;
    try {
        const data = await apiRequest(API_ENDPOINTS.auth.resetPassword, 'POST', { token: resetToken, password });
        resetMessage.textContent = `${data.message}. You can now sign in.`;
        resetMessage.className = 'message-success';
        resetForm.reset();

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    } catch (error) {
        resetMessage.textContent = error.message;
        resetMessage.className = 'message-error';
    } finally {
        button.disabled = false;
    }
});