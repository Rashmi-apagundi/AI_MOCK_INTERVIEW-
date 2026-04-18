// ============================================
// history.routes.js - Interview History Routes
// ============================================
// GET    /api/history      → Get paginated history
// DELETE /api/history/:id  → Delete single interview
// DELETE /api/history      → Clear all history
// ============================================

import { Router } from 'express';
import authenticate from '../middleware/auth.middleware.js';
import { getHistory, deleteHistoryItem, clearHistory } from '../controllers/history.controller.js';

const router = Router();

// All history routes require authentication
router.use(authenticate);

router.get('/', getHistory);
router.delete('/:id', deleteHistoryItem);
router.delete('/', clearHistory);

export default router;
