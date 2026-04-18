// ============================================
// interview.routes.js - Interview Routes
// ============================================
// POST /api/interview/start    → Start new interview
// GET  /api/interview/:id      → Get interview data
// POST /api/interview/:id/answer    → Submit text answer
// POST /api/interview/:id/code      → Submit code answer
// POST /api/interview/:id/transcribe → Transcribe audio
// POST /api/interview/:id/end       → End interview
// ============================================

import { Router } from 'express';
import authenticate from '../middleware/auth.middleware.js';
import { uploadAudio } from '../middleware/upload.middleware.js';
import {
  startInterview,
  getInterview,
  submitTextAnswer,
  submitCode,
  transcribeAudio,
  endInterview,
} from '../controllers/interview.controller.js';

const router = Router();

// All interview routes require authentication
router.use(authenticate);

router.post('/start', startInterview);
router.post('/transcribe', uploadAudio, transcribeAudio);
router.get('/:id', getInterview);
router.post('/:id/answer', submitTextAnswer);
router.post('/:id/code', submitCode);
router.post('/:id/transcribe', uploadAudio, transcribeAudio);
router.post('/:id/end', endInterview);

export default router;
