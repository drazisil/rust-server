// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2025 The Oxide Authors
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

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
