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

// src/routes/auth.ts
import { Router } from 'express';
import { createLogger } from '../logger';
import { checkCredentials } from '../auth/checkCredentials';

const router = Router();
const logger = createLogger('auth');

// Helper function for sending success message
function sendLoginSuccess(res: any, ticket: string) {
    res.status(200).type('text').send(`Valid=TRUE\nTicket=${ticket}`);
}

// Helper function for sending failure message
function sendLoginFailure(res: any, reasonCode: string, reasonText: string, reasonUrl: string, statusCode: number = 401) {
    res.status(statusCode).type('text').send(
        `reasoncode=${reasonCode}\nreasontext=${reasonText}\nreasonurl=${reasonUrl}`
    );
}

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
        sendLoginFailure(
            res,
            'INV-100',
            'Opps!',
            'https://winehq.com',
            400
        );
        return;
    }
    // Ensure both are strings (Express query params can be string|string[]|undefined)
    if (Array.isArray(username)) username = username[0];
    if (Array.isArray(password)) password = password[0];
    // Use await for checkCredentials
    const valid = await checkCredentials(username as string, password as string);
    if (!valid) {
        sendLoginFailure(
            res,
            'INV-100',
            'Opps!',
            'https://winehq.com',
            400
        );
        return;
    }
    // Generate a ticket (for now, use username as a placeholder)
    const ticket = username as string; // Replace with real ticket logic if needed
    sendLoginSuccess(res, ticket);
});

export default router;
