// backend/routes/admin.js
import express from 'express';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
const router = express.Router();

router.use(verifyToken, requireAdmin);

router.get('/dashboard-stats', async (req, res) => {
  // only admins reach here
  const stats = await computeAdminStats();
  res.json(stats);
});

export default router;
