// src/routes/auth.ts
import { Router } from 'express';
import { createLogger } from '../logger';
import { checkCredentials } from '../auth/checkCredentials';

const router = Router();
const logger = createLogger('auth');

// AuthLogin route: expects username and password as query parameters
router.get('/AuthLogin', async (req, res) => {
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
        res.status(400).type('text').send('Missing username or password');
        return;
    }
    // Ensure both are strings (Express query params can be string|string[]|undefined)
    if (Array.isArray(username)) username = username[0];
    if (Array.isArray(password)) password = password[0];
    // Use await for checkCredentials
    const valid = await checkCredentials(username as string, password as string);
    if (!valid) {
        res.status(401).type('text').send('Invalid username or password');
        return;
    }
    res.status(200).type('text').send(`Login successful\nusername: ${username}`);
});

export default router;
