const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const SibApiV3Sdk = require('@getbrevo/brevo');
const { pool } = require('../db');
const { jwtSecret } = require('../config/auth');

const router = express.Router();
const resetRequests = new Map();
const RESET_WINDOW_MS = 60 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;
const brevoClient = new SibApiV3Sdk.TransactionalEmailsApi();
brevoClient.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

function hashResetToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

function canRequestReset(identifier) {
    const now = Date.now();
    const recent = (resetRequests.get(identifier) || []).filter(time => now - time < RESET_WINDOW_MS);
    if (recent.length >= 3) return false;
    recent.push(now);
    resetRequests.set(identifier, recent);
    return true;
}

router.post('/login', async (req, res, next) => {
    const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (!username || !password) return res.status(400).json({ status: 'error', message: 'Username and password are required' });
    try {
        const { rows } = await pool.query('SELECT admin_id, username, email, password_hash FROM admin_users WHERE username = $1 LIMIT 1', [username]);
        let admin = rows[0];
        if (!admin && username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
            const passwordHash = await bcrypt.hash(password, 12);
            const result = await pool.query('INSERT INTO admin_users (username, password_hash) VALUES ($1, $2) RETURNING admin_id, username', [username, passwordHash]);
            admin = result.rows[0];
        }
        if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
            return res.status(401).json({ status: 'error', message: 'Invalid username or password' });
        }
        const token = jwt.sign({ id: admin.admin_id, username: admin.username, email: admin.email || '' }, jwtSecret, { expiresIn: '8h' });
        res.json({ status: 'success', data: { id: admin.admin_id, username: admin.username, email: admin.email || '', token } });
    } catch (error) {
        next(error);
    }
});

router.post('/forgot-password', async (req, res, next) => {
    const requestedEmail = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const genericResponse = () => res.json({ status: 'success', message: 'If that account exists, a reset link has been sent.' });

    if (!requestedEmail || !canRequestReset(requestedEmail)) return genericResponse();
    if (!process.env.BREVO_API_KEY) {
        console.error('Forgot password unavailable: BREVO_API_KEY is missing.');
        return res.status(500).json({ status: 'error', message: 'Password reset email is not configured.' });
    }

    try {
        const { rows } = await pool.query('SELECT admin_id, email FROM admin_users WHERE email = $1 LIMIT 1', [requestedEmail]);
        const admin = rows[0];
        if (!admin?.email) return genericResponse();

        const token = crypto.randomBytes(32).toString('hex');
        await pool.query('UPDATE admin_users SET reset_token_hash = $1, reset_token_expires_at = $2 WHERE admin_id = $3', [hashResetToken(token), new Date(Date.now() + RESET_TOKEN_TTL_MS), admin.admin_id]);

        const recipientEmail = admin.email.trim();
        const resetUrl = `${process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 3000}`}/reset-password.html?token=${encodeURIComponent(token)}`;

        console.log('Attempting to send reset email to:', recipientEmail);
        try {
            const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
            sendSmtpEmail.sender = { email: process.env.EMAIL_FROM };
            sendSmtpEmail.to = [{ email: recipientEmail }];
            sendSmtpEmail.subject = 'Library RFID password reset';
            sendSmtpEmail.textContent = `Reset your password here: ${resetUrl}\n\nThis link expires in 15 minutes and can only be used once.`;

            const response = await brevoClient.sendTransacEmail(sendSmtpEmail);
            console.log('Email sent:', response.body?.messageId);
            return genericResponse();
        } catch (err) {
            console.error('Failed to send reset email:', err.message, err);
            return res.status(500).json({
                status: 'error',
                message: 'Unable to send reset email. Please try again later.'
            });
        }
    } catch (error) {
        console.error('Forgot password error:', error.message, error);
        next(error);
    }
});

router.post('/reset-password', async (req, res, next) => {
    const token = typeof req.body.token === 'string' ? req.body.token.trim() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (!token || password.length < 8) return res.status(400).json({ status: 'error', message: 'A valid token and password of at least 8 characters are required' });
    try {
        const passwordHash = await bcrypt.hash(password, 12);
        const result = await pool.query(
            `UPDATE admin_users SET password_hash = $1, reset_token_hash = NULL, reset_token_expires_at = NULL
             WHERE reset_token_hash = $2 AND reset_token_expires_at > CURRENT_TIMESTAMP`,
            [passwordHash, hashResetToken(token)]
        );
        if (!result.rowCount) return res.status(400).json({ status: 'error', message: 'This reset link is invalid or has expired' });
        res.json({ status: 'success', message: 'Password reset successfully' });
    } catch (error) {
        next(error);
    }
});

router.put('/update-profile', require('../middleware/requireAuth'), async (req, res, next) => {
    const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
    if (!username || !email || !/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(400).json({ status: 'error', fields: { username: !username ? 'Username is required' : '', email: 'A valid email is required' } });
    }
    try {
        const { rows } = await pool.query('UPDATE admin_users SET username = $1, email = $2 WHERE admin_id = $3 RETURNING admin_id, username, email', [username, email, req.admin.id]);
        res.json({ status: 'success', data: rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            const field = error.constraint?.includes('email') ? 'email' : 'username';
            return res.status(409).json({ status: 'error', fields: { [field]: `${field === 'email' ? 'Email' : 'Username'} is already in use` }, message: 'Profile could not be updated' });
        }
        next(error);
    }
});

router.put('/change-password', require('../middleware/requireAuth'), async (req, res, next) => {
    const currentPassword = typeof req.body.currentPassword === 'string' ? req.body.currentPassword : '';
    const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';
    if (!currentPassword || newPassword.length < 8) return res.status(400).json({ status: 'error', message: 'Current password and a new password of at least 8 characters are required' });
    try {
        const { rows } = await pool.query('SELECT password_hash FROM admin_users WHERE admin_id = $1', [req.admin.id]);
        if (!rows[0] || !(await bcrypt.compare(currentPassword, rows[0].password_hash))) return res.status(401).json({ status: 'error', message: 'Current password is incorrect' });
        const passwordHash = await bcrypt.hash(newPassword, 12);
        await pool.query('UPDATE admin_users SET password_hash = $1 WHERE admin_id = $2', [passwordHash, req.admin.id]);
        res.json({ status: 'success', message: 'Password changed successfully' });
    } catch (error) { next(error); }
});

router.post('/logout', (req, res) => {
    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
});

router.get('/me', require('../middleware/requireAuth'), (req, res) => {
    res.json({ status: 'success', data: req.admin });
});

module.exports = router;
