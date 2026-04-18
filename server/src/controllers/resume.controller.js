// ============================================
// resume.controller.js - Resume Controller
// ============================================
// Handles resume upload and retrieval.
// ============================================

import * as resumeService from '../services/resume.service.js';
import User from '../models/User.model.js';

/**
 * POST /api/resume/upload
 * Upload and parse a PDF resume.
 */
export const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'PDF file is required.' });
    }

    // Parse the PDF
    const resumeText = await resumeService.parseResume(req.file.buffer);

    if (!resumeText || resumeText.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Could not extract text from the PDF. Please try a different file.' });
    }

    // Store the resume text on the user record for reuse
    await User.findByIdAndUpdate(req.user._id, {
      resumeText,
      resumeFileName: req.file.originalname,
    });

    return res.json({
      success: true,
      data: {
        resumeText,
        fileName: req.file.originalname,
      },
    });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};

/**
 * GET /api/resume
 * Get the user's previously uploaded resume text.
 */
export const getResume = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('resumeText resumeFileName');

    return res.json({
      success: true,
      data: {
        resumeText: user?.resumeText || '',
        fileName: user?.resumeFileName || '',
      },
    });
  } catch (error) {
    next(error);
  }
};
