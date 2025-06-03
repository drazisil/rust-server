// src/routes/auth.ts
import { Router } from 'express';

const router = Router();

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
        return res.status(400).json({ error: 'Missing username or password' });
    }
    res.status(200).json({ message: 'Login received', username, password });
});

export default router;
