// ============================================
// history.controller.js - History Controller
// ============================================
// Handles interview history CRUD operations.
// ============================================

import * as historyService from '../services/history.service.js';

/**
 * GET /api/history
 * Get paginated interview history.
 */
export const getHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;

    const result = await historyService.getHistory(req.user._id, page, limit);
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/history/:id
 * Delete a single interview from history.
 */
export const deleteHistoryItem = async (req, res, next) => {
  try {
    const result = await historyService.deleteInterview(req.params.id, req.user._id);
    return res.json({ success: true, data: result });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};

/**
 * DELETE /api/history
 * Clear all interview history.
 */
export const clearHistory = async (req, res, next) => {
  try {
    const result = await historyService.clearHistory(req.user._id);
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
