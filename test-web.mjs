import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// File path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Start the server on port 3000
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'test.html'));
});

const httpPort = 3001;
app.listen(httpPort, () => console.log(`HTTP server running at  http://127.0.0.1:${httpPort}/`));