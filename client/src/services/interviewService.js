// ============================================
// interviewService.js - Interview API Calls
// ============================================
// Reference: Axios POST/GET requests - reference-javascript.md
// ============================================

import API from './api.js';

/**
 * Upload a PDF resume for parsing.
 */
const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append('resume', file);
  const response = await API.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
};

/**
 * Get the user's saved resume text.
 */
const getResume = async () => {
  const response = await API.get('/resume');
  return response.data.data;
};

/**
 * Start a new interview session.
 */
const startInterview = async (role, difficulty, resumeText) => {
  const response = await API.post('/interview/start', { role, difficulty, resumeText });
  return response.data.data;
};

/**
 * Get interview data (in-progress or completed).
 */
const getInterview = async (interviewId) => {
  const response = await API.get(`/interview/${interviewId}`);
  return response.data.data;
};

/**
 * Submit a text answer for the current question.
 */
const submitTextAnswer = async (interviewId, answer) => {
  const response = await API.post(`/interview/${interviewId}/answer`, { answer });
  return response.data.data;
};

/**
 * Transcribe an audio blob to text.
 */
const transcribeAudio = async (audioBlob) => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  const response = await API.post(`/interview/transcribe`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
};

/**
 * Submit a code answer for the current question.
 */
const submitCode = async (interviewId, code, language) => {
  const response = await API.post(`/interview/${interviewId}/code`, { code, language });
  return response.data.data;
};

/**
 * End the interview and generate feedback.
 */
const endInterview = async (interviewId) => {
  const response = await API.post(`/interview/${interviewId}/end`);
  return response.data.data;
};

export { uploadResume, getResume, startInterview, getInterview, submitTextAnswer, transcribeAudio, submitCode, endInterview };
