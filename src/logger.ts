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
