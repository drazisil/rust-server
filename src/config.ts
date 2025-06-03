import dotenv from 'dotenv';
dotenv.config();

export const HOST = process.env.HOST || '0.0.0.0';
export const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
