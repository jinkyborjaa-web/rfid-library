require('dotenv').config();
console.log('DATABASE_URL loaded:', !!process.env.DATABASE_URL);
console.log('DB_CA_CERT_PATH loaded:', !!process.env.DB_CA_CERT_PATH);
console.log('BREVO_API_KEY loaded:', !!process.env.BREVO_API_KEY);

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const { testConnection } = require('./db');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_ORIGIN : true,
    credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Serve frontend static files (project root, two levels up from backend/src)
app.use(express.static(path.join(__dirname, '..', '..')));

// Test database connection
testConnection();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/colleges', require('./middleware/requireAuth'), require('./routes/colleges'));
app.use('/api/courses', require('./middleware/requireAuth'), require('./routes/courses'));
app.use('/api/students', require('./middleware/requireAuth'), require('./routes/students'));
app.use('/api/check-in', require('./middleware/requireAuth'), require('./routes/checkIns'));
app.use('/api/checkin', require('./middleware/requireAuth'), require('./routes/checkIns'));
app.use('/api/visits', require('./middleware/requireAuth'), require('./routes/visits'));
app.use('/api/visit-log', require('./middleware/requireAuth'), require('./routes/visits'));
app.use('/api/leaderboard', require('./middleware/requireAuth'), require('./routes/leaderboard'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        status: 'error',
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});