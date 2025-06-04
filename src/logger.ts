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

import pino from 'pino';
import fs from 'fs';
import path from 'path';

const logDir = process.env.LOG_DIR || 'logs';
const logFile = process.env.LOG_FILE || 'app.log';
const logPath = path.join(logDir, logFile);

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const streams = [
    // JSON log file
    { stream: fs.createWriteStream(logPath, { flags: 'a' }) },
];

// Create a logger factory that attaches a module label
export function createLogger(module: string) {
    // Use pino-pretty for pretty printing in development (stdout)
    const isTTY = process.stdout.isTTY;
    const usePretty = process.env.NODE_ENV !== 'production' && isTTY;
    return pino({
        base: undefined,
        mixin() {
            return { module };
        },
        transport: usePretty
            ? {
                  target: 'pino-pretty',
                  options: {
                      colorize: true,
                      translateTime: 'SYS:standard',
                  },
              }
            : undefined,
    });
}

// Default logger for backward compatibility (main/server)
export const logger = createLogger('server');
