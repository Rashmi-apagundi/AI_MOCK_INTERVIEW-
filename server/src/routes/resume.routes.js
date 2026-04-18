// ============================================
// resume.routes.js - Resume Routes
// ============================================
// POST /api/resume/upload → Upload and parse PDF
// GET  /api/resume        → Get saved resume text
// ============================================

import { Router } from 'express';
import authenticate from '../middleware/auth.middleware.js';
import { uploadResume as uploadResumeMiddleware } from '../middleware/upload.middleware.js';
import { uploadResume, getResume } from '../controllers/resume.controller.js';

const router = Router();

// All resume routes require authentication
router.use(authenticate);

router.post('/upload', uploadResumeMiddleware, uploadResume);
router.get('/', getResume);

export default router;
