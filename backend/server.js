require('dotenv').config();
const express  = require('express');
const session  = require('express-session');
const cors     = require('cors');
const path     = require('path');

const authRoutes    = require('./routes/auth');
const studentRoutes = require('./routes/students');
const { courseRouter, resultRouter } = require('./routes/courses');
const feeRoutes     = require('./routes/fees');

const app  = express();
const PORT = process.env.PORT || 5000;

// Allow all origins with credentials
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session — secure:false is required on Render (proxy handles HTTPS)
app.use(session({
    secret:            process.env.SESSION_SECRET || 'ums_secret_key_2024',
    resave:            true,
    saveUninitialized: true,
    cookie: {
        secure:   false,
        httpOnly: true,
        maxAge:   24 * 60 * 60 * 1000
    }
}));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// API routes
app.use('/api/auth',     authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/courses',  courseRouter);
app.use('/api/results',  resultRouter);
app.use('/api/fees',     feeRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'UMS API is running', timestamp: new Date() });
});

// SPA fallback
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ success: false, message: 'API endpoint not found.' });
    }
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
});

app.listen(PORT, () => {
    console.log(`UMS running on port ${PORT}`);
});
