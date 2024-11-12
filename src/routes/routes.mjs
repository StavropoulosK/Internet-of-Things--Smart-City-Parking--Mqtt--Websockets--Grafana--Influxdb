import express from 'express';

const api = await import('../api/directions.mjs');

const router = express.Router();

router.get('/api/directions', async (req, res) => {
    const { origin, destination } = req.query;
    try {
        const response = await api.getDirections(origin, destination);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching directions' });
    }
});

export default router;