// src/routes/auth.ts
import { Router } from 'express';
import { createLogger } from '../logger';

const router = Router();
const logger = createLogger('auth');

// AuthLogin route: expects username and password as query parameters
router.get('/AuthLogin', (req, res) => {
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
    res.status(200).type('text').send(`Login received\nusername: ${username}\npassword: ${password}`);
});

export default router;
