// ============================================
// history.service.js - Interview History Service
// ============================================
// CRUD operations for interview history.
// ============================================

import Interview from '../models/Interview.model.js';

/**
 * Get paginated interview history for a user.
 */
export const getHistory = async (userId, page = 1, limit = 8) => {
  const skip = (page - 1) * limit;

  const [interviews, total] = await Promise.all([
    Interview.find({ user: userId })
      .select('-questions.audioBase64 -resumeText')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Interview.countDocuments({ user: userId }),
  ]);

  return {
    interviews,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Delete a single interview.
 */
export const deleteInterview = async (interviewId, userId) => {
  const interview = await Interview.findOneAndDelete({
    _id: interviewId,
    user: userId,
  });

  if (!interview) {
    const error = new Error('Interview not found');
    error.statusCode = 404;
    throw error;
  }

  return { message: 'Interview deleted successfully' };
};

/**
 * Clear all interview history for a user.
 */
export const clearHistory = async (userId) => {
  const result = await Interview.deleteMany({ user: userId });
  return { deletedCount: result.deletedCount };
};
