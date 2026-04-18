// ============================================
// interview.controller.js - Interview Controller
// ============================================
// Handles HTTP requests for interview operations.
// Flow: Route → Controller → Service
// ============================================

import * as interviewService from '../services/interview.service.js';

/**
 * POST /api/interview/start
 * Start a new interview session.
 */
export const startInterview = async (req, res, next) => {
  try {
    const { role, difficulty, resumeText } = req.body;

    if (!role) {
      return res.status(400).json({ success: false, message: 'Role is required.' });
    }

    const result = await interviewService.startInterview(
      req.user._id, role, difficulty || 'medium', resumeText || ''
    );

    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};

/**
 * GET /api/interview/:id
 * Get interview data (current state or completed feedback).
 */
export const getInterview = async (req, res, next) => {
  try {
    const result = await interviewService.getInterview(req.params.id, req.user._id);
    return res.json({ success: true, data: result });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};

/**
 * POST /api/interview/:id/answer
 * Submit a text answer for the current question.
 */
export const submitTextAnswer = async (req, res, next) => {
  try {
    const { answer } = req.body;

    if (!answer || !answer.trim()) {
      return res.status(400).json({ success: false, message: 'Answer is required.' });
    }

    const result = await interviewService.submitTextAnswer(
      req.params.id, req.user._id, answer
    );

    return res.json({ success: true, data: result });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};

/**
 * POST /api/interview/:id/code
 * Submit a code answer for the current question.
 */
export const submitCode = async (req, res, next) => {
  try {
    const { code, language } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Code is required.' });
    }

    const result = await interviewService.submitCode(
      req.params.id, req.user._id, code, language || 'javascript'
    );

    return res.json({ success: true, data: result });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};

/**
 * POST /api/interview/:id/transcribe
 * Transcribe an audio recording to text.
 */
export const transcribeAudio = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Audio file is required.' });
    }

    const result = await interviewService.transcribeAudioAnswer(req.file.buffer);
    return res.json({ success: true, data: result });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};

/**
 * POST /api/interview/:id/end
 * End the interview and generate final feedback.
 */
export const endInterview = async (req, res, next) => {
  try {
    const result = await interviewService.endInterview(req.params.id, req.user._id);
    return res.json({ success: true, data: result });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};
