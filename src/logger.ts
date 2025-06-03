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

if (process.stdout.isTTY) {
    // Pretty print to console if running interactively
    streams.push({
        stream: pino.transport({
            target: 'pino-pretty',
            options: { colorize: true }
        })
    });
}

export const logger = pino(
    {
        level: process.env.LOG_LEVEL || 'info',
    },
    pino.multistream(streams)
);
