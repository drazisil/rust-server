// src/express-app.ts
import express from 'express';
import { logger } from './logger';

const app = express();
app.use(express.json());

// Log all requests received by the Express server
app.use((req, res, next) => {
    logger.info({ method: req.method, url: req.originalUrl, ip: req.ip }, '[Express] Request received');
    // Attach a flag to the response to track if a route matched
    res.locals.routeMatched = false;
    next();
});

// AuthLogin route: expects username and password as query parameters
app.get('/AuthLogin', (req, res, next) => {
    res.locals.routeMatched = true;
    // If req.query is empty, try to parse from req.url manually
    let username = req.query.username;
    let password = req.query.password;
    if (!username || !password) {
        // Fallback: parse querystring manually
        const url = require('url');
        const parsedUrl = url.parse(req.url || '', true);
        username = parsedUrl.query.username;
        password = parsedUrl.query.password;
    }
    if (!username || !password) {
        return res.status(400).json({ error: 'Missing username or password' });
    }
    res.status(200).json({ message: 'Login received', username, password });
});

// Example route for demonstration
app.all('*', (req, res) => {
    res.locals.routeMatched = true;
    res.status(200).send('Request forwarded to Express server.');
});

// Log after response to indicate if a route matched
app.use((req, res, next) => {
    // Use 'finish' event to log after response is sent
    res.on('finish', () => {
        if (res.locals.routeMatched) {
            logger.info({ method: req.method, url: req.originalUrl }, '[Express] Route matched');
        } else {
            logger.info({ method: req.method, url: req.originalUrl }, '[Express] No route matched');
        }
    });
    next();
});

export default app;
