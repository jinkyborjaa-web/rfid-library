document.getElementById('forgotForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const message = document.getElementById('forgotMessage');
    const button = form.querySelector('button');
    const emailInput = form.querySelector('input[name="email"]');
    const email = emailInput.value.trim();

    message.textContent = '';
    message.classList.remove('message-success', 'message-error');

    if (!email || !emailInput.validity.valid) {
        message.textContent = 'Please enter a valid email address.';
        message.classList.add('message-error', 'form-error');
        emailInput.focus();
        return;
    }

    button.disabled = true;
    try {
        const data = await apiRequest(API_ENDPOINTS.auth.forgotPassword, 'POST', { email });
        message.textContent = data.message;
        message.classList.remove('form-error');
        message.classList.add('message-success');
        form.reset();
    } catch (error) {
        message.textContent = error.message;
        message.classList.remove('message-success');
        message.classList.add('message-error', 'form-error');
    } finally {
        button.disabled = false;
    }
});