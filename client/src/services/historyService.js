// ============================================
// historyService.js - History API Calls
// ============================================
// Reference: Axios GET/DELETE requests - reference-javascript.md
// ============================================

import API from './api.js';

/**
 * Get paginated interview history.
 */
const getHistory = async (page = 1, limit = 8) => {
  const response = await API.get(`/history?page=${page}&limit=${limit}`);
  return response.data.data;
};

/**
 * Delete a single interview from history.
 */
const deleteHistoryItem = async (interviewId) => {
  const response = await API.delete(`/history/${interviewId}`);
  return response.data.data;
};

/**
 * Clear all interview history.
 */
const clearHistory = async () => {
  const response = await API.delete('/history');
  return response.data.data;
};

export { getHistory, deleteHistoryItem, clearHistory };
