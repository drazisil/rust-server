// src/express-app.ts
import express from 'express';

const app = express();
app.use(express.json());

// Example route for demonstration
app.all('*', (req, res) => {
    res.status(200).send('Request forwarded to Express server.');
});

export default app;
