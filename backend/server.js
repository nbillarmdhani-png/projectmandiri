require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded photos and templates)
app.use('/uploads', express.static('uploads'));

// Routes
const authRoutes = require('./routes/authRoutes');
const photoboothRoutes = require('./routes/photoboothRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/photobooth', photoboothRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Photobooth API is running' });
});

// TODO: Routes configuration

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
