import dotenv from 'dotenv';
dotenv.config();

// Accept comma-separated list of ports
export const HOST = process.env.HOST || '0.0.0.0';
export const PORTS = process.env.PORT
  ? process.env.PORT.split(',').map((p) => parseInt(p.trim(), 10))
  : [3000];
