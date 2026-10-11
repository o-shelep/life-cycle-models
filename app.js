const path = require('path')
const express = require('express');
const cors = require('cors')
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const routes = require('./src/routes')

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(
    cors({
        origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
        credentials: true,
    })
)

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', routes);

app.use((req, res) => {
    res.status(404).json({message: 'Route not found'});
})

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({message: err.message || 'Internal Server error'})
})

module.exports = app;