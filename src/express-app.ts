// src/express-app.ts
import express from 'express';
import { createLogger } from './logger';
import authRouter from './routes/auth';

const logger = createLogger('express-app');
const app = express();
app.use(express.json());

// Log all requests received by the Express server
app.use((req, res, next) => {
    // Clone query and mask password if present
    const safeQuery = { ...req.query };
    if (typeof safeQuery.password === 'string') {
        safeQuery.password = '[REDACTED]';
    }
    logger.info({ method: req.method, url: req.originalUrl, ip: req.ip, query: safeQuery }, '[Express] Request received');
    // Attach a flag to the response to track if a route matched
    res.locals.routeMatched = false;
    next();
});

// AuthLogin route: expects username and password as query parameters
app.use(authRouter);

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
